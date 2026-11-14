import { useId, useLayoutEffect, useRef, useState, type Ref } from "react";
import { useComposedRefs, type Collection } from "@comp0/core";
import { useRenderOrderSeed, type CollectionSeed } from "../internal/collection-pass.js";
import { FOCUSABLE_SELECTOR } from "../internal/focusable.js";
import { createRequiredContext } from "../internal/context.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { NO_SELECTION, useIsTabStop, type TabStopStore } from "../internal/tab-stop.js";

export type TableContextValue = {
  /** The document-order registry of the table's header and body cells. */
  cells: Collection;
  /** The render-order record cells fill on the server and while hydrating. */
  seed: CollectionSeed;
  /** The one cell rendered with tabIndex 0; cells read it with `useIsTabStop`. */
  tabStops: TabStopStore;
  /** Rows that carry a value, in document order, for range selection. */
  rows: Collection;
  /**
   * Each mounted cell's widget measurement, by element. The table's content observer runs it
   * when a consumer component changes what is inside the cell on its own.
   */
  cellSyncs: Map<Element, () => void>;
};

export const [TableContext, useTableContext, useOptionalTableContext] =
  createRequiredContext<TableContextValue>("Table");

export type TableColumnContextValue = {
  resize: (width: number) => void;
  element: () => HTMLTableCellElement | null;
};

export const [TableColumnContext, useTableColumnContext, useOptionalTableColumnContext] =
  createRequiredContext<TableColumnContextValue>("TableColumn");

/** A grid owns its cells and their widgets under its own tab stop, even nested in a cell. */
const GRID_SELECTOR = "[role='grid'], [role='treegrid']";

/**
 * The cell of `grid` that holds `element`. A plain table a consumer nests in a cell is part of
 * that cell's content, so its `td`s are walked past; a grid nested in the cell (another Table, a
 * Calendar) keeps its cells, so an element inside it belongs to no cell of `grid`.
 */
export function ownerCell(
  element: Element,
  grid: Element | null,
  owns: (cell: Element) => boolean,
): HTMLTableCellElement | null {
  if (!grid || element.closest(GRID_SELECTOR) !== grid) return null;
  let cell = element.closest("td, th");
  while (cell && !owns(cell)) cell = cell.parentElement?.closest("td, th") ?? null;
  return cell as HTMLTableCellElement | null;
}

/**
 * The enabled interactive elements inside a cell, in document order, including those of a plain
 * table nested in it. A nested grid keeps its own widgets under its own tab stop.
 */
function cellWidgets(cell: HTMLTableCellElement) {
  const grid = cell.closest(GRID_SELECTOR);
  return [...cell.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      !element.matches(":disabled") &&
      element.closest(GRID_SELECTOR) === grid,
  );
}

/** The attributes that make a cell's content focusable or not; see `cellWidgets`. */
export const CELL_WIDGET_ATTRIBUTES = ["aria-hidden", "disabled", "href", "tabindex"];

/**
 * A body cell holding exactly one widget hands its grid stop to the widget
 * (the checkbox-column case). Header cells always stay stops themselves so
 * sorting and resizing remain reachable.
 */
function delegatedWidget(cell: HTMLTableCellElement) {
  if (cell.tagName !== "TD") return undefined;
  const widgets = cellWidgets(cell);
  return widgets.length === 1 ? widgets[0] : undefined;
}

/** Where vertical navigation and the roving tab stop land for a cell. */
export function primaryStop(cell: HTMLTableCellElement) {
  return delegatedWidget(cell) ?? cell;
}

/**
 * The inline-axis stops of a row: each cell, then the widgets inside it, with
 * delegated single-widget cells collapsing to the widget.
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

// A cell rendered outside a Table records nothing and never holds a stop, so its hooks still
// run unconditionally.
const DETACHED_SEED: CollectionSeed = {
  add() {},
  resolve: () => null,
  clear() {},
};
const DETACHED_STOPS: TabStopStore = {
  subscribe: () => () => {},
  get: () => "",
  focus() {},
};

/** Registration and roving tabindex shared by header and body cells. */
export function useTableCell(ref: Ref<HTMLTableCellElement> | undefined) {
  const table = useOptionalTableContext();
  const key = useId().replace(/:/g, "");
  // Read the stable registry, seed, and store outside the ref callback: depending on the whole
  // table context would detach and re-register every cell whenever the context changes.
  const cells = table?.cells;
  const cellSyncs = table?.cellSyncs;
  const seed = table?.seed ?? DETACHED_SEED;
  const tabStops = table?.tabStops ?? DETACHED_STOPS;
  const elementRef = useRef<HTMLTableCellElement | null>(null);
  // Cells are never disabled. On the server and while hydrating they record themselves in
  // render order, so the first cell already holds the stop in server HTML; there is no
  // collection pass because its hidden div is invalid inside table markup.
  useRenderOrderSeed(seed, key, false);
  const isTabStop = useIsTabStop(tabStops, key);
  // Whether a body cell hands its stop to its single widget depends on the consumer's content,
  // so it is measured after commit and rendered from state.
  const [delegates, setDelegates] = useState(false);
  let tabIndex = -1;
  if (isTabStop && !delegates) tabIndex = 0;

  // The stop depends on the whole table, which the server can see in another order. The part
  // always passes tabIndex, so it wins over an as={Fragment} child's own.
  useHydrationRepair(elementRef, { tabindex: String(tabIndex) }, () => {
    tabStops.focus(key, NO_SELECTION);
  });
  // In server HTML the widgets inside cells keep their native Tab stops, so the user usually
  // focuses one of them before hydration, not the cell, and no handler records it. Once the cell
  // mounts or hydrates it takes the stop when focus is inside it, unless a grid nested in the
  // cell owns the focused element; the root's onFocus records every later focus.
  const claimedMountFocus = useRef(false);
  useLayoutEffect(() => {
    const cell = elementRef.current;
    if (claimedMountFocus.current || !cell || !table) return;
    claimedMountFocus.current = true;
    const active = cell.ownerDocument.activeElement;
    if (!active || active === cell || !cell.contains(active)) return;
    const owns = (candidate: Element) => candidate === cell || Boolean(cellSyncs?.has(candidate));
    if (ownerCell(active, cell.closest(GRID_SELECTOR), owns) === cell) {
      tabStops.focus(key, NO_SELECTION);
    }
  });

  const registration = (element: HTMLTableCellElement | null) => {
    if (!element || !cells) return;
    cells.register({ key, textValue: "", element });
    // Guarded by element, so a stale cleanup cannot remove a replacement's registration.
    return () => {
      cells.unregister(key, element);
    };
  };
  const cellRef = useComposedRefs<HTMLTableCellElement>(ref, elementRef, registration);

  // Content the cell's own render changes is measured in the same commit. A consumer component
  // inside the cell can also add or remove widgets on its own state, which never re-renders the
  // cell, so the table's content observer runs the same measurement after such a change. It runs
  // after every commit, because the cell's element can change without its children changing
  // (TableColumn gaining onResize, a new `as`), and `cellSyncs` must key the current element.
  // Outside a Table no grid moves focus, so the cell's widgets keep their own Tab stops.
  useLayoutEffect(() => {
    const cell = elementRef.current;
    if (!cell || !cellSyncs) return;
    const sync = () => {
      const delegated = delegatedWidget(cell);
      if (Boolean(delegated) !== delegates) setDelegates(Boolean(delegated));
      // Widgets inside cells are consumer elements comp0 does not render, so their tabIndex is
      // written here ("DOM state" in AGENTS.md). They are reachable with the arrow keys, never
      // with Tab, so the table keeps exactly one tab stop; a delegated widget holds the cell's.
      // Only differing values are written, so the observer settles on its own writes.
      for (const widget of cellWidgets(cell)) {
        const tabIndex = widget === delegated && isTabStop ? 0 : -1;
        if (widget.tabIndex !== tabIndex) widget.tabIndex = tabIndex;
      }
    };
    sync();
    cellSyncs.set(cell, sync);
    return () => {
      cellSyncs.delete(cell);
    };
  });

  return { cellRef, elementRef, tabIndex };
}
