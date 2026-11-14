import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adoptCell,
  CELL_WIDGET_ATTRIBUTES,
  cellWidgets,
  currentStop,
  focusStop,
  mountStop,
  moveStop,
  normalize,
  ownedCells,
  ownerCell,
  primaryStop,
  rowStops,
} from "./table-dom.js";

/** Mounts `html` (rows of a grid) and returns the grid with lookup helpers. */
function grid(html: string) {
  const container = document.createElement("div");
  container.innerHTML = `<table role="grid" data-comp0-root="outer"><tbody>${html}</tbody></table>`;
  document.body.append(container);
  const table = container.querySelector("table")!;
  const byText = (text: string) =>
    [...container.querySelectorAll<HTMLElement>("*")].find(
      (element) => element.textContent === text && element.children.length === 0,
    )!;
  const cellOf = (text: string) => byText(text).closest("td, th") as HTMLTableCellElement;
  /** What carries tabindex="0", by text. */
  const stops = () =>
    [...table.querySelectorAll<HTMLElement>("[tabindex='0']")].map(
      (element) => element.textContent,
    );
  return { container, table, byText, cellOf, stops };
}

/** A cell of the table whose id is `owner`; `grid` renders the one with id "outer". */
const td = (content: string, tabIndex = -1, owner = "outer") =>
  `<td data-comp0-owner="${owner}" tabindex="${tabIndex}">${content}</td>`;
const th = (content: string, tabIndex = -1, owner = "outer") =>
  `<th data-comp0-owner="${owner}" tabindex="${tabIndex}">${content}</th>`;

/** Every tabindex attribute write inside `target` while `run` runs. */
function writesDuring(target: Element, run: () => void) {
  const observer = new MutationObserver(() => {});
  observer.observe(target, { subtree: true, attributeFilter: ["tabindex"] });
  run();
  const records = observer.takeRecords();
  observer.disconnect();
  return records.map((record) => (record.target as Element).textContent);
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ownership", () => {
  it("finds the owned cell of an element, walking past a plain nested table", () => {
    const { table, byText, cellOf } = grid(
      `<tr>${td("a")}${td('<table><tbody><tr><td><button type="button">inner</button></td></tr></tbody></table>')}</tr>`,
    );
    expect(ownerCell(cellOf("a"), table)).toBe(cellOf("a"));
    expect(ownerCell(byText("inner"), table)).toBe(table.rows[0]!.cells[1]);
    expect(ownerCell(table, table)).toBeNull();
    expect(ownerCell(byText("inner"), null)).toBeNull();
  });

  it("leaves the cells and widgets of a nested grid to that grid", () => {
    const { table, byText } = grid(
      `<tr>${td("a")}${td(`<table role="grid" data-comp0-root="inner"><caption>cap</caption><tbody><tr>${td('<button type="button">deep</button>', -1, "inner")}</tr></tbody></table>`)}</tr>`,
    );
    const inner = table.querySelector("table")!;
    expect(ownerCell(byText("deep"), table)).toBeNull();
    expect(ownerCell(byText("deep"), inner)).toBe(byText("deep").closest("td"));
    // The inner grid's caption is in no cell of the inner grid, though an outer cell holds it.
    expect(ownerCell(byText("cap"), inner)).toBeNull();
    expect(ownedCells(table)).toHaveLength(2);
    expect(ownedCells(inner)).toHaveLength(1);
  });

  it("owns only the cells that name it, not a grid that is not a Table", () => {
    const { table, byText } = grid(
      `<tr>${td("a")}${td(`<div role="grid"><div role="row"><button type="button" role="gridcell">day</button></div></div>`)}</tr>`,
    );
    const calendar = table.querySelector<HTMLElement>("[role='grid'] [role='grid']")!;
    // A Calendar in a cell keeps its own widgets, and renders no owner ids for this table.
    expect(ownerCell(byText("day"), table)).toBeNull();
    expect(ownedCells(calendar)).toEqual([]);
    expect(ownedCells(table)).toHaveLength(2);
  });

  it("owns only comp0 cells, not a consumer's plain cells", () => {
    const { table } = grid(`<tr>${td("a")}<td>plain</td></tr>`);
    expect(ownedCells(table).map((cell) => cell.textContent)).toEqual(["a"]);
  });
});

describe("widgets and primary stops", () => {
  it("lists a cell's enabled, visible widgets", () => {
    const { cellOf } = grid(
      `<tr>${td(
        '<button type="button">one</button><button type="button" disabled>off</button>' +
          '<button type="button" aria-hidden="true">hidden</button><a href="#x">two</a>',
      )}</tr>`,
    );
    expect(cellWidgets(cellOf("one")).map((widget) => widget.textContent)).toEqual(["one", "two"]);
  });

  it("delegates a body cell with one widget to it, and never a header or a busier cell", () => {
    const { table, cellOf } = grid(
      `<tr>${th('<button type="button">sort</button>')}${td('<input aria-label="pick" type="checkbox">')}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    const checkbox = table.querySelector("input")!;
    expect(primaryStop(cellOf("sort"))).toBe(cellOf("sort"));
    expect(primaryStop(checkbox.closest("td")!)).toBe(checkbox);
    expect(primaryStop(cellOf("x"))).toBe(cellOf("x"));
  });

  it("walks a row through each cell and its widgets, collapsing delegated cells", () => {
    const { table } = grid(
      `<tr>${td('<input aria-label="pick" type="checkbox">')}${td("name")}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    expect(
      rowStops(table.rows[0]!).map((stop) => stop.textContent || stop.getAttribute("aria-label")),
    ).toEqual(["pick", "name", "xy", "x", "y"]);
  });
});

describe("focusStop", () => {
  const mixed = () =>
    grid(
      `<tr>${td("a")}${td('<input aria-label="pick" type="checkbox">')}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );

  it("is the cell's primary stop for focus on the cell or its delegated widget", () => {
    const { table, cellOf } = mixed();
    const checkbox = table.querySelector("input")!;
    expect(focusStop(table, cellOf("a"))).toBe(cellOf("a"));
    expect(focusStop(table, checkbox.closest("td")!)).toBe(checkbox);
    expect(focusStop(table, checkbox)).toBe(checkbox);
  });

  it("is the cell for focus on one of several widgets, and nothing outside the grid", () => {
    const { table, byText, cellOf } = mixed();
    expect(focusStop(table, byText("x"))).toBe(cellOf("x"));
    expect(focusStop(table, document.body)).toBeNull();
  });
});

describe("moveStop", () => {
  it("makes the target the one owned stop", () => {
    const { table, byText, cellOf, stops } = grid(
      `<tr>${td("a", 0)}${td("b")}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    moveStop(table, cellOf("b"));
    expect(stops()).toEqual(["b"]);
    expect(currentStop(table)).toBe(cellOf("b"));
    moveStop(table, byText("x"));
    expect(stops()).toEqual(["x"]);
  });

  it("ignores a target the grid does not own", () => {
    const { table, cellOf, stops } = grid(`<tr>${td("a", 0)}<td tabindex="-1">plain</td></tr>`);
    moveStop(table, cellOf("plain"));
    expect(stops()).toEqual(["a"]);
  });

  it("writes nothing to server HTML a boundary has not hydrated, until its cell attaches", () => {
    const { table, cellOf, stops } = grid(
      `<tr>${td("a", 0)}${td("b")}</tr><!--$--><tr>${td('<span role="button" tabindex="0">tip</span>')}${td("c")}</tr><!--/$-->`,
    );
    expect(writesDuring(table, () => moveStop(table, cellOf("b")))).toEqual(["a", "b"]);
    expect(stops()).toEqual(["b", "tip"]);
    // A target there is left to its cell too.
    expect(writesDuring(table, () => moveStop(table, cellOf("c")))).toEqual([]);

    // Once React hydrated it, its cell attaches and lowers the stale 0.
    adoptCell(cellOf("tip"));
    expect(stops()).toEqual(["b"]);
    moveStop(table, cellOf("tip"));
    expect(stops()).toEqual(["tip"]);
  });
});

/** The mutation records `change` produces inside `grid`, as the table's observer sees them. */
function recordsOf(grid: Element, change: () => void) {
  const observer = new MutationObserver(() => {});
  observer.observe(grid, {
    subtree: true,
    childList: true,
    attributeFilter: CELL_WIDGET_ATTRIBUTES,
  });
  change();
  const records = observer.takeRecords();
  observer.disconnect();
  return records;
}

describe("mountStop", () => {
  it("puts the stop on the first cell and takes every widget out of Tab", () => {
    // A later cell at 0 (a stop the server rendered out of order) and a consumer's widget at 0
    // are not the table's: nothing at 0 is trusted on mount.
    const { table, byText, stops } = grid(
      `<tr>${td("a")}${td('<span role="button" tabindex="0">info</span>')}</tr><tr>${td("b", 0)}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    mountStop(table);
    expect(stops()).toEqual(["a"]);
    expect(byText("info").getAttribute("tabindex")).toBe("-1");
    expect(byText("x").getAttribute("tabindex")).toBe("-1");
    expect(byText("y").getAttribute("tabindex")).toBe("-1");
  });

  it("hands a delegating first cell's stop to its widget", () => {
    const { table, cellOf } = grid(
      `<tr>${td('<input aria-label="pick" type="checkbox">', 0)}${td("b")}</tr><tr>${td('<input aria-label="other" type="checkbox">')}${td("c")}</tr>`,
    );
    const [pick, other] = table.querySelectorAll("input");
    mountStop(table);
    expect(pick!.closest("td")!.getAttribute("tabindex")).toBe("-1");
    expect(pick!.getAttribute("tabindex")).toBe("0");
    expect(other!.getAttribute("tabindex")).toBe("-1");
    expect(cellOf("b").getAttribute("tabindex")).toBe("-1");
  });

  it("puts the stop where focus already is", () => {
    const { table, byText, cellOf, stops } = grid(
      `<tr>${td("a", 0)}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    byText("y").focus();
    mountStop(table);
    expect(stops()).toEqual(["xy"]);
    expect(currentStop(table)).toBe(cellOf("x"));
    expect(byText("y").getAttribute("tabindex")).toBe("-1");
  });

  it("leaves server HTML inside a Suspense boundary to its cells", () => {
    const boundary = `<!--$--><tr>${td("b", 0)}${td('<button type="button">x</button>')}</tr><!--/$-->`;
    const { table, byText, cellOf, stops } = grid(`${boundary}<tr>${td("c", 0)}${td("d")}</tr>`);
    const writes = writesDuring(table, () => mountStop(table));
    // The boundary's first cell keeps the server's stop; the cell outside it gives up its 0.
    expect(writes).toEqual(["c"]);
    expect(stops()).toEqual(["b"]);
    expect(byText("x").hasAttribute("tabindex")).toBe(false);

    cellOf("b").setAttribute("tabindex", "-1");
    mountStop(table);
    expect(stops()).toEqual(["c"]);
  });

  it("keeps the stop the table wrote when the same element attaches again", () => {
    const { table, byText, stops } = grid(
      `<tr>${td("a")}${td('<input aria-label="pick" type="checkbox" tabindex="0">')}</tr><tr>${td("b")}${td('<button type="button">x</button>')}</tr>`,
    );
    mountStop(table, true);
    expect(currentStop(table)).toBe(table.querySelector("input"));
    // The observer was off meanwhile: content that arrived is still repaired.
    expect(byText("x").getAttribute("tabindex")).toBe("-1");

    mountStop(table);
    expect(stops()).toEqual(["a"]);
  });

  it("does nothing in a grid without cells", () => {
    const { table } = grid(`<tr><td><button type="button">x</button></td></tr>`);
    mountStop(table);
    expect(table.querySelector("button")!.hasAttribute("tabindex")).toBe(false);
  });

  it("finds the cells in server HTML in one walk when every row sits in its own boundary", () => {
    const rows = 300;
    const { table, stops } = grid(
      Array.from(
        { length: rows },
        (_, row) =>
          `<!--$--><tr>${td(`a${row}`, row === 0 ? 0 : -1)}${td(`b${row}`)}</tr><!--/$-->`,
      ).join(""),
    );
    const compare = vi.spyOn(Node.prototype, "compareDocumentPosition");
    const matches = vi.spyOn(Element.prototype, "matches");
    const closest = vi.spyOn(Element.prototype, "closest");

    expect(writesDuring(table, () => mountStop(table))).toEqual([]);
    // Placing each cell against each boundary would make 2 × 600 × 300 comparisons.
    expect(compare.mock.calls.length).toBeLessThan(rows * 2 * 2);
    expect(matches.mock.calls.length + closest.mock.calls.length).toBeLessThan(rows * 2 * 6);
    expect(stops()).toEqual(["a0"]);
  });
});

describe("adoptCell", () => {
  it("takes the widgets of a cell out of Tab and writes nothing outside it", () => {
    const { table, cellOf } = grid(
      `<tr>${td("a", 0)}${td('<button type="button">x</button><button type="button">y</button>')}${td('<button type="button">z</button>')}</tr>`,
    );
    expect(writesDuring(table, () => adoptCell(cellOf("x")))).toEqual(["x", "y"]);
  });

  it("keeps the 0 a new element carries only while no other element holds the stop", () => {
    const { table, cellOf, stops } = grid(
      `<tr>${td('<input aria-label="pick" type="checkbox">', 0)}${td("b", 0)}</tr>`,
    );
    const pickCell = table.querySelector("input")!.closest("td")!;
    adoptCell(pickCell);
    expect(stops()).toEqual(["b"]);

    cellOf("b").setAttribute("tabindex", "-1");
    pickCell.setAttribute("tabindex", "0");
    adoptCell(pickCell);
    expect(pickCell.getAttribute("tabindex")).toBe("-1");
    expect(currentStop(table)).toBe(table.querySelector("input"));
  });

  it("finds another stop by looking after the cell first, so a batch of cells at 0 stays linear", () => {
    const { table, stops } = grid(
      [0, 1, 2, 3]
        .map((row) => `<tr>${td(`<span role="checkbox" tabindex="0">c${row}</span>`)}</tr>`)
        .join(""),
    );
    const queried: Element[] = [];
    const all = vi.spyOn(Element.prototype, "querySelector");
    for (const cell of [...table.querySelectorAll("td")].slice(0, 3)) {
      all.mockClear();
      adoptCell(cell);
      const contexts = all.mock.contexts as Element[];
      queried.push(...contexts.filter((context) => context !== cell && !cell.contains(context)));
    }
    all.mockRestore();
    // Each cell reads only the next row, which still carries its 0.
    expect(queried.every((element) => element.localName === "tr")).toBe(true);
    expect(queried).toHaveLength(3);
    expect(stops()).toEqual(["c3"]);
  });

  it("takes the stop when focus is already inside the cell", () => {
    const { byText, cellOf, stops } = grid(
      `<tr>${td("a", 0)}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    byText("x").focus();
    adoptCell(cellOf("x"));
    expect(stops()).toEqual(["xy"]);
    expect(byText("x").getAttribute("tabindex")).toBe("-1");
  });

  it("leaves a cell outside a grid alone", () => {
    const container = document.createElement("div");
    container.innerHTML = `<table><tbody><tr>${td('<button type="button">x</button>')}</tr></tbody></table>`;
    document.body.append(container);
    adoptCell(container.querySelector("td"));
    expect(container.querySelector("button")!.hasAttribute("tabindex")).toBe(false);
  });
});

describe("normalize", () => {
  it("keeps the stop where it is", () => {
    const { table, stops } = grid(`<tr>${td("a")}${td("b", 0)}</tr>`);
    normalize(table);
    expect(stops()).toEqual(["b"]);
  });

  it("puts the stop on the first cell when the row holding it is removed", () => {
    const { table, stops } = grid(`<tr>${td("a")}${td("b")}</tr><tr>${td("c", 0)}</tr>`);
    const records = recordsOf(table, () => table.rows[1]!.remove());
    normalize(table, records);
    expect(stops()).toEqual(["a"]);
  });

  it("keeps the stop that holds focus when there are several, else the first", () => {
    const { table, cellOf, stops } = grid(`<tr>${td("a", 0)}${td("b", 0)}</tr>`);
    cellOf("b").focus();
    normalize(table);
    expect(stops()).toEqual(["b"]);

    cellOf("a").setAttribute("tabindex", "0");
    cellOf("b").blur();
    normalize(table);
    expect(stops()).toEqual(["a"]);
  });

  it("prefers a cell's own stop over a widget carrying tabindex 0 in another cell", () => {
    const { table, stops } = grid(
      `<tr>${td('<button type="button" tabindex="0">x</button><button type="button">y</button>')}${td("b", 0)}</tr>`,
    );
    normalize(table);
    expect(stops()).toEqual(["b"]);
  });

  it("keeps the stop in a cell whose delegated widget gained a sibling", () => {
    const { table, cellOf, stops } = grid(
      `<tr>${td("a")}${td('<button type="button" tabindex="0">x</button>')}</tr>`,
    );
    const records = recordsOf(table, () =>
      cellOf("x").insertAdjacentHTML("beforeend", '<button type="button">y</button>'),
    );
    normalize(table, records);
    expect(stops()).toEqual(["xy"]);
    expect(currentStop(table)).toBe(cellOf("x"));
    expect(cellOf("x").querySelectorAll("[tabindex='-1']")).toHaveLength(2);
  });

  it("never lets an element the records added take the stop from one that was there", () => {
    const { table, stops } = grid(`<tr>${td("a")}${td("b", 0)}</tr>`);
    const records = recordsOf(table, () =>
      table.tBodies[0]!.insertAdjacentHTML(
        "afterbegin",
        `<tr>${th("new", 0)}${td('<span role="button" tabindex="0">info</span>')}</tr>`,
      ),
    );
    normalize(table, records);
    expect(stops()).toEqual(["b"]);
  });

  it("never lets a widget whose tabindex the records set to 0 take the stop from one that was there", () => {
    const { table, byText } = grid(
      `<tr>${td('<span role="switch" aria-checked="false" tabindex="-1">notify</span>')}</tr><tr>${td('<input aria-label="pick" type="checkbox" tabindex="0">')}</tr>`,
    );
    // React applying a consumer's `tabIndex={on ? 0 : -1}` to an existing element.
    const records = recordsOf(table, () => byText("notify").setAttribute("tabindex", "0"));
    normalize(table, records);
    expect(currentStop(table)).toBe(table.querySelector("input"));
    expect(byText("notify").getAttribute("tabindex")).toBe("-1");
  });

  it("keeps a stop the table set in the previous batch over a server stop a boundary holds", () => {
    const { table, cellOf, stops } = grid(
      `<!--$--><tr>${td("server", 0)}</tr><!--/$--><tr>${td("a", 0)}${td('<input aria-label="pick" type="checkbox">')}</tr>`,
    );
    const input = table.querySelector("input")!;
    const records = recordsOf(table, () => moveStop(table, input));
    expect(writesDuring(table, () => normalize(table, records))).toEqual([]);
    expect(cellOf("a").tabIndex).toBe(-1);
    // The boundary's 0 waits for its cell to attach.
    expect(stops()).toEqual(["server", ""]);
    adoptCell(cellOf("server"));
    expect(currentStop(table)).toBe(input);
  });

  it("writes nothing to server HTML a boundary has not hydrated, even as the stop", () => {
    const { table, cellOf } = grid(
      `<!--$--><tr>${td('<input aria-label="pick" type="checkbox">', 0)}${td("b")}</tr><!--/$--><tr>${td("c")}</tr>`,
    );
    const records = recordsOf(table, () => cellOf("c").append(" more"));
    expect(writesDuring(table, () => normalize(table, records))).toEqual([]);
    expect(currentStop(table)).toBe(table.querySelector("td"));
  });

  it("passes a removed stop to the cell React put in its place", () => {
    const { table, cellOf, stops } = grid(`<tr>${td("a")}${td("b", 0)}${td("c")}</tr>`);
    const records = recordsOf(table, () => {
      const old = cellOf("b");
      const next = old.cloneNode(true) as HTMLElement;
      next.setAttribute("tabindex", "-1");
      old.remove();
      cellOf("c").before(next);
    });
    normalize(table, records);
    expect(stops()).toEqual(["b"]);
  });

  it("passes a removed stop through a replaced row to the cell at the same place", () => {
    const { table, stops } = grid(`<tr>${td("a")}</tr><tr>${td("b")}${td("c", 0)}</tr>`);
    const records = recordsOf(table, () => {
      const old = table.rows[1]!;
      old.remove();
      table.tBodies[0]!.insertAdjacentHTML("beforeend", `<tr>${td("b")}${td("c")}</tr>`);
    });
    normalize(table, records);
    expect(stops()).toEqual(["c"]);
  });

  it("passes no stop from a row that several new rows replaced", () => {
    // A loading row replaced by data rows: no one new row sits where it was.
    const { table, stops } = grid(`<tr>${td("loading", 0)}</tr>`);
    const records = recordsOf(table, () => {
      table.rows[0]!.remove();
      for (const name of ["a", "b", "c"]) {
        table.tBodies[0]!.insertAdjacentHTML("beforeend", `<tr>${td(name)}</tr>`);
      }
    });
    normalize(table, records);
    expect(stops()).toEqual(["a"]);
  });

  it("repairs a cell that attached in the same batch when its content changed after", () => {
    const { table, stops } = grid(`<tr>${td("a", 0)}</tr>`);
    const records = recordsOf(table, () => {
      table.tBodies[0]!.insertAdjacentHTML("beforeend", `<tr>${td("b")}</tr>`);
      // A layout effect in the same task renders widgets into the new cell.
      table.rows[1]!.cells[0]!.insertAdjacentHTML(
        "beforeend",
        '<button type="button">x</button><button type="button">y</button>',
      );
    });
    normalize(table, records);
    expect(stops()).toEqual(["a"]);
    expect([...table.querySelectorAll("button")].map((button) => button.tabIndex)).toEqual([
      -1, -1,
    ]);
  });

  it("writes nothing to server HTML React's streaming script swapped in", () => {
    const { table } = grid(`<!--$?--><template id="B:0"></template><!--/$-->`);
    const records = recordsOf(table, () => {
      // What React's script does: drop the placeholder, move the boundary's HTML in.
      const placeholder = table.querySelector("template")!;
      const end = placeholder.nextSibling!;
      placeholder.remove();
      const rows = document.createElement("tbody");
      rows.innerHTML = `<tr>${td('<input aria-label="pick" type="checkbox">', 0)}${td("b")}</tr>`;
      end.before(...rows.childNodes);
    });
    expect(writesDuring(table, () => normalize(table, records))).toEqual([]);

    // Once React hydrated it, its cells attach and the same rows are repaired like any other.
    for (const cell of ownedCells(table)) adoptCell(cell);
    const added = recordsOf(table, () =>
      table.tBodies[0]!.insertAdjacentHTML("beforeend", `<tr>${td("c")}</tr>`),
    );
    normalize(table, added);
    expect(currentStop(table)).toBe(table.querySelector("input"));
  });

  it("keeps the stop in the cell whose delegated widget the consumer swapped", () => {
    const { table } = grid(
      `<tr>${td("a")}${td('<input aria-label="pick" type="checkbox" tabindex="0">')}</tr>`,
    );
    const cell = table.querySelector("input")!.closest("td")!;
    const records = recordsOf(table, () => {
      cell.replaceChildren();
      cell.insertAdjacentHTML("beforeend", '<input aria-label="again" type="checkbox">');
    });
    normalize(table, records);
    expect(currentStop(table)).toBe(cell.querySelector("input"));
    expect(cell.getAttribute("tabindex")).toBe("-1");
  });

  it("treats a row React moved as one that was there", () => {
    const { table } = grid(
      `<tr>${td("a")}</tr><tr>${td('<input aria-label="pick" type="checkbox" tabindex="0">')}</tr>`,
    );
    const records = recordsOf(table, () => table.tBodies[0]!.prepend(table.rows[1]!));
    normalize(table, records);
    expect(currentStop(table)).toBe(table.querySelector("input"));
  });

  it("repairs the cells whose content changed and leaves the others", () => {
    const { table, cellOf } = grid(
      `<tr>${td("a", 0)}${td('<button type="button">x</button>')}${td('<button type="button">z</button>')}</tr>`,
    );
    const records = recordsOf(table, () =>
      cellOf("x").insertAdjacentHTML("beforeend", '<button type="button">y</button>'),
    );
    expect(writesDuring(table, () => normalize(table, records))).toEqual(["x", "y"]);
  });

  it("clears a stop left on a widget that was disabled", () => {
    const { table, byText, stops } = grid(
      `<tr>${td("a", 0)}${td('<button type="button" tabindex="0" disabled>x</button>')}</tr>`,
    );
    normalize(table);
    expect(stops()).toEqual(["a"]);
    expect(byText("x").getAttribute("tabindex")).toBe("-1");
  });

  it("leaves a nested grid's stop alone", () => {
    const { table, stops } = grid(
      `<tr>${td("a", 0)}${td(`<table role="grid" data-comp0-root="inner"><tbody><tr>${td("i", 0, "inner")}</tr></tbody></table>`)}</tr>`,
    );
    normalize(table);
    expect(stops()).toEqual(["a", "i"]);
  });

  it("leaves a second stop in server HTML a boundary has not hydrated", () => {
    const { table, stops } = grid(`<tr>${td("a", 0)}</tr><!--$--><tr>${td("b", 0)}</tr><!--/$-->`);
    normalize(table);
    expect(stops()).toEqual(["a", "b"]);
  });

  it("writes nothing once the invariant holds", () => {
    const { table } = grid(
      `<tr>${td("a")}${td('<input aria-label="pick" type="checkbox">')}${td('<button type="button">x</button><button type="button">y</button>')}</tr>`,
    );
    expect(writesDuring(table, () => mountStop(table)).length).toBeGreaterThan(0);
    expect(writesDuring(table, () => normalize(table))).toEqual([]);
    expect(writesDuring(table, () => moveStop(table, table.querySelector("input")!))).toEqual([
      "a",
      "",
    ]);
    expect(writesDuring(table, () => normalize(table))).toEqual([]);
  });

  it("stays linear in its records when many cells change their content at once", () => {
    const { table } = grid(
      Array.from(
        { length: 200 },
        (_, row) => `<tr>${td(`<span>a${row}</span>`)}${td(`<span>b${row}</span>`)}</tr>`,
      ).join(""),
    );
    mountStop(table);
    const observer = new MutationObserver(() => {});
    observer.observe(table, {
      subtree: true,
      childList: true,
      attributeFilter: CELL_WIDGET_ATTRIBUTES,
    });
    // An edit mode: every cell swaps its text for an input in one commit.
    for (const span of table.querySelectorAll("span")) {
      const input = document.createElement("input");
      input.setAttribute("aria-label", span.textContent!);
      span.replaceWith(input);
    }
    const records = observer.takeRecords();
    observer.disconnect();
    const contains = vi.spyOn(Node.prototype, "contains");

    normalize(table, records);
    // A check of every record against every added node would make 400 × 400 calls.
    expect(contains.mock.calls.length).toBeLessThan(5 * records.length);
    expect(currentStop(table)).toBe(table.querySelector("input"));
    expect(
      [...table.querySelectorAll("input")].filter((input) => input.tabIndex === 0),
    ).toHaveLength(1);
    contains.mockRestore();
  });

  it("does nothing in a grid without cells", () => {
    const { table } = grid(`<tr><td><button type="button" tabindex="0">x</button></td></tr>`);
    normalize(table);
    expect(table.querySelector("button")!.getAttribute("tabindex")).toBe("0");
  });
});
