import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";

/*
 * A Table's roving tab stop lives in the DOM, like an uncontrolled input's value: exactly one
 * element the table owns (a cell, or the single widget a body cell delegates to) has
 * tabindex="0", and that attribute is the only record of where Tab enters the grid and returns
 * to. Nothing in JavaScript remembers it. These functions read and move it: the table runs
 * `mountStop` when it attaches, `moveStop` from its event handlers, and `normalize` from a content
 * observer with its mutation records; each cell runs `adoptCell` when its element attaches.
 *
 * A tabindex="0" is trusted only where the table could have written it. Cells render a value once
 * per component (`useTableCell`), so a new element for the cell the server rendered first carries
 * 0 again, and a consumer may render a widget with `tabIndex={0}` (a router link, a custom
 * button) or switch one to it. Neither is the stop: an element that has just appeared, or whose
 * tabindex React just set, never takes it from one that was there. A cell inside a Suspense
 * boundary's server HTML is written only after React has hydrated it (`serverHtml`). One limit
 * remains: a Suspense boundary inside a cell is part of that cell's content, so its widgets are
 * written when the cell attaches even if the inner boundary has not hydrated, and React logs an
 * attribute mismatch in development when it does. Hydration changes nothing in the DOM, so no
 * later pass could tell when those widgets may be written instead.
 */

/**
 * A grid owns its cells and their widgets under its own tab stop, even nested in a cell. That
 * includes a grid that is not a Table (a Calendar), whose cells carry no owner id.
 */
export const GRID_SELECTOR = "[role='grid'], [role='treegrid']";

/**
 * The table renders its id as `data-comp0-root` and each cell renders the same id as
 * `data-comp0-owner`, so a cell names the table it belongs to. A consumer's plain `td` carries
 * none and is content; a Table nested in a cell has its own id.
 */
export const ROOT_ATTRIBUTE = "data-comp0-root";
export const OWNER_ATTRIBUTE = "data-comp0-owner";
const CELL_SELECTOR = `[${OWNER_ATTRIBUTE}]`;

/** An attribute selector value in quotes; `useId` never emits a quote or backslash. */
const quoted = (value: string) => `"${value.replace(/["\\]/g, "\\$&")}"`;

/** The Table a cell names as its owner, if it sits inside it. */
function gridOf(cell: Element) {
  const id = cell.getAttribute(OWNER_ATTRIBUTE);
  return id === null ? null : cell.closest(`[${ROOT_ATTRIBUTE}=${quoted(id)}]`);
}

/** The attributes that make a cell's content focusable or not; see `cellWidgets`. */
export const CELL_WIDGET_ATTRIBUTES = ["aria-hidden", "disabled", "href", "tabindex"];

/**
 * The cell of `grid` that holds `element`, or `element` itself when it is one. A plain table a
 * consumer nests in a cell is part of that cell's content, since its `td`s are not comp0 cells;
 * a grid nested in the cell (another Table, a Calendar) keeps its cells, so an element inside it
 * belongs to no cell of `grid`.
 */
export function ownerCell(element: Element, grid: Element | null): HTMLTableCellElement | null {
  if (!grid || element.closest(GRID_SELECTOR) !== grid) return null;
  const cell = element.closest<HTMLTableCellElement>(CELL_SELECTOR);
  const id = grid.getAttribute(ROOT_ATTRIBUTE);
  return cell && id !== null && cell.getAttribute(OWNER_ATTRIBUTE) === id ? cell : null;
}

/** The cells `grid` owns, in document order. */
export function ownedCells(grid: Element) {
  const id = grid.getAttribute(ROOT_ATTRIBUTE);
  if (id === null) return [];
  return [...grid.querySelectorAll<HTMLTableCellElement>(`[${OWNER_ATTRIBUTE}=${quoted(id)}]`)];
}

/** An element that takes part in a grid's arrow-key navigation as a widget inside a cell. */
function isWidget(element: HTMLElement) {
  return (
    !element.matches(CELL_SELECTOR) &&
    !element.matches(":disabled") &&
    element.getAttribute("aria-hidden") !== "true"
  );
}

/**
 * The enabled interactive elements inside a cell, in document order, including those of a plain
 * table nested in it. A nested grid keeps its own widgets under its own tab stop.
 */
export function cellWidgets(cell: HTMLTableCellElement) {
  const grid = gridOf(cell);
  return [...cell.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => isWidget(element) && ownerCell(element, grid) === cell,
  );
}

/**
 * A body cell holding exactly one widget hands its grid stop to the widget (the checkbox-column
 * case). Header cells always stay stops themselves so sorting and resizing remain reachable.
 */
function delegatedWidget(cell: HTMLTableCellElement) {
  if (cell.tagName !== "TD") return undefined;
  const widgets = cellWidgets(cell);
  return widgets.length === 1 ? widgets[0] : undefined;
}

/** Where vertical navigation and the roving tab stop land for a cell. */
export function primaryStop(cell: HTMLTableCellElement): HTMLElement {
  return delegatedWidget(cell) ?? cell;
}

/**
 * The inline-axis stops of a row: each cell, then the widgets inside it, with delegated
 * single-widget cells collapsing to the widget.
 */
export function rowStops(row: HTMLTableRowElement) {
  const stops: HTMLElement[] = [];
  for (const cell of row.cells) {
    const delegated = delegatedWidget(cell);
    if (delegated) {
      stops.push(delegated);
      continue;
    }
    stops.push(cell, ...cellWidgets(cell));
  }
  return stops;
}

/**
 * Where the stop goes when focus lands on `target`: the cell's primary stop when focus is on the
 * cell itself or its delegated widget, else the cell, so Tab returns to the cell whose widget
 * was used. `null` when `target` is in no cell of `grid`.
 */
export function focusStop(grid: Element, target: Element): HTMLElement | null {
  const cell = ownerCell(target, grid);
  if (!cell) return null;
  const primary = primaryStop(cell);
  return target === cell || target === primary ? primary : cell;
}

const STOP = "[tabindex='0']";

/** The owned elements carrying tabindex="0", in document order: one, once the table settled. */
function ownedStops(grid: Element) {
  return [...grid.querySelectorAll<HTMLElement>(STOP)].filter((element) =>
    Boolean(ownerCell(element, grid)),
  );
}

type Holder = { element: HTMLElement; cell: HTMLTableCellElement };

function holdersOf(grid: Element): Holder[] {
  return ownedStops(grid).map((element) => ({ element, cell: ownerCell(element, grid)! }));
}

/**
 * Of several elements at 0, the one the table most likely wrote: a cell's own 0, then a delegated
 * widget's, then any widget's (a delegated widget that gained a sibling).
 */
function likeliest(holders: readonly Holder[]) {
  return (
    holders.find(({ element, cell }) => element === cell) ??
    holders.find(({ element, cell }) => element === primaryStop(cell)) ??
    holders[0]
  );
}

/** Whether `root` is, or holds, an element of `grid` at tabindex="0". */
function holdsStop(root: Element, grid: Element) {
  if (root.matches(STOP) && ownerCell(root, grid)) return true;
  const first = root.querySelector(STOP);
  if (!first) return false;
  if (ownerCell(first, grid)) return true;
  // The first one belongs to a grid nested in a cell; look at the rest.
  for (const element of root.querySelectorAll(STOP)) if (ownerCell(element, grid)) return true;
  return false;
}

/**
 * Whether an owned element outside `cell` is at 0. It looks through the siblings of the cell and
 * of each ancestor up to the grid, everything after the cell before anything before it. When one
 * commit attaches many cells that each carry a 0 (a consumer widget rendered with `tabIndex={0}`),
 * each finds the next one's 0 right after itself, so the commit stays linear in its cells instead
 * of scanning the whole grid once per cell.
 */
function stopOutside(grid: Element, cell: Element) {
  for (const step of ["nextElementSibling", "previousElementSibling"] as const) {
    for (let node: Element | null = cell; node && node !== grid; node = node.parentElement) {
      for (let sibling = node[step]; sibling; sibling = sibling[step]) {
        if (holdsStop(sibling, grid)) return true;
      }
    }
  }
  return false;
}

/** The owned cell or widget with tabindex="0": the grid's tab stop. */
export function currentStop(grid: Element): HTMLElement | null {
  return ownedStops(grid)[0] ?? null;
}

/** Writes a tabindex only when it differs, so the table's observer settles on its own writes. */
function writeTabIndex(element: HTMLElement, value: 0 | -1) {
  const next = String(value);
  if (element.getAttribute("tabindex") !== next) element.setAttribute("tabindex", next);
}

/**
 * Makes `stop` the grid's one tab stop. It must be an owned cell or a widget inside one. A stop in
 * server HTML React has not hydrated is left alone, and so is a target there: its cell takes the
 * stop when it attaches with focus inside (`adoptCell`), and lowers a stale 0 it carries then.
 */
export function moveStop(grid: Element, stop: HTMLElement) {
  const cell = ownerCell(stop, grid);
  if (!cell) return;
  const pending = serverHtml(grid);
  if (pending(cell)) return;
  for (const holder of holdersOf(grid)) {
    if (holder.element !== stop && !pending(holder.cell)) writeTabIndex(holder.element, -1);
  }
  writeTabIndex(stop, 0);
}

/**
 * Puts one cell's own attributes in line with `stop`: the cell and every widget inside it are -1
 * except `stop` itself, so Tab never reaches a widget in a cell. It writes nothing outside `cell`.
 */
function repairCell(grid: Element, cell: HTMLTableCellElement, stop: HTMLElement | null) {
  writeTabIndex(cell, cell === stop ? 0 : -1);
  for (const widget of cellWidgets(cell)) writeTabIndex(widget, widget === stop ? 0 : -1);
  // A widget that stopped counting (now disabled or hidden) may still carry the old stop.
  for (const element of cell.querySelectorAll<HTMLElement>("[tabindex='0']")) {
    if (element !== stop && ownerCell(element, grid) === cell) writeTabIndex(element, -1);
  }
}

// The comments React writes around a Suspense or Activity boundary in server HTML.
const BOUNDARY_START = new Set(["$", "$?", "$~", "$!", "&"]);
const BOUNDARY_END = new Set(["/$", "/&"]);
const SHOW_ELEMENT = 0x1;
const SHOW_COMMENT = 0x80;

/**
 * The cell elements that have attached at least once (`adoptCell`): mounted on the client, or
 * hydrated. It records only that React attached an element, never which cell holds the stop.
 */
const attachedElements = new WeakSet<Element>();

/**
 * The grid and cell elements whose ref is attached now. An `<Activity>` that hides them, or a
 * Suspense boundary that suspends again, detaches the ref while the element stays in the document
 * with `display: none`, where its tabindex="0" would make Tab skip the grid.
 */
const liveElements = new WeakSet<Element>();

/** The cells inside a Suspense or Activity boundary's server HTML, in one walk of the grid. */
function boundaryCells(grid: Element) {
  const cells = new Set<Element>();
  const walker = grid.ownerDocument.createTreeWalker(grid, SHOW_ELEMENT | SHOW_COMMENT);
  let depth = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (isElement(node)) {
      if (depth > 0 && node.matches(CELL_SELECTOR)) cells.add(node);
    } else if (BOUNDARY_START.has((node as Comment).data)) {
      depth += 1;
    } else if (BOUNDARY_END.has((node as Comment).data) && depth > 0) {
      depth -= 1;
    }
  }
  return cells;
}

/**
 * Whether a cell is server HTML React has not hydrated: it sits inside a Suspense or Activity
 * boundary (complete in the shell, or swapped in by React's streaming script) and has not
 * attached. React hydrates a boundary after the commit that hydrates its parent and reports a
 * mismatch for any attribute written to it before then; once a cell attaches, `adoptCell` repairs
 * it. React keeps the boundary comments after hydrating, so the comments alone cannot tell. The
 * grid is walked at most once per call, and only when a cell asked about has not attached.
 */
function serverHtml(grid: Element) {
  let inBoundary: Set<Element> | undefined;
  return (cell: Element) => {
    if (attachedElements.has(cell)) return false;
    inBoundary ??= boundaryCells(grid);
    return inBoundary.has(cell);
  };
}

/**
 * Whether a cell of `grid` may hold the stop. A cell React hides without removing it (an
 * `<Activity>`, a boundary that suspended again, or one mounted hidden) stays in the document with
 * its ref detached, and a stop there would make Tab skip the grid. Only a grid React has attached
 * knows which cells are attached, so for any other (a bare DOM) every cell may hold it. Server
 * HTML React has not hydrated yet is not attached either but may keep the server's stop.
 */
function visibleTo(grid: Element, pending: (cell: Element) => boolean) {
  const attached = liveElements.has(grid);
  return (cell: Element) => !attached || liveElements.has(cell) || pending(cell);
}

/**
 * The table's pass when its element attaches. On the element's first attach nothing at 0 is the
 * table's yet: a widget at 0 came from the consumer, widgets in server HTML keep their native Tab
 * stops, and a server that rendered a row late may have put the stop on a later cell than the
 * client render did. So no existing value is trusted: the stop goes to the cell holding focus
 * (the user may have focused a widget in server HTML before hydration), else to the first cell,
 * which is where the client render put it. When React attaches the same element again without
 * remounting it (an `<Activity>` hid and showed it), `remounted` keeps the stop the table wrote
 * before; the observer was disconnected meanwhile, so every cell is still repaired. Server HTML
 * inside a Suspense boundary may not have hydrated yet, and writing to it would make React report
 * a mismatch, so those cells keep their values until they attach and `adoptCell` repairs them
 * (`serverHtml`).
 */
export function mountStop(grid: Element, remounted = false) {
  const cells = ownedCells(grid);
  const pending = serverHtml(grid);
  const shown = visibleTo(grid, pending);
  const first = cells.find(shown) ?? cells[0];
  if (!first) return;
  const writable = cells.filter((cell) => !pending(cell));
  const active = grid.ownerDocument.activeElement;
  let stop = active ? focusStop(grid, active) : null;
  if (!stop && remounted) {
    const kept = likeliest(holdersOf(grid).filter(({ cell }) => shown(cell)));
    stop = kept ? primaryStop(kept.cell) : null;
  }
  if (!stop) {
    // A first cell still in server HTML keeps the stop the server gave it.
    const held = first.getAttribute("tabindex") === "0";
    const target = writable.find(shown);
    stop = primaryStop(target === undefined || held ? first : target);
  }
  for (const cell of writable) repairCell(grid, cell, stop);
}

/**
 * The table's ref callback. On the element's first attach it puts the stop in the DOM
 * (`mountStop`); when React attaches the same element again without remounting it (an
 * `<Activity>` hid and showed the table), it keeps the stop the table wrote before. One observer
 * then repairs the invariant after each content change (`normalize`): consumer content can change
 * inside a cell without re-rendering it (a component updating its own state, a row removed).
 */
export function attachGrid(grid: HTMLTableElement | null) {
  if (!grid) return;
  // Live first, so `mountStop` knows which cells React shows (`visibleTo`).
  liveElements.add(grid);
  mountStop(grid, attachedElements.has(grid));
  attachedElements.add(grid);
  const Observer = grid.ownerDocument.defaultView?.MutationObserver;
  const observer = Observer ? new Observer((records) => normalize(grid, records)) : null;
  observer?.observe(grid, {
    subtree: true,
    childList: true,
    attributeFilter: CELL_WIDGET_ATTRIBUTES,
  });
  return () => {
    liveElements.delete(grid);
    observer?.disconnect();
  };
}

/**
 * Runs when a cell's element attaches: on a client mount, after it hydrates (including inside a
 * Suspense boundary that hydrated after the table), when React replaces it, and when an
 * `<Activity>` shows it again. It writes only inside its own cell, which React has just attached,
 * unless focus is already in it. A fresh cell holds the stop only if it carries 0 itself, or its
 * single widget does, and no other owned element does (`stopOutside`, which reads past the cell
 * only in that case): a new element for the cell the server rendered first carries the 0 its
 * component decided at mount, which must not take the stop back from where the user left it. An
 * element attaching again keeps its 0, which the table wrote: React renders a cell's tabIndex
 * once, and the table lowered every consumer 0 in the cell when it first attached. One limit: the
 * observer is disconnected while an `<Activity>` hides the table, so a consumer 0 React commits to
 * a widget in that time is not lowered, and on a delegated widget it can take the stop on show.
 */
export function adoptCell(cell: HTMLTableCellElement | null) {
  const grid = cell ? gridOf(cell) : null;
  if (!cell || !grid || ownerCell(cell, grid) !== cell) return;
  const reattached = attachedElements.has(cell);
  attachedElements.add(cell);
  liveElements.add(cell);
  const active = cell.ownerDocument.activeElement;
  const focused = active && cell.contains(active) ? focusStop(grid, active) : null;
  if (focused) {
    moveStop(grid, focused);
    repairCell(grid, cell, focused);
  } else {
    const primary = primaryStop(cell);
    let stop: HTMLElement | null = null;
    if (cell.getAttribute("tabindex") === "0" || primary.getAttribute("tabindex") === "0") {
      if (reattached || !stopOutside(grid, cell)) stop = primary;
    }
    repairCell(grid, cell, stop);
  }
  return () => {
    releaseCell(grid, cell);
  };
}

/**
 * Runs when a cell's ref detaches. React detaches it before removing the element, before replacing
 * it, and when it hides the element without removing it (an `<Activity>`, or a Suspense boundary
 * that suspends again). Only the last leaves a hidden cell in the document, and if it holds the
 * stop, Tab would skip the grid, so the stop moves to the first cell still attached. A microtask
 * tells the cases apart once React has committed: a removed element is gone from the document,
 * a replaced or shown one is attached again, and a hidden table detached itself first.
 */
function releaseCell(grid: Element, cell: HTMLTableCellElement) {
  liveElements.delete(cell);
  queueMicrotask(() => {
    if (!cell.isConnected || liveElements.has(cell) || !liveElements.has(grid)) return;
    if (!holdsStop(cell, grid)) return;
    const next = ownedCells(grid).find((other) => liveElements.has(other));
    if (next) moveStop(grid, primaryStop(next));
  });
}

/** The owned cell at the place of `removed`, followed down the same child path in `added`. */
function counterpart(removed: Element, cell: Element, added: Element) {
  const path: number[] = [];
  for (let node: Element = cell; node !== removed; node = node.parentElement!) {
    path.unshift([...node.parentElement!.children].indexOf(node));
  }
  let node: Element | undefined = added;
  for (const index of path) node = node?.children[index];
  return node;
}

/**
 * The cell that inherits a stop removed in `records`. A widget holding the stop that the consumer
 * swapped out leaves it to the cell that held it. A cell (or a row holding it) that React replaced
 * with a new element, because its `as` changed or a header gained `onResize`, passes it to the
 * cell at the same place in the new element. Only the DOM is read: the removed nodes still carry
 * their attributes.
 */
function inheritor(grid: Element, records: readonly MutationRecord[]) {
  const added = records.flatMap((record) => [...record.addedNodes]);
  for (const record of records) {
    for (const removed of record.removedNodes) {
      if (!isElement(removed) || removed.isConnected) continue;
      const holder = [removed, ...removed.querySelectorAll("[tabindex='0']")].find(
        (element) => element.matches("[tabindex='0']") && !element.closest(GRID_SELECTOR),
      );
      if (!holder) continue;
      const parent = isElement(record.target) ? record.target : null;
      const owner = parent ? ownerCell(parent, grid) : null;
      if (owner) return owner;
      const cell = holder.closest(CELL_SELECTOR);
      if (!cell) continue;
      // Only a node between the same two siblings took its place: a row replaced by several
      // (a loading row by data rows, a page by the next) has no one heir, and the stop falls
      // back to the first cell.
      for (const node of added) {
        if (!isElement(node) || node.parentNode !== record.target) continue;
        const samePlace =
          node.previousSibling === record.previousSibling &&
          node.nextSibling === record.nextSibling;
        if (!samePlace) continue;
        const next = counterpart(removed, cell, node);
        if (next && ownerCell(next, grid) === next) return next as HTMLTableCellElement;
      }
    }
  }
  return null;
}

/**
 * Restores the grid's invariant after its content changed: exactly one owned stop, a delegating
 * `td` never being it (its widget is), and every other widget at -1 so Tab never stops there.
 *
 * Only the DOM and the observer's `records` are read. The stop is, in order: in the cell holding
 * focus; in the cell that inherits a removed stop (`inheritor`); in a cell that carries 0 where the
 * table could have written it (`likeliest`); else the first cell. Of the elements at 0, one that
 * was already there and untouched by the records wins over one whose tabindex a record set, which
 * may be React applying a consumer's `tabIndex={0}` (the table's own writes land there too, so
 * they still win over server HTML and new elements); next comes a 0 in server HTML React has not
 * hydrated. Elements the records added never win over those, because their 0 was not written by
 * the table: a consumer widget rendered with `tabIndex={0}`, or a new element for the cell the
 * server rendered first.
 *
 * Writes stay inside the stop's cell, the cells a record's target lies in (a cell that attached
 * earlier in the same batch included, since its content may have changed after `adoptCell` ran),
 * and stale holders, and never reach server HTML React has not hydrated (`serverHtml`), even as
 * the stop: such a cell keeps the server's values until it attaches and `adoptCell` repairs it. It
 * reads no layout, writes only values that differ, and stays linear in the records: a node is new
 * when it or an ancestor is in the set of added nodes.
 */
export function normalize(grid: Element, records: readonly MutationRecord[] = []) {
  const cells = ownedCells(grid);
  const first = cells[0];
  if (!first) return;
  const removed = new Set<Node>();
  const added = new Set<Node>();
  const targets = new Set<Element>();
  const retabbed = new Set<Node>();
  for (const record of records) {
    for (const node of record.removedNodes) removed.add(node);
    for (const node of record.addedNodes) added.add(node);
    if (record.type === "attributes" && record.attributeName === "tabindex") {
      retabbed.add(record.target);
    }
    const target = isElement(record.target) ? record.target : record.target.parentElement;
    if (target) targets.add(target);
  }
  // A node React moved shows up as removed and added; it is not new.
  for (const node of removed) added.delete(node);
  /** Whether `element` is, or sits in, a node of `added`. */
  const isNew = (element: Element) => {
    if (added.size === 0) return false;
    for (let node: Node | null = element; node && node !== grid; node = node.parentNode) {
      if (added.has(node)) return true;
    }
    return false;
  };
  const pending = serverHtml(grid);

  const changed = new Set<HTMLTableCellElement>();
  for (const target of targets) {
    const cell = target.isConnected ? ownerCell(target, grid) : null;
    if (cell) changed.add(cell);
  }

  const shown = visibleTo(grid, pending);
  const holders = holdersOf(grid);
  const kept = holders.filter(({ element, cell }) => !isNew(element) && shown(cell));
  const live = kept.filter(({ cell }) => !pending(cell));
  const active = grid.ownerDocument.activeElement;
  const focused = active ? focusStop(grid, active) : null;
  const stopCell =
    (focused ? ownerCell(focused, grid) : null) ??
    inheritor(grid, records) ??
    likeliest(live.filter(({ element }) => !retabbed.has(element)))?.cell ??
    likeliest(live)?.cell ??
    likeliest(kept)?.cell ??
    holders.find(({ element, cell }) => element === cell && shown(cell))?.cell ??
    cells.find(shown) ??
    first;
  const stop = focused ?? primaryStop(stopCell);

  if (!pending(stopCell)) repairCell(grid, stopCell, stop);
  for (const cell of changed) {
    if (cell !== stopCell && !pending(cell)) repairCell(grid, cell, null);
  }
  // A second holder is rare; one in server HTML keeps its value until its cell attaches and
  // `adoptCell` settles it.
  for (const { element, cell } of holders) {
    if (cell !== stopCell && !changed.has(cell) && !pending(cell)) writeTabIndex(element, -1);
  }
}

function isElement(node: Node | null | undefined): node is Element {
  return node?.nodeType === 1;
}
