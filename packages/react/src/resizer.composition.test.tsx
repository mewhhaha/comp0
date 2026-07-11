import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Resizer } from "./components/Resizer.js";
import { Table } from "./components/Table.js";
import { TableColumn } from "./components/TableColumn.js";
import { TableHeader } from "./components/TableHeader.js";
import { TableRow } from "./components/TableRow.js";

function fireKey(element: Element, key: string) {
  act(() => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  });
}

describe("resizer composition", () => {
  it("is a focusable window splitter with keyboard resizing and clamping", () => {
    const onResize = vi.fn();
    const { container } = render(
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

    fireKey(separator, "ArrowRight");
    expect(onResize).toHaveBeenLastCalledWith(196);
    fireKey(separator, "ArrowLeft");
    expect(onResize).toHaveBeenLastCalledWith(164);
    fireKey(separator, "Home");
    expect(onResize).toHaveBeenLastCalledWith(120);
    fireKey(separator, "End");
    expect(onResize).toHaveBeenLastCalledWith(320);
  });

  it("joins the arrow-key path inside a resizable column without a tab stop", () => {
    const onResize = vi.fn();
    const { container } = render(
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

    headers[0]!.focus();
    fireKey(headers[0]!, "ArrowRight");
    expect(document.activeElement).toBe(separator);
    // Shift+Arrow on the focused handle resizes through the column header.
    act(() => {
      separator.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(onResize).toHaveBeenLastCalledWith(16);
    // Plain ArrowRight keeps navigating to the next column.
    fireKey(separator, "ArrowRight");
    expect(document.activeElement).toBe(headers[1]);
  });
});
