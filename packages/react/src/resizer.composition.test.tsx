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

  it("becomes a hidden drag-only handle inside a resizable column", () => {
    const onResize = vi.fn();
    const { container } = render(
      <Table aria-label="People">
        <TableHeader>
          <TableRow>
            <TableColumn onResize={onResize}>
              Name
              <Resizer />
            </TableColumn>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const separator = container.querySelector<HTMLElement>("[role='separator']")!;
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    expect(separator.tabIndex).toBe(-1);
    // The header keeps the grid stop; the handle does not become the cell widget.
    const header = container.querySelector<HTMLTableCellElement>("th")!;
    expect(header.tabIndex).toBe(0);
  });
});
