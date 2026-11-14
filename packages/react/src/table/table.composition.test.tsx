import { act, Fragment, useSyncExternalStore, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, setup, userEvent } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { Table } from "./Table.js";
import { TableBody } from "./TableBody.js";
import { TableCaption } from "./TableCaption.js";
import { TableCell } from "./TableCell.js";
import { TableColumn } from "./TableColumn.js";
import { TableFooter } from "./TableFooter.js";
import { TableHeader } from "./TableHeader.js";
import { TableRow } from "./TableRow.js";
import { TableRowHeader } from "./TableRowHeader.js";

async function clickWith(
  user: ReturnType<typeof setup>["user"],
  element: Element,
  shiftKey: boolean,
) {
  if (shiftKey) await user.keyboard("{Shift>}");
  await user.click(element);
  if (shiftKey) await user.keyboard("{/Shift}");
}

function renderTable() {
  const result = setup(
    <Table aria-label="People">
      <TableHeader>
        <TableRow>
          <TableColumn>Name</TableColumn>
          <TableColumn>Role</TableColumn>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ada</TableCell>
          <TableCell>Engineer</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Grace</TableCell>
          <TableCell>Admiral</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
  const table = result.container.querySelector("table")!;
  const cells = [...table.querySelectorAll<HTMLTableCellElement>("th, td")];
  return { ...result, table, cells };
}

describe("table composition", () => {
  it("renders the complete native table anatomy", async () => {
    const { container } = render(
      <Table>
        <TableCaption>Quarterly revenue</TableCaption>
        <TableBody>
          <TableRow>
            <TableRowHeader>First quarter</TableRowHeader>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableRowHeader>Total</TableRowHeader>
            <TableCell>$10</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(container.querySelector("caption")?.textContent).toBe("Quarterly revenue");
    expect(container.querySelectorAll("th[scope='row']")).toHaveLength(2);
    expect(container.querySelector("tfoot")).not.toBeNull();
  });

  it("renders native table semantics with the grid role and one tab stop", async () => {
    const { table, cells } = renderTable();
    expect(table.getAttribute("role")).toBe("grid");
    expect(table.querySelectorAll("thead th[scope='col']")).toHaveLength(2);
    expect(cells).toHaveLength(6);
    expect(cells.filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
    expect(cells[0]!.tabIndex).toBe(0);
  });

  it("moves between cells in two dimensions with the arrow keys", async () => {
    const { cells, user } = renderTable();
    cells[0]!.focus();
    await pressKey(user, cells[0]!, "{ArrowRight}");
    expect(document.activeElement).toBe(cells[1]);
    await pressKey(user, cells[1]!, "{ArrowDown}");
    expect(document.activeElement).toBe(cells[3]);
    await pressKey(user, cells[3]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(cells[2]);
    await pressKey(user, cells[2]!, "{ArrowUp}");
    expect(document.activeElement).toBe(cells[0]);
    await pressKey(user, cells[0]!, "{ArrowUp}");
    expect(document.activeElement).toBe(cells[0]);
  });

  it("mirrors horizontal cell navigation in right-to-left layouts", async () => {
    const { table, cells, user } = renderTable();
    table.style.direction = "rtl";
    cells[0]!.focus();

    await pressKey(user, cells[0]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(cells[1]);
  });

  it("supports Home, End, and Ctrl edges, and moves the roving tab stop", async () => {
    const { cells, user } = renderTable();
    cells[0]!.focus();
    await pressKey(user, cells[0]!, "{End}");
    expect(document.activeElement).toBe(cells[1]);
    await pressKey(user, cells[1]!, "{Home}");
    expect(document.activeElement).toBe(cells[0]);
    await pressKey(user, cells[0]!, "{Control>}{End}{/Control}");
    expect(document.activeElement).toBe(cells[5]);
    expect(cells[5]!.tabIndex).toBe(0);
    expect(cells[0]!.tabIndex).toBe(-1);
    await pressKey(user, cells[5]!, "{Control>}{Home}{/Control}");
    expect(document.activeElement).toBe(cells[0]);
  });
});

describe("table selection, sort, and resize", () => {
  it("walks through every interactive item in a cell before moving on", async () => {
    const { container, user } = setup(
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>report.pdf</TableCell>
            <TableCell>
              a file
              <button type="button">Share</button>
              <button type="button">Delete</button>
            </TableCell>
            <TableCell>done</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cells = [...container.querySelectorAll<HTMLTableCellElement>("td")];
    const buttons = [...container.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons.every((button) => button.tabIndex === -1)).toBe(true);

    cells[0]!.focus();
    await pressKey(user, cells[0]!, "{ArrowRight}");
    expect(document.activeElement).toBe(cells[1]);
    await pressKey(user, cells[1]!, "{ArrowRight}");
    expect(document.activeElement).toBe(buttons[0]);
    await pressKey(user, buttons[0]!, "{ArrowRight}");
    expect(document.activeElement).toBe(buttons[1]);
    await pressKey(user, buttons[1]!, "{ArrowRight}");
    expect(document.activeElement).toBe(cells[2]);
    await pressKey(user, cells[2]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("focuses a cell's single widget instead of the cell and keeps one tab stop", async () => {
    const { container, user } = setup(
      <Table aria-label="Files">
        <TableBody>
          <TableRow selected>
            <TableCell>
              <input aria-label="Select report" type="checkbox" />
            </TableCell>
            <TableCell>report.pdf</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const row = container.querySelector("tr")!;
    expect(row.getAttribute("aria-selected")).toBe("true");
    expect(row.dataset["selected"]).toBe("");

    const cells = [...container.querySelectorAll<HTMLTableCellElement>("td")];
    const checkbox = container.querySelector<HTMLInputElement>("input")!;
    expect(cells[0]!.tabIndex).toBe(-1);
    expect(checkbox.tabIndex).toBe(0);

    await pressKey(user, cells[1]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(checkbox);
  });

  it("activates sort from click and keyboard and exposes aria-sort", async () => {
    const onSort = vi.fn();
    const { container, user } = setup(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn sort="ascending" onSort={onSort}>
              Name
            </TableColumn>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const header = container.querySelector("th")!;
    expect(header.getAttribute("aria-sort")).toBe("ascending");
    expect(header.dataset["sortable"]).toBe("");
    await user.click(header);
    expect(onSort).toHaveBeenCalledTimes(1);
    await pressKey(user, header, "{Enter}");
    expect(onSort).toHaveBeenCalledTimes(2);
  });

  it("resizes with Shift+Arrow on the header without moving grid focus", async () => {
    const onResize = vi.fn();
    const { container, user } = setup(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>Name</TableColumn>
            <TableColumn>Role</TableColumn>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const headers = [...container.querySelectorAll<HTMLTableCellElement>("th")];
    headers[0]!.focus();
    await pressKey(user, headers[0]!, "{Shift>}{ArrowRight}{/Shift}");
    expect(onResize).toHaveBeenLastCalledWith(16);
    expect(document.activeElement).toBe(headers[0]);
    await pressKey(user, headers[0]!, "{Shift>}{ArrowLeft}{/Shift}");
    expect(onResize).toHaveBeenLastCalledWith(0);
  });
});

describe("table range selection", () => {
  function renderSelectable(onRangeSelect = vi.fn()) {
    const result = setup(
      <Table aria-label="People" onRangeSelect={onRangeSelect}>
        <TableBody>
          <TableRow value="a">
            <TableCell>Ada</TableCell>
          </TableRow>
          <TableRow value="b">
            <TableCell>Grace</TableCell>
          </TableRow>
          <TableRow value="c">
            <TableCell>Mary</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cells = [...result.container.querySelectorAll<HTMLTableCellElement>("td")];
    return { ...result, cells, onRangeSelect };
  }

  it("selects the range from the click anchor on shift-click", async () => {
    const { cells, onRangeSelect, user } = renderSelectable();
    await clickWith(user, cells[0]!, false);
    await clickWith(user, cells[2]!, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b", "c"]);
    await clickWith(user, cells[1]!, false);
    await clickWith(user, cells[0]!, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("extends the range while moving with Shift+ArrowDown and resets on plain movement", async () => {
    const { cells, onRangeSelect, user } = renderSelectable();
    cells[0]!.focus();
    await clickWith(user, cells[0]!, false);
    await pressKey(user, cells[0]!, "{Shift>}{ArrowDown}{/Shift}");
    expect(document.activeElement).toBe(cells[1]);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b"]);
    await pressKey(user, cells[1]!, "{Shift>}{ArrowDown}{/Shift}");
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b", "c"]);
    await pressKey(user, cells[2]!, "{ArrowUp}");
    await pressKey(user, cells[1]!, "{Shift>}{ArrowDown}{/Shift}");
    expect(onRangeSelect).toHaveBeenLastCalledWith(["b", "c"]);
  });

  it("renders any part as another element with as and merges into a Fragment child", async () => {
    const { container } = render(
      <Table as="div" aria-label="Custom">
        <TableBody as="section" data-testid="body">
          <TableRow as={Fragment}>
            <tr data-custom="">
              <TableCell as="td">One</TableCell>
            </tr>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(container.querySelector("div[role='grid']")).not.toBeNull();
    expect(container.querySelector("section[data-testid='body']")).not.toBeNull();
    expect(container.querySelector("tr[data-custom]")?.getAttribute("data-selected")).toBeNull();
  });
});

function people(rows = ["Ada", "Grace"]) {
  return (
    <Table aria-label="People">
      <TableHeader>
        <TableRow>
          <TableColumn>Name</TableColumn>
          <TableColumn>Role</TableColumn>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((name) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell>{`${name} role`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const page = (ui: ReactElement) => (
  <>
    <button type="button">Before</button>
    {ui}
    <button type="button">After</button>
  </>
);

const tableStops = (container: Element) =>
  [...container.querySelectorAll<HTMLElement>("table [tabindex='0']")].map(
    (element) => element.textContent || element.getAttribute("aria-label"),
  );

describe("table tab stop", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("puts the one tab stop on the first cell in server HTML", () => {
    const html = renderToString(people());

    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("hydrates the server HTML without a mismatch and keeps one stop", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(people());
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, people());
    });

    expect(errors).not.toHaveBeenCalled();
    expect(tableStops(container)).toEqual(["Name"]);
    const cells = container.querySelectorAll<HTMLElement>("th, td");
    await pressKey(userEvent.setup(), cells[0]!, "{ArrowDown}");
    expect(document.activeElement).toBe(cells[2]);
    expect(tableStops(container)).toEqual(["Ada"]);
    await act(async () => root.unmount());
  });

  it("returns Tab to the cell the user clicked", async () => {
    const { container, user } = setup(page(people()));
    const cells = container.querySelectorAll<HTMLElement>("th, td");
    const [, after] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(cells[3]!);
    expect(tableStops(container)).toEqual(["Ada role"]);
    await user.tab();
    expect(document.activeElement).toBe(after);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cells[3]);
  });

  it("returns Tab to the cell whose widget received focus", async () => {
    const { container, user } = setup(
      page(
        <Table aria-label="Files">
          <TableBody>
            <TableRow>
              <TableCell>report.pdf</TableCell>
              <TableCell>
                <button type="button">Share</button>
                <button type="button">Delete</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    );
    const cells = container.querySelectorAll<HTMLElement>("td");
    const share = container.querySelector<HTMLElement>("td button")!;
    const [, after] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(share);
    expect(document.activeElement).toBe(share);
    expect([...cells].map((cell) => cell.tabIndex)).toEqual([-1, 0]);
    await user.tab();
    expect(document.activeElement).toBe(after);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(cells[1]);
  });

  it("renders a delegating cell with tabIndex -1 while its single widget holds the stop", async () => {
    const tabIndexWrites: Element[] = [];
    const setter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "tabIndex")!.set!;
    vi.spyOn(HTMLElement.prototype, "tabIndex", "set").mockImplementation(function (
      this: HTMLElement,
      value: number,
    ) {
      tabIndexWrites.push(this);
      setter.call(this, value);
    });
    const files = (label: string) =>
      page(
        <Table aria-label={label}>
          <TableBody>
            <TableRow>
              <TableCell>
                <input aria-label="Select report" type="checkbox" />
              </TableCell>
              <TableCell>report.pdf</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <input aria-label="Select notes" type="checkbox" />
              </TableCell>
              <TableCell>notes.txt</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
    const { container, rerender, user } = setup(files("Files"));
    const cells = container.querySelectorAll<HTMLTableCellElement>("td");
    const [report, notes] = container.querySelectorAll<HTMLInputElement>("input");

    expect([...cells].map((cell) => cell.tabIndex)).toEqual([-1, -1, -1, -1]);
    expect(tableStops(container)).toEqual(["Select report"]);
    rerender(files("Documents"));
    expect([...cells].map((cell) => cell.tabIndex)).toEqual([-1, -1, -1, -1]);
    expect(tableStops(container)).toEqual(["Select report"]);

    await pressKey(user, report!, "{ArrowDown}");
    expect(document.activeElement).toBe(notes);
    expect(tableStops(container)).toEqual(["Select notes"]);
    await user.tab();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(notes);
    // Only the consumer's widgets are written to; the cells render their own tabIndex.
    expect(tabIndexWrites.filter((element) => element.tagName === "TD")).toEqual([]);
  });

  it("moves the stop to the first cell when the row holding it is removed", async () => {
    const { container, rerender, user } = setup(people(["Ada", "Grace"]));
    const grace = [...container.querySelectorAll<HTMLElement>("td")].find(
      (cell) => cell.textContent === "Grace role",
    )!;

    await user.click(grace);
    expect(tableStops(container)).toEqual(["Grace role"]);
    rerender(people(["Ada"]));
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("keeps a cell outside a Table a plain cell", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>Loose</TableCell>
            <TableCell>
              <button type="button">Act</button>
            </TableCell>
          </tr>
        </tbody>
      </table>,
    );

    expect(container.querySelector("td")!.tabIndex).toBe(-1);
    // No grid moves focus here, so the cell's widgets keep their own Tab stops.
    expect(container.querySelector("button")!.tabIndex).toBe(0);
  });

  it("keeps a header in the grid after its element is replaced", async () => {
    const ui = (onResize?: (width: number) => void) => (
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>Name</TableColumn>
            <TableColumn>Role</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
            <TableCell>Engineer</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const { user, rerender, container } = setup(ui());
    const before = container.querySelector("th");
    // Adding onResize wraps the header in a context provider, so React mounts a new th.
    rerender(ui(() => {}));
    const [name, role] = container.querySelectorAll<HTMLTableCellElement>("th");
    expect(name).not.toBe(before);

    await user.click(name!);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(role);
    await user.tab();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(role);
  });
});

/** Everything Tab can reach inside the tables of `container`, by text or label. */
const tabbables = (container: Element) =>
  [
    ...container.querySelectorAll<HTMLElement>(
      "table a[href], table button, table input, table [tabindex]",
    ),
  ]
    .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled"))
    .map((element) => element.textContent || element.getAttribute("aria-label"));

/** Lets the table's content observer run after a consumer changed a cell on its own. */
const settle = () => act(async () => {});

/** State a consumer component owns, changed from outside the table's render. */
function createFlag() {
  let on = false;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: () => on,
    set(next: boolean) {
      on = next;
      for (const listener of listeners) listener();
    },
  };
}
type Flag = ReturnType<typeof createFlag>;
const useFlag = (flag: Flag) => useSyncExternalStore(flag.subscribe, flag.get, flag.get);

describe("table tab stop with consumer-owned cell content", () => {
  it("keeps one tab stop when widgets arrive after the cell commits", async () => {
    // Late data in a consumer component: the cells holding it never re-render.
    const loaded = createFlag();
    function Open() {
      if (!useFlag(loaded)) return <span>…</span>;
      return <button type="button">Open a</button>;
    }
    function Actions() {
      if (!useFlag(loaded)) return null;
      return (
        <>
          <button type="button">Edit</button>
          <button type="button">Delete</button>
        </>
      );
    }
    const { container, user } = setup(
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>a</TableCell>
            <TableCell>
              <Open />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>b</TableCell>
            <TableCell>
              <Actions />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    await act(async () => loaded.set(true));
    const [a, , b] = container.querySelectorAll<HTMLElement>("td");
    expect(container.querySelectorAll("button")).toHaveLength(3);

    expect(tabbables(container)).toEqual(["a"]);
    await user.click(a!);
    await pressKey(user, a!, "{ArrowDown}");
    expect(document.activeElement).toBe(b);
    expect(tabbables(container)).toEqual(["b"]);
  });

  it("brings a widget a consumer swaps into a non-stop cell under the one-stop rule", async () => {
    const failed = createFlag();
    function Status() {
      if (useFlag(failed)) return <button type="button">Retry</button>;
      return <span>ok</span>;
    }
    const { container } = setup(
      <Table aria-label="Jobs">
        <TableBody>
          <TableRow>
            <TableCell>A</TableCell>
            <TableCell>B</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>C</TableCell>
            <TableCell>
              <Status />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    await act(async () => failed.set(true));
    expect(tabbables(container)).toEqual(["A"]);
  });

  it("hands the stop back to the cell when its delegated widget disappears", async () => {
    const saving = createFlag();
    function Pick() {
      if (useFlag(saving)) return <span>saving</span>;
      return <input aria-label="Select report" type="checkbox" />;
    }
    const { container, user } = setup(
      page(
        <Table aria-label="Files">
          <TableBody>
            <TableRow>
              <TableCell>
                <Pick />
              </TableCell>
              <TableCell>report.pdf</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    );
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const [cell] = container.querySelectorAll<HTMLElement>("td");
    expect(tabbables(container)).toEqual(["Select report"]);

    await act(async () => saving.set(true));
    expect(cell!.tabIndex).toBe(0);
    expect(tabbables(container)).toEqual(["saving"]);
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(cell);
  });

  it("hands the stop back to the cell when the consumer disables its delegated widget", async () => {
    const locked = createFlag();
    function Pick() {
      return <input aria-label="Select report" disabled={useFlag(locked)} type="checkbox" />;
    }
    const { container, user } = setup(
      page(
        <Table aria-label="Files">
          <TableBody>
            <TableRow>
              <TableCell>
                <Pick />
              </TableCell>
              <TableCell>report.pdf</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    );
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const [cell] = container.querySelectorAll<HTMLElement>("td");
    const checkbox = container.querySelector("input")!;
    expect(tabbables(container)).toEqual(["Select report"]);

    await act(async () => locked.set(true));
    await settle();
    // The empty cell is now the one stop.
    expect(cell!.tabIndex).toBe(0);
    expect(tabbables(container)).toEqual([null]);
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(cell);

    await act(async () => locked.set(false));
    await settle();
    expect(cell!.tabIndex).toBe(-1);
    expect(tabbables(container)).toEqual(["Select report"]);
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(checkbox);
  });

  it("stops delegating when one widget becomes two", async () => {
    const editing = createFlag();
    function Edit() {
      if (useFlag(editing)) {
        return (
          <>
            <button type="button">Save</button>
            <button type="button">Cancel</button>
          </>
        );
      }
      return (
        <button type="button" onClick={() => editing.set(true)}>
          Edit
        </button>
      );
    }
    const { container, user } = setup(
      <Table aria-label="Notes">
        <TableBody>
          <TableRow>
            <TableCell>
              <Edit />
            </TableCell>
            <TableCell>note</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const [cell] = container.querySelectorAll<HTMLElement>("td");
    expect(tabbables(container)).toEqual(["Edit"]);

    await user.click(container.querySelector("button")!);
    await settle();
    expect(cell!.tabIndex).toBe(0);
    expect(tabbables(container)).toEqual(["SaveCancel"]);
  });
});

describe("nested tables", () => {
  function nested() {
    return (
      <Table aria-label="Outer">
        <TableBody>
          <TableRow>
            <TableCell>O1</TableCell>
            <TableCell>
              <Table aria-label="Inner">
                <TableBody>
                  <TableRow>
                    <TableCell>I1</TableCell>
                    <TableCell>I2</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>I3</TableCell>
                    <TableCell>I4</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  const stopsPerGrid = (container: Element) =>
    [...container.querySelectorAll<HTMLElement>("[role='grid']")].map((grid) =>
      [...grid.querySelectorAll<HTMLElement>("[tabindex='0']")]
        .filter((element) => element.closest("[role='grid']") === grid)
        .map((element) => element.textContent),
    );

  it("keeps one tab stop per grid when the outer stop reaches the cell holding the inner grid", async () => {
    const { container, user } = setup(nested());
    const cells = container.querySelectorAll<HTMLElement>("td");
    const [o1, holder, i1, i2] = [...cells];
    expect(stopsPerGrid(container)).toEqual([["O1"], ["I1"]]);

    await user.click(i1!);
    await pressKey(user, i1!, "{ArrowRight}");
    expect(document.activeElement).toBe(i2);
    expect(stopsPerGrid(container)).toEqual([["O1"], ["I2"]]);

    await user.click(o1!);
    await pressKey(user, o1!, "{ArrowRight}");
    expect(document.activeElement).toBe(holder);
    await settle();
    expect(stopsPerGrid(container)).toEqual([["I1I2I3I4"], ["I2"]]);
  });

  it("treats a plain table in a cell as that cell's content", async () => {
    const loaded = createFlag();
    function Extra() {
      if (!useFlag(loaded)) return null;
      return <a href="#more">More</a>;
    }
    const { container, user } = setup(
      page(
        <Table aria-label="Outer">
          <TableBody>
            <TableRow>
              <TableCell>O1</TableCell>
              <TableCell>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <button type="button">Inner action</button>
                      </td>
                      <td>
                        <Extra />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      ),
    );
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const o1 = container.querySelector<HTMLElement>("td")!;
    const action = container.querySelector<HTMLElement>("table table button")!;
    expect(tabbables(container)).toEqual(["O1"]);

    await user.click(o1);
    await pressKey(user, o1, "{ArrowRight}");
    expect(document.activeElement).toBe(action);
    expect(tabbables(container)).toEqual(["Inner action"]);
    await pressKey(user, action, "{ArrowLeft}");
    expect(document.activeElement).toBe(o1);

    // A widget arriving later inside the plain table is measured like any other cell content.
    await act(async () => loaded.set(true));
    await settle();
    expect(tabbables(container)).toEqual(["O1"]);
    const more = container.querySelector<HTMLElement>("a[href]")!;

    // Focusing a widget inside the plain table moves the grid's stop to the holding cell.
    await user.click(action);
    await user.click(before!);
    await user.tab();
    expect(document.activeElement?.textContent).toBe("Inner actionMore");
    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(document.activeElement).toBe(action);
    await pressKey(user, action, "{ArrowRight}");
    expect(document.activeElement).toBe(more);
  });

  it("leaves a key the inner grid does not use to the inner grid", async () => {
    const { container, user } = setup(nested());
    const i4 = [...container.querySelectorAll<HTMLElement>("td")].find(
      (cell) => cell.textContent === "I4",
    )!;

    await user.click(i4);
    await pressKey(user, i4, "{ArrowDown}");
    expect(document.activeElement).toBe(i4);
    await pressKey(user, i4, "{ArrowRight}");
    expect(document.activeElement).toBe(i4);
  });
});
