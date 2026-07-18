import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Table } from "./components/Table.js";
import { TableBody } from "./components/TableBody.js";
import { TableCaption } from "./components/TableCaption.js";
import { TableCell } from "./components/TableCell.js";
import { TableColumn } from "./components/TableColumn.js";
import { TableFooter } from "./components/TableFooter.js";
import { TableHeader } from "./components/TableHeader.js";
import { TableRow } from "./components/TableRow.js";
import { TableRowHeader } from "./components/TableRowHeader.js";

function fireClickWith(element: Element, shiftKey: boolean) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { shiftKey, bubbles: true, cancelable: true }));
  });
}

function fireKey(element: Element, key: string, ctrlKey = false, shiftKey = false) {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key, ctrlKey, shiftKey, bubbles: true, cancelable: true }),
    );
  });
}

function renderTable() {
  const result = render(
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
  it("renders the complete native table anatomy", () => {
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

  it("renders native table semantics with the grid role and one tab stop", () => {
    const { table, cells } = renderTable();
    expect(table.getAttribute("role")).toBe("grid");
    expect(table.querySelectorAll("thead th[scope='col']")).toHaveLength(2);
    expect(cells).toHaveLength(6);
    expect(cells.filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
    expect(cells[0]!.tabIndex).toBe(0);
  });

  it("moves between cells in two dimensions with the arrow keys", () => {
    const { cells } = renderTable();
    cells[0]!.focus();
    fireKey(cells[0]!, "ArrowRight");
    expect(document.activeElement).toBe(cells[1]);
    fireKey(cells[1]!, "ArrowDown");
    expect(document.activeElement).toBe(cells[3]);
    fireKey(cells[3]!, "ArrowLeft");
    expect(document.activeElement).toBe(cells[2]);
    fireKey(cells[2]!, "ArrowUp");
    expect(document.activeElement).toBe(cells[0]);
    fireKey(cells[0]!, "ArrowUp");
    expect(document.activeElement).toBe(cells[0]);
  });

  it("mirrors horizontal cell navigation in right-to-left layouts", () => {
    const { table, cells } = renderTable();
    table.style.direction = "rtl";
    cells[0]!.focus();

    fireKey(cells[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(cells[1]);
  });

  it("supports Home, End, and Ctrl edges, and moves the roving tab stop", () => {
    const { cells } = renderTable();
    cells[0]!.focus();
    fireKey(cells[0]!, "End");
    expect(document.activeElement).toBe(cells[1]);
    fireKey(cells[1]!, "Home");
    expect(document.activeElement).toBe(cells[0]);
    fireKey(cells[0]!, "End", true);
    expect(document.activeElement).toBe(cells[5]);
    expect(cells[5]!.tabIndex).toBe(0);
    expect(cells[0]!.tabIndex).toBe(-1);
    fireKey(cells[5]!, "Home", true);
    expect(document.activeElement).toBe(cells[0]);
  });
});

describe("table selection, sort, and resize", () => {
  it("walks through every interactive item in a cell before moving on", () => {
    const { container } = render(
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
    fireKey(cells[0]!, "ArrowRight");
    expect(document.activeElement).toBe(cells[1]);
    fireKey(cells[1]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[0]);
    fireKey(buttons[0]!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[1]);
    fireKey(buttons[1]!, "ArrowRight");
    expect(document.activeElement).toBe(cells[2]);
    fireKey(cells[2]!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("focuses a cell's single widget instead of the cell and keeps one tab stop", () => {
    const { container } = render(
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
    fireKey(cells[1]!, "ArrowLeft");
    expect(document.activeElement).toBe(checkbox);
  });

  it("activates sort from click and keyboard and exposes aria-sort", () => {
    const onSort = vi.fn();
    const { container } = render(
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
    expect(header.dataset["sort"]).toBe("ascending");
    expect(header.dataset["sortable"]).toBe("");
    fireClick(header);
    expect(onSort).toHaveBeenCalledTimes(1);
    fireKey(header, "Enter");
    expect(onSort).toHaveBeenCalledTimes(2);
  });

  it("resizes with Shift+Arrow on the header without moving grid focus", () => {
    const onResize = vi.fn();
    const { container } = render(
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
    fireKey(headers[0]!, "ArrowRight", false, true);
    expect(onResize).toHaveBeenLastCalledWith(16);
    expect(document.activeElement).toBe(headers[0]);
    fireKey(headers[0]!, "ArrowLeft", false, true);
    expect(onResize).toHaveBeenLastCalledWith(0);
  });
});

describe("table range selection", () => {
  function renderSelectable(onRangeSelect = vi.fn()) {
    const result = render(
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

  it("selects the range from the click anchor on shift-click", () => {
    const { cells, onRangeSelect } = renderSelectable();
    fireClickWith(cells[0]!, false);
    fireClickWith(cells[2]!, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b", "c"]);
    fireClickWith(cells[1]!, false);
    fireClickWith(cells[0]!, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("extends the range while moving with Shift+ArrowDown and resets on plain movement", () => {
    const { cells, onRangeSelect } = renderSelectable();
    cells[0]!.focus();
    fireClickWith(cells[0]!, false);
    fireKey(cells[0]!, "ArrowDown", false, true);
    expect(document.activeElement).toBe(cells[1]);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b"]);
    fireKey(cells[1]!, "ArrowDown", false, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["a", "b", "c"]);
    fireKey(cells[2]!, "ArrowUp", false, false);
    fireKey(cells[1]!, "ArrowDown", false, true);
    expect(onRangeSelect).toHaveBeenLastCalledWith(["b", "c"]);
  });
});
