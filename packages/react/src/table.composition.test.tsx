import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Table } from "./components/Table.js";
import { TableBody } from "./components/TableBody.js";
import { TableCell } from "./components/TableCell.js";
import { TableColumn } from "./components/TableColumn.js";
import { TableHeader } from "./components/TableHeader.js";
import { TableRow } from "./components/TableRow.js";

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
  it("renders native table semantics with the grid role and one tab stop", () => {
    const { table, cells } = renderTable();
    expect(table.getAttribute("role")).toBe("grid");
    expect(table.querySelectorAll("thead th[scope='col']")).toHaveLength(2);
    expect(cells).toHaveLength(6);
    expect(cells.filter((cell) => cell.tabIndex === 0)).toHaveLength(1);
    expect(cells[0]!.tabIndex).toBe(0);
  });

  it("moves between cells in two dimensions with the arrow keys", () => {
    const { table, cells } = renderTable();
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

  it("supports Home, End, and Ctrl edges, and moves the roving tab stop", () => {
    const { table, cells } = renderTable();
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
