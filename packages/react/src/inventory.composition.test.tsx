import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { Inventory, type InventoryLayout } from "./components/Inventory.js";
import { InventoryItem } from "./components/InventoryItem.js";
import { InventoryMoveHandle } from "./components/InventoryMoveHandle.js";
import { InventoryResizeHandle } from "./components/InventoryResizeHandle.js";

const initialLayout: InventoryLayout = [
  { value: "revenue", column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
  { value: "conversion", column: 4, row: 1, columnSpan: 3, rowSpan: 1 },
  { value: "alerts", column: 6, row: 2, columnSpan: 1, rowSpan: 2 },
];

function renderInventory(onChange = vi.fn()) {
  const result = render(
    <Inventory
      aria-label="Store overview"
      columns={6}
      rows={6}
      defaultValue={initialLayout}
      onChange={onChange}
      style={{ width: 600, height: 480, gap: 8 }}
    >
      <InventoryItem value="revenue" textValue="Revenue">
        Revenue
        <InventoryMoveHandle />
        <InventoryResizeHandle />
      </InventoryItem>
      <InventoryItem value="conversion" textValue="Conversion">
        Conversion
        <InventoryMoveHandle />
      </InventoryItem>
      <InventoryItem value="alerts" textValue="Alerts">
        Alerts
        <InventoryResizeHandle />
      </InventoryItem>
    </Inventory>,
  );
  return { ...result, onChange };
}

function thrownEvidence(callback: () => void) {
  try {
    callback();
  } catch (error) {
    if (error instanceof AggregateError) return error.errors.map(String).join("\n");
    return String(error);
  }
  return "";
}

describe("inventory composition", () => {
  it("renders a semantic list with grid placement and named controls", () => {
    const { container } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    const resize = revenue.querySelector<HTMLButtonElement>(
      "[data-slot='inventory-resize-handle']",
    )!;

    expect(inventory.getAttribute("aria-label")).toBe("Store overview");
    expect(inventory.style.gridTemplateColumns).toContain("repeat(6");
    expect(inventory.style.gridTemplateRows).toContain("repeat(6");
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.dataset.columnSpan).toBe("3");
    expect(revenue.style.gridColumn).toBe("1 / span 3");
    expect(move.getAttribute("aria-label")).toBe("Move Revenue");
    expect(resize.getAttribute("aria-label")).toBe("Resize Revenue");
  });

  it("moves by grid units and pushes obstructing items forward", () => {
    const { container, onChange } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector("[data-slot='inventory-move-handle']")!;

    fireKeyDown(move, "ArrowRight");

    expect(revenue.dataset.column).toBe("2");
    expect(conversion.dataset.column).toBe("1");
    expect(conversion.dataset.row).toBe("3");
    expect(onChange).toHaveBeenCalledOnce();
    expect(container.querySelector("output")?.textContent).toContain(
      "Revenue moved to column 2, row 1",
    );
  });

  it("resizes in row and column spans and marks rejected placements", () => {
    const { container } = renderInventory();
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;
    const resize = alerts.querySelector("[data-slot='inventory-resize-handle']")!;

    fireKeyDown(resize, "ArrowDown");
    expect(alerts.dataset.rowSpan).toBe("3");

    fireKeyDown(resize, "ArrowRight");
    expect(alerts.dataset.columnSpan).toBe("1");
    expect(alerts.hasAttribute("data-invalid-placement")).toBe(true);
    expect(resize.hasAttribute("data-invalid-placement")).toBe(true);
    expect(container.querySelector("output")?.textContent).toContain("Alerts cannot fit there");
  });

  it("reports controlled changes without moving until its owner responds", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Inventory columns={6} rows={6} value={initialLayout} onChange={onChange}>
        <InventoryItem value="revenue" textValue="Revenue">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryItem value="conversion">Conversion</InventoryItem>
        <InventoryItem value="alerts">Alerts</InventoryItem>
      </Inventory>,
    );
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;

    fireKeyDown(revenue.querySelector("button")!, "ArrowRight");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]?.[0][0]).toMatchObject({ value: "revenue", column: 2 });
    expect(revenue.dataset.column).toBe("1");
  });

  it("moves with captured pointer geometry and restores a cancelled layout", () => {
    const { container, onChange } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    Object.defineProperties(inventory, {
      clientWidth: { value: 600 },
      clientHeight: { value: 480 },
    });
    move.setPointerCapture = vi.fn();
    move.hasPointerCapture = vi.fn(() => false);

    act(() => {
      move.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 110,
          clientY: 0,
        }),
      );
    });
    expect(revenue.dataset.column).toBe("2");
    expect(revenue.hasAttribute("data-dragging")).toBe(true);

    act(() => {
      move.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true, cancelable: true }));
    });
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed, duplicate, overlapping, and missing layout entries with evidence", () => {
    const invalidLayouts: Array<[InventoryLayout, string]> = [
      [[{ value: "bad", column: 0, row: 1, columnSpan: 1, rowSpan: 1 }], "column 0"],
      [
        [
          { value: "same", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "same", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ],
        'value "same" appears more than once',
      ],
      [
        [
          { value: "first", column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ],
        'values "first" and "second" overlap',
      ],
    ];

    for (const [layout, evidence] of invalidLayouts) {
      expect(
        thrownEvidence(() =>
          render(<Inventory columns={3} rows={3} defaultValue={layout} aria-label="Invalid" />),
        ),
      ).toContain(evidence);
    }

    expect(
      thrownEvidence(() =>
        render(
          <Inventory columns={3} rows={3} defaultValue={[]} aria-label="Missing">
            <InventoryItem value="missing">Missing</InventoryItem>
          </Inventory>,
        ),
      ),
    ).toContain('InventoryItem value "missing" is missing from Inventory layout');
  });
});
