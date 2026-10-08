import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Resizer } from "./Resizer.js";
import { Table } from "../table/Table.js";
import { TableColumn } from "../table/TableColumn.js";
import { TableHeader } from "../table/TableHeader.js";
import { TableRow } from "../table/TableRow.js";

describe("resizer composition", () => {
  it("renders the separator as the element given to as", () => {
    const { container } = render(<Resizer as="div" aria-label="Resize" size={10} />);
    const separator = container.querySelector("div[role='separator']")!;
    expect(separator.getAttribute("aria-valuenow")).toBe("10");
  });

  it("is a focusable window splitter with keyboard resizing and clamping", async () => {
    const onResize = vi.fn();
    const { container, user } = setup(
      <div>
        <Resizer aria-label="Resize sidebar" size={180} min={120} max={320} onResize={onResize} />
      </div>,
    );
    const separator = container.querySelector<HTMLElement>("[role='separator']")!;
    expect(separator.tabIndex).toBe(0);
    expect(separator.getAttribute("aria-orientation")).toBe("vertical");
    expect(separator.getAttribute("aria-valuenow")).toBe("180");
    expect(separator.getAttribute("aria-valuemin")).toBe("120");
    expect(separator.getAttribute("aria-valuemax")).toBe("320");

    act(() => separator.focus());
    await user.keyboard("{ArrowRight}");
    expect(onResize).toHaveBeenLastCalledWith(196);
    await user.keyboard("{ArrowLeft}");
    expect(onResize).toHaveBeenLastCalledWith(164);
    await user.keyboard("{Home}");
    expect(onResize).toHaveBeenLastCalledWith(120);
    await user.keyboard("{End}");
    expect(onResize).toHaveBeenLastCalledWith(320);
  });

  it("joins the arrow-key path inside a resizable column without a tab stop", async () => {
    const onResize = vi.fn();
    const { container, user } = setup(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>
              Name
              <Resizer aria-label="Resize name" />
            </TableColumn>
            <TableColumn>Role</TableColumn>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const separator = container.querySelector<HTMLElement>("[role='separator']")!;
    const headers = [...container.querySelectorAll<HTMLTableCellElement>("th")];
    // The header keeps the tab stop; the handle is reachable by arrow only.
    expect(headers[0]!.tabIndex).toBe(0);
    expect(separator.tabIndex).toBe(-1);
    expect(separator.getAttribute("aria-hidden")).toBeNull();

    act(() => headers[0]!.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(separator);
    // Shift+Arrow on the focused handle resizes through the column header.
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onResize).toHaveBeenLastCalledWith(16);
    // Plain ArrowRight keeps navigating to the next column.
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(headers[1]);
  });

  it("uses the resizer bounds for keyboard resizing inside a table column", async () => {
    const onResize = vi.fn();
    const { container, user } = setup(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>
              Name
              <Resizer aria-label="Resize name" size={120} min={100} max={128} />
            </TableColumn>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const separator = container.querySelector<HTMLElement>("[role='separator']")!;

    act(() => separator.focus());
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(onResize).toHaveBeenLastCalledWith(128);
  });
});
