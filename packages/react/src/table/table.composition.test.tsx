import {
  act,
  Activity,
  Fragment,
  Suspense,
  use,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, setup, userEvent } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { Link } from "../link/Link.js";
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

  it("gives a delegating cell tabIndex -1 while its single widget holds the stop", async () => {
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
  });

  it("moves the stop to the first cell when the row holding it is removed", async () => {
    const { container, rerender, user } = setup(people(["Ada", "Grace"]));
    const grace = [...container.querySelectorAll<HTMLElement>("td")].find(
      (cell) => cell.textContent === "Grace role",
    )!;

    await user.click(grace);
    expect(tableStops(container)).toEqual(["Grace role"]);
    rerender(people(["Ada"]));
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("names its table on each cell, which is how the table finds its cells", async () => {
    const { container, user } = setup(
      <Table aria-label="People" data-comp0-root="mine">
        <TableHeader>
          <TableRow>
            <TableColumn data-comp0-owner="other" data-slot="name">
              Name
            </TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableRowHeader data-comp0-owner="other" data-slot="person">
              Ada
            </TableRowHeader>
            <TableCell data-comp0-owner="other" data-slot="role">
              Engineer
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = container.querySelector("table")!;
    const id = table.getAttribute("data-comp0-root");
    const cells = [...container.querySelectorAll<HTMLElement>("th, td")];
    // A consumer's props cannot rename the table or move a cell to another table.
    expect(id).not.toBe("mine");
    expect(cells.map((cell) => cell.getAttribute("data-comp0-owner"))).toEqual([id, id, id]);
    expect(cells.map((cell) => cell.dataset["slot"])).toEqual([
      "table-column",
      "table-row-header",
      "table-cell",
    ]);
    expect(tableStops(container)).toEqual(["Name"]);
    await user.click(cells[2]!);
    expect(tableStops(container)).toEqual(["Engineer"]);
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
    // The new th renders the -1 its column decided at mount; the table puts the stop back.
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);

    await user.click(name!);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(role);
    await user.tab();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(role);
  });

  it("renders each cell's tabIndex once while the stop moves in the DOM", async () => {
    // Every tabIndex a cell passes to its element, by cell, through a custom `as` element.
    const passed = new Map<string, Set<number | undefined>>();
    function Probe({ children, ...props }: ComponentProps<"td">) {
      const name = String(children);
      passed.set(name, (passed.get(name) ?? new Set()).add(props.tabIndex));
      return <td {...props}>{children}</td>;
    }
    const ui = (rows: string[]) =>
      page(
        <Table aria-label="People">
          <TableBody>
            {rows.map((name) => (
              <TableRow key={name}>
                <TableCell as={Probe}>{name}</TableCell>
                <TableCell as={Probe}>{`${name} role`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      );
    const { container, rerender, user } = setup(ui(["Ada", "Grace"]));
    const cells = container.querySelectorAll<HTMLElement>("td");
    await user.click(cells[0]!);
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(tableStops(container)).toEqual(["Grace role"]);

    const written: Element[] = [];
    const writes = new MutationObserver((records) => {
      for (const record of records) written.push(record.target as Element);
    });
    writes.observe(container, { subtree: true, attributeFilter: ["tabindex"] });
    // New elements for every part, so every cell renders again; React has nothing to write.
    rerender(ui(["Ada", "Grace", "Mary"]));
    await settle();
    writes.disconnect();
    expect(written).toEqual([]);
    expect(tableStops(container)).toEqual(["Grace role"]);
    expect([...passed.values()].map((values) => [...values])).toEqual(
      Array.from({ length: 6 }, () => [-1]),
    );
  });

  it("hydrates a delegating first cell and hands its stop to the widget", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const files = (
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>
              <input aria-label="Select report" type="checkbox" />
            </TableCell>
            <TableCell>
              <button type="button">Share</button>
              <button type="button">Delete</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(files);
    // The server cannot see the checkbox, so the first cell carries the stop in its HTML.
    expect([...container.querySelectorAll("td")].map((cell) => cell.tabIndex)).toEqual([0, -1]);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, files);
    });

    expect(errors).not.toHaveBeenCalled();
    expect([...container.querySelectorAll("td")].map((cell) => cell.tabIndex)).toEqual([-1, -1]);
    expect(tabbables(container)).toEqual(["Select report"]);
    await act(async () => root.unmount());
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

  it("keeps the stop when a consumer renders a widget with tabIndex 0 in an earlier cell", async () => {
    const pinned = createFlag();
    function Actions() {
      const tabIndex = useFlag(pinned) ? 0 : undefined;
      return (
        <>
          <button type="button" tabIndex={tabIndex}>
            Edit
          </button>
          <button type="button">Delete</button>
        </>
      );
    }
    const { container, user } = setup(
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>
              <Actions />
            </TableCell>
            <TableCell>a</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>b</TableCell>
            <TableCell>c</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const c = [...container.querySelectorAll<HTMLElement>("td")].at(-1)!;
    await user.click(c);
    expect(tabbables(container)).toEqual(["c"]);

    await act(async () => pinned.set(true));
    await settle();
    expect(tabbables(container)).toEqual(["c"]);
  });
  it("keeps the stop when a consumer enables a widget with tabIndex 0 in an earlier cell", async () => {
    const enabled = createFlag();
    function Notify() {
      const on = useFlag(enabled);
      return <span role="switch" aria-checked={on} aria-label="Notify" tabIndex={on ? 0 : -1} />;
    }
    const { container, user } = setup(
      <>
        <button type="button">Before</button>
        <Table aria-label="Files">
          <TableBody>
            <TableRow>
              <TableCell>
                <input aria-label="Select notes" type="checkbox" />
              </TableCell>
              <TableCell>
                <Notify />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <input aria-label="Select report" type="checkbox" />
              </TableCell>
              <TableCell>report.pdf</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>,
    );
    await user.click(container.querySelector("[aria-label='Select report']")!);
    await user.click(container.querySelector("button")!);
    expect(tabbables(container)).toEqual(["Select report"]);

    await act(async () => enabled.set(true));
    await settle();
    expect(tabbables(container)).toEqual(["Select report"]);
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

describe("table tab stop against consumer tabIndex and replaced elements", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  // A consumer's own focusable element, such as a custom button rendered with tabIndex 0.
  const Chip = (props: ComponentProps<"span">) => <span {...props} />;
  /** People rows; `widget` fills Ada's role cell and `roleAs` renders Ada's role cell. */
  function roster({
    first = [] as string[],
    widget,
    roleAs,
    onResize,
  }: {
    first?: string[];
    widget?: ReactElement | undefined;
    roleAs?: ComponentProps<typeof TableCell>["as"];
    onResize?: ((width: number) => void) | undefined;
  } = {}) {
    return page(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>Name</TableColumn>
            <TableColumn>Role</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>
          {first.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <Chip tabIndex={0}>{`${name} info`}</Chip>
              </TableCell>
            </TableRow>
          ))}
          <TableRow key="Ada">
            <TableCell>Ada</TableCell>
            <TableCell as={roleAs}>{widget ?? "Engineer"}</TableCell>
          </TableRow>
          <TableRow key="Grace">
            <TableCell>Grace</TableCell>
            <TableCell>Admiral</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
  }
  const CustomCell = (props: ComponentProps<"td">) => <td {...props} />;
  const RouterLink = ({ to, ...props }: ComponentProps<"span"> & { to: string }) => (
    <span data-to={to} {...props} />
  );

  it("starts a client-only mount on the first cell when a body cell's one widget has tabIndex 0", async () => {
    const { container } = setup(
      roster({
        widget: <Chip tabIndex={0}>info</Chip>,
      }),
    );
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
    expect(tabbables(container)).toEqual(["Name"]);
  });

  it("starts a client-only mount on the first cell when a body cell holds a router Link", async () => {
    const { container } = setup(
      roster({
        widget: (
          <Link as={RouterLink} to="/ada">
            Ada's page
          </Link>
        ),
      }),
    );
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("keeps the stop when a row whose one widget has tabIndex 0 is inserted above it", async () => {
    const { container, rerender, user } = setup(roster());
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const engineer = [...container.querySelectorAll<HTMLElement>("td")].find(
      (cell) => cell.textContent === "Engineer",
    )!;
    await user.click(engineer);
    await user.click(before!);

    rerender(roster({ first: ["Zed"] }));
    await settle();
    expect(tableStops(container)).toEqual(["Engineer"]);
    expect(tabbables(container)).toEqual(["Engineer"]);
  });

  it("keeps the stop on a cell whose element React replaces", async () => {
    const { container, rerender, user } = setup(roster());
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const engineer = () =>
      [...container.querySelectorAll<HTMLElement>("td")].find(
        (cell) => cell.textContent === "Engineer",
      )!;
    const old = engineer();
    await user.click(old);
    await user.click(before!);

    rerender(roster({ roleAs: CustomCell }));
    await settle();
    expect(engineer()).not.toBe(old);
    expect(tableStops(container)).toEqual(["Engineer"]);
    await user.tab();
    expect(document.activeElement).toBe(engineer());
  });

  it("keeps the stop on a header whose element React replaces", async () => {
    const ui = (onResize?: (width: number) => void) =>
      page(
        <Table aria-label="People">
          <TableHeader>
            <TableRow>
              <TableColumn>Name</TableColumn>
              <TableColumn onResize={onResize}>Role</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ada</TableCell>
              <TableCell>Engineer</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      );
    const { container, rerender, user } = setup(ui());
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const old = container.querySelectorAll<HTMLElement>("th")[1]!;
    await user.click(old);
    await user.click(before!);

    rerender(ui(() => {}));
    await settle();
    const role = container.querySelectorAll<HTMLElement>("th")[1]!;
    expect(role).not.toBe(old);
    expect(tableStops(container)).toEqual(["Role"]);
  });

  /** Renders `ui(false)` on the server, hydrates it, then returns a rerender to `ui(true)`. */
  async function hydrated(ui: (changed: boolean) => ReactElement) {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(ui(false));
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, ui(false));
    });
    const change = () => act(async () => root.render(ui(true)));
    return { container, errors, change, unmount: () => act(async () => root.unmount()) };
  }

  it("keeps the stop when the server's first cell gets a new element after hydration", async () => {
    const { container, errors, change, unmount } = await hydrated((changed) =>
      roster({ onResize: changed ? () => {} : undefined }),
    );
    const user = userEvent.setup();
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const name = container.querySelector("th");
    await user.click(
      [...container.querySelectorAll("td")].find((cell) => cell.textContent === "Engineer")!,
    );
    await user.click(before!);

    await change();
    await settle();
    expect(container.querySelector("th")).not.toBe(name);
    expect(tableStops(container)).toEqual(["Engineer"]);
    expect(errors).not.toHaveBeenCalled();
    await unmount();
  });

  it("keeps the stop on a cell whose element React replaces after hydration", async () => {
    const { container, errors, change, unmount } = await hydrated((changed) =>
      roster({ roleAs: changed ? CustomCell : undefined }),
    );
    const user = userEvent.setup();
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    await user.click(
      [...container.querySelectorAll("td")].find((cell) => cell.textContent === "Engineer")!,
    );
    await user.click(before!);

    await change();
    await settle();
    expect(tableStops(container)).toEqual(["Engineer"]);
    expect(errors).not.toHaveBeenCalled();
    await unmount();
  });
});

describe("table tab stop with rows in a Suspense boundary", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  /** Suspends its children on the client while `held` is pending. */
  let held: Promise<void> | null = null;
  function Held({ children }: { children: ReactElement }) {
    if (held) use(held);
    return children;
  }

  async function hydrateWithHeldBoundary(ui: ReactElement) {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    held = null;
    container.innerHTML = renderToString(ui);
    const server = container.innerHTML;
    let release!: () => void;
    held = new Promise<void>((resolve) => {
      release = () => {
        held = null;
        resolve();
      };
    });
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    return { container, errors, server, release, root };
  }

  it("leaves server HTML in a boundary alone until it hydrates, then repairs it", async () => {
    const ui = (
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>report.pdf</TableCell>
            <TableCell>ready</TableCell>
          </TableRow>
          <Suspense fallback={null}>
            <Held>
              <TableRow>
                <TableCell>
                  <input aria-label="Select notes" type="checkbox" />
                </TableCell>
                <TableCell>
                  <button type="button">Edit</button>
                  <button type="button">Delete</button>
                </TableCell>
              </TableRow>
            </Held>
          </Suspense>
        </TableBody>
      </Table>
    );
    const { container, errors, server, release, root } = await hydrateWithHeldBoundary(ui);
    const boundaryHtml = (html: string) => html.slice(html.indexOf("<!--$-->"));

    expect(boundaryHtml(container.innerHTML)).toBe(boundaryHtml(server));
    await act(async () => release());
    await settle();
    expect(errors).not.toHaveBeenCalled();
    expect(tabbables(container)).toEqual(["report.pdf"]);
    await act(async () => root.unmount());
  });

  it("hands the server's stop in a boundary to its widget once the boundary hydrates", async () => {
    // Every row sits in the boundary: a cell outside it would be the first the client hydration
    // render sees, and would render the stop where the server did not (a limit of the seed).
    const ui = (
      <Table aria-label="Files">
        <TableBody>
          <Suspense fallback={null}>
            <Held>
              <>
                <TableRow>
                  <TableCell>
                    <input aria-label="Select notes" type="checkbox" />
                  </TableCell>
                  <TableCell>notes.txt</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <input aria-label="Select report" type="checkbox" />
                  </TableCell>
                  <TableCell>report.pdf</TableCell>
                </TableRow>
              </>
            </Held>
          </Suspense>
        </TableBody>
      </Table>
    );
    const { container, errors, server, release, root } = await hydrateWithHeldBoundary(ui);

    expect(container.innerHTML).toBe(server);
    await act(async () => release());
    await settle();
    expect(errors).not.toHaveBeenCalled();
    expect([...container.querySelectorAll("td")].map((cell) => cell.tabIndex)).toEqual([
      -1, -1, -1, -1,
    ]);
    expect(tabbables(container)).toEqual(["Select notes"]);
    await act(async () => root.unmount());
  });

  it("writes nothing into a held boundary when the user moves the stop in the shell", async () => {
    const ui = (
      <Table aria-label="Files">
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
            <TableColumn>Info</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Suspense fallback={null}>
            <Held>
              <TableRow>
                <TableCell>notes.txt</TableCell>
                <TableCell>
                  {/* A consumer's own control rendered with tabIndex 0, such as a tooltip trigger. */}
                  <button type="button" tabIndex={0}>
                    tip
                  </button>
                </TableCell>
              </TableRow>
            </Held>
          </Suspense>
        </TableBody>
      </Table>
    );
    const { container, errors, server, release, root } = await hydrateWithHeldBoundary(ui);
    const boundaryHtml = (html: string) => html.slice(html.indexOf("<!--$-->"));
    const user = userEvent.setup();
    const [name, info] = container.querySelectorAll("th");

    await user.click(info!);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(name);
    expect(boundaryHtml(container.innerHTML)).toBe(boundaryHtml(server));

    await act(async () => release());
    await settle();
    expect(errors).not.toHaveBeenCalled();
    expect(tabbables(container)).toEqual(["Name"]);
    await act(async () => root.unmount());
  });

  it("writes nothing into a held boundary that holds the first cell when the shell changes", async () => {
    // Hydration renders the server snapshot, then the client switches to its own and changes
    // the caption while the boundary is still held.
    const updated = createFlag();
    updated.set(true);
    function Updated() {
      const ready = useSyncExternalStore(updated.subscribe, updated.get, () => false);
      return ready ? <span>updated 3 files</span> : "files";
    }
    const ui = (
      <Table aria-label="Files">
        <TableCaption>
          <Updated />
        </TableCaption>
        <TableBody>
          <Suspense fallback={null}>
            <Held>
              <>
                <TableRow>
                  <TableCell>
                    <input aria-label="Select notes" type="checkbox" />
                  </TableCell>
                  <TableCell>notes.txt</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <input aria-label="Select report" type="checkbox" />
                  </TableCell>
                  <TableCell>report.pdf</TableCell>
                </TableRow>
              </>
            </Held>
          </Suspense>
        </TableBody>
      </Table>
    );
    const { container, errors, server, release, root } = await hydrateWithHeldBoundary(ui);
    const boundaryHtml = (html: string) => html.slice(html.indexOf("<!--$-->"));
    await settle();

    expect(container.querySelector("caption")!.textContent).toBe("updated 3 files");
    expect(boundaryHtml(container.innerHTML)).toBe(boundaryHtml(server));
    await act(async () => release());
    await settle();
    expect(errors).not.toHaveBeenCalled();
    expect(tabbables(container)).toEqual(["Select notes"]);
    await act(async () => root.unmount());
  });

  it("hydrates rows that each sit in their own boundary without scanning the table per cell", async () => {
    const names = Array.from({ length: 100 }, (_, index) => `row-${index}`);
    const ui = (
      <Table aria-label="Files">
        <TableBody>
          {names.map((name) => (
            <Suspense key={name} fallback={null}>
              <TableRow>
                <TableCell>{name}</TableCell>
                <TableCell>
                  <button type="button">Open {name}</button>
                </TableCell>
              </TableRow>
            </Suspense>
          ))}
        </TableBody>
      </Table>
    );
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(ui);
    // React and the DOM make a few comparisons per row while hydrating; placing every cell
    // against every boundary would make cells × boundaries of them (about 20,000 here).
    const compare = vi.spyOn(Node.prototype, "compareDocumentPosition");
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    await settle();

    expect(compare.mock.calls.length).toBeLessThan(names.length * 10);
    expect(errors).not.toHaveBeenCalled();
    expect(tabbables(container)).toEqual(["row-0"]);
    await act(async () => root.unmount());
  });

  it("hydrates a boundary among the rows without a mismatch", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <Table aria-label="Files">
        <TableBody>
          <TableRow>
            <TableCell>report.pdf</TableCell>
            <TableCell>ready</TableCell>
          </TableRow>
          <Suspense fallback={null}>
            <TableRow>
              <TableCell>
                <button type="button">Edit</button>
                <button type="button">Delete</button>
              </TableCell>
              <TableCell>x</TableCell>
            </TableRow>
          </Suspense>
        </TableBody>
      </Table>
    );
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(ui);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, ui);
    });
    await settle();

    expect(errors).not.toHaveBeenCalled();
    expect(tabbables(container)).toEqual(["report.pdf"]);
    await act(async () => root.unmount());
  });
});

describe("table tab stop across reattaches, late content, and replaced rows", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const findCell = (container: Element, text: string) =>
    [...container.querySelectorAll<HTMLElement>("th, td")].find(
      (cell) => cell.textContent === text,
    )!;

  it("keeps the stop when an Activity hides and shows the table", async () => {
    const ui = (visible: boolean) =>
      page(<Activity mode={visible ? "visible" : "hidden"}>{people()}</Activity>);
    const { container, rerender, user } = setup(ui(true));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "Ada role"));
    await user.click(before!);
    rerender(ui(false));
    await settle();
    rerender(ui(true));
    await settle();
    expect(tableStops(container)).toEqual(["Ada role"]);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "Ada role"));
  });

  it("keeps the stop on a delegated widget when an Activity hides and shows the table", async () => {
    const ui = (visible: boolean) =>
      page(
        <Activity mode={visible ? "visible" : "hidden"}>
          <Table aria-label="Files">
            <TableBody>
              {["report", "notes"].map((name) => (
                <TableRow key={name}>
                  <TableCell>
                    <input aria-label={`Select ${name}`} type="checkbox" />
                  </TableCell>
                  <TableCell>{name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Activity>,
      );
    const { container, rerender, user } = setup(ui(true));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(container.querySelector<HTMLElement>("[aria-label='Select notes']")!);
    await user.click(before!);
    rerender(ui(false));
    await settle();
    rerender(ui(true));
    await settle();
    expect(tabbables(container)).toEqual(["Select notes"]);
  });

  it("keeps one stop when a new row's widgets appear in a layout effect of the same task", async () => {
    // A consumer gate that shows its children only after its first layout effect, through a
    // store of its own, so they commit in a second render of the same task.
    function LayoutGate({ children }: { children: ReactNode }) {
      const [shown] = useState(createFlag);
      useLayoutEffect(() => shown.set(true), [shown]);
      return useFlag(shown) ? children : null;
    }
    const ui = (rows: string[]) => (
      <Table aria-label="Jobs">
        <TableBody>
          {rows.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
              <TableCell>
                <LayoutGate>
                  <button type="button">{`${name} a`}</button>
                  <button type="button">{`${name} b`}</button>
                </LayoutGate>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    const { container, rerender } = setup(ui(["r0"]));
    await settle();
    expect(tabbables(container)).toEqual(["r0"]);

    rerender(ui(["r0", "r1"]));
    await settle();
    expect(container.querySelectorAll("button")).toHaveLength(4);
    expect(tabbables(container)).toEqual(["r0"]);
  });

  it("puts the stop on the first cell when data rows replace a loading row", async () => {
    const ui = (rows = ["Loading"]) => (
      <Table aria-label="People">
        <TableBody>
          {rows.map((name) => (
            <TableRow key={name}>
              <TableCell>{name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    const { container, rerender } = setup(ui());
    expect(tableStops(container)).toEqual(["Loading"]);

    rerender(ui(["Ada", "Grace", "Mary"]));
    await settle();
    expect(tableStops(container)).toEqual(["Ada"]);
  });

  it("puts the stop on the first cell when the next page replaces the row holding it", async () => {
    const { container, rerender, user } = setup(page(people(["a", "b", "c"])));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "c role"));
    await user.click(before!);
    rerender(page(people(["d", "e", "f"])));
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("mounts and inserts rows whose one widget has tabIndex 0 without scanning the table per cell", async () => {
    // A consumer's own focusable control rendered with tabIndex 0, such as a custom checkbox.
    const Check = (props: ComponentProps<"span">) => <span {...props} />;
    const names = (count: number, from = 0) =>
      Array.from({ length: count }, (_, index) => `row-${from + index}`);
    const ui = (rows: string[]) => (
      <Table aria-label="Checks">
        <TableBody>
          {rows.map((name) => (
            <TableRow key={name}>
              <TableCell>
                <Check aria-label={name} tabIndex={0} />
              </TableCell>
              <TableCell>{name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
    const all = vi.spyOn(Element.prototype, "querySelectorAll");
    const one = vi.spyOn(Element.prototype, "querySelector");
    const { container, rerender } = setup(ui(names(100)));
    await settle();
    const table = container.querySelector("table")!;
    // Queries on the whole table: a pass over every cell from each of 100 cells would show here.
    const tableQueries = () =>
      [...all.mock.contexts, ...one.mock.contexts].filter((context) => context === table).length;

    expect(tableQueries()).toBeLessThan(10);
    expect(tabbables(container)).toEqual(["row-0"]);

    all.mockClear();
    one.mockClear();
    rerender(ui([...names(100, 100), ...names(100)]));
    await settle();
    expect(tableQueries()).toBeLessThan(10);
    expect(tabbables(container)).toEqual(["row-0"]);
  });
});

describe("table tab stop when React hides rows or cells", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const findCell = (container: Element, text: string) =>
    [...container.querySelectorAll<HTMLElement>("th, td")].find(
      (cell) => cell.textContent === text,
    )!;

  function grid(lastRow: (row: ReactElement) => ReactNode) {
    return (
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn>Name</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Ada</TableCell>
          </TableRow>
          {lastRow(
            <TableRow>
              <TableCell>Grace</TableCell>
            </TableRow>,
          )}
        </TableBody>
      </Table>
    );
  }

  it("moves the stop off a row an Activity hides, so Tab still enters the grid", async () => {
    const ui = (visible: boolean) =>
      page(grid((row) => <Activity mode={visible ? "visible" : "hidden"}>{row}</Activity>));
    const { container, rerender, user } = setup(ui(true));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "Grace"));
    await user.click(before!);
    rerender(ui(false));
    await settle();
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "Name"));

    rerender(ui(true));
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("moves the stop off a row whose Suspense boundary suspends again", async () => {
    let pending: Promise<void> | null = null;
    function Gate({ children }: { children: ReactElement }) {
      if (pending) use(pending);
      return children;
    }
    const ui = () =>
      page(
        grid((row) => (
          <Suspense
            fallback={
              <TableRow>
                <TableCell>Loading</TableCell>
              </TableRow>
            }
          >
            <Gate>{row}</Gate>
          </Suspense>
        )),
      );
    const { container, rerender, user } = setup(ui());
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "Grace"));
    await user.click(before!);
    let resolve!: () => void;
    pending = new Promise<void>((done) => {
      resolve = done;
    });
    rerender(ui());
    await settle();
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "Name"));

    pending = null;
    await act(async () => resolve());
    await settle();
    expect(tableStops(container)).toEqual(["Name"]);
  });

  it("keeps the stop when rows whose one widget has tabIndex 0 arrive while an Activity hides the table", async () => {
    // A consumer's own focusable element, such as a custom button rendered with tabIndex 0.
    const Chip = (props: ComponentProps<"span">) => <span {...props} />;
    const ui = (visible: boolean, extra: string[]) =>
      page(
        <Activity mode={visible ? "visible" : "hidden"}>
          <Table aria-label="People">
            <TableBody>
              {["Ada", "Grace"].map((name) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell>{`${name} role`}</TableCell>
                </TableRow>
              ))}
              {extra.map((name) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell>
                    <Chip tabIndex={0}>{`${name} info`}</Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Activity>,
      );
    const { container, rerender, user } = setup(ui(true, []));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "Grace"));
    await user.click(before!);
    rerender(ui(false, []));
    await settle();
    rerender(ui(false, ["Mary", "Lin"]));
    await settle();
    rerender(ui(true, ["Mary", "Lin"]));
    await settle();
    expect(tableStops(container)).toEqual(["Grace"]);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "Grace"));
  });

  it("moves the stop off a row hidden while an Activity hid the whole table", async () => {
    const ui = (table: boolean, row: boolean) =>
      page(
        <Activity mode={table ? "visible" : "hidden"}>
          {grid((last) => (
            <Activity mode={row ? "visible" : "hidden"}>{last}</Activity>
          ))}
        </Activity>,
      );
    const { container, rerender, user } = setup(ui(true, true));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "Grace"));
    await user.click(before!);
    rerender(ui(false, true));
    await settle();
    rerender(ui(false, false));
    await settle();
    rerender(ui(true, false));
    await settle();
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "Name"));
  });

  it("falls back past a hidden first row when the row holding the stop is removed", async () => {
    const ui = (rows: string[]) =>
      page(
        <Table aria-label="People">
          <TableBody>
            <Activity mode="hidden">
              <TableRow>
                <TableCell>First</TableCell>
              </TableRow>
            </Activity>
            {rows.map((name) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      );
    const { container, rerender, user } = setup(ui(["a", "b", "c"]));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");

    await user.click(findCell(container, "c"));
    await user.click(before!);
    rerender(ui(["a", "b"]));
    await settle();
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(findCell(container, "a"));
  });

  it("leaves the widgets of a cell outside a Table alone inside a consumer's own grid", () => {
    const { container } = render(
      <div role="grid">
        <table>
          <tbody>
            <tr>
              <TableCell>
                <button type="button">Act</button>
              </TableCell>
            </tr>
          </tbody>
        </table>
      </div>,
    );

    expect(container.querySelector("button")!.getAttribute("tabindex")).toBeNull();
  });
});
