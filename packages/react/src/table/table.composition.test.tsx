import { Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
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

    cells[1]!.tabIndex = 0;
    cells[1]!.focus();
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
