import { act } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { mockPointerGeometry, renderInventory } from "../../test/inventory-fixtures.js";
import { Inventory } from "./Inventory.js";
import { InventoryItem } from "./InventoryItem.js";
import { InventoryMoveHandle } from "./InventoryMoveHandle.js";
import { InventoryPreview } from "./InventoryPreview.js";
import { InventoryResizeHandle } from "./InventoryResizeHandle.js";

describe("inventory pointer gestures", () => {
  it("moves with captured pointer geometry and restores a cancelled layout", async () => {
    const { container, onChange } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    mockPointerGeometry(inventory, move, { width: 600, height: 480 });

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
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("2");

    act(() => {
      move.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true, cancelable: true }));
    });
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("restores the starting layout when the pointer returns to its starting cell", async () => {
    const { container, onChange } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;
    mockPointerGeometry(inventory, move, { width: 600, height: 480 });

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
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        }),
      );
    });

    expect(revenue.dataset.column).toBe("1");
    expect(conversion.dataset.column).toBe("4");
    expect(conversion.dataset.row).toBe("1");
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("1");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("clamps pointer movement to the nearest grid edge", async () => {
    const { container } = render(
      <Inventory
        columns={3}
        rows={3}
        defaultValue={[{ value: "card", column: 2, row: 2, columnSpan: 1, rowSpan: 1 }]}
      >
        <InventoryItem value="card" textValue="Card">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const card = container.querySelector<HTMLElement>('[data-value="card"]')!;
    const move = card.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, move, { width: 300, height: 300 });

    act(() => {
      move.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      move.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 1000,
          clientY: -1000,
        }),
      );
    });

    expect(card.dataset.column).toBe("3");
    expect(card.dataset.row).toBe("1");
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.column).toBe("3");
    expect(preview.dataset.row).toBe("1");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("clamps pointer resizing to the available grid tracks", async () => {
    const { container } = render(
      <Inventory
        columns={3}
        rows={3}
        defaultValue={[{ value: "card", column: 1, row: 1, columnSpan: 1, rowSpan: 1 }]}
      >
        <InventoryItem value="card" textValue="Card">
          <InventoryResizeHandle />
        </InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const card = container.querySelector<HTMLElement>('[data-value="card"]')!;
    const resize = card.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, resize, { width: 300, height: 300 });

    act(() => {
      resize.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      resize.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 1000,
          clientY: 1000,
        }),
      );
    });

    expect(card.dataset.columnSpan).toBe("3");
    expect(card.dataset.rowSpan).toBe("3");
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.columnSpan).toBe("3");
    expect(preview.dataset.rowSpan).toBe("3");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("marks only the preview invalid when displaced items cannot fit anywhere", async () => {
    const { container } = render(
      <Inventory
        columns={2}
        rows={1}
        defaultValue={[
          { value: "first", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="first" textValue="First">
          <InventoryResizeHandle />
        </InventoryItem>
        <InventoryItem value="second">Second</InventoryItem>
        <InventoryPreview />
      </Inventory>,
    );
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const first = container.querySelector<HTMLElement>('[data-value="first"]')!;
    const resize = first.querySelector<HTMLButtonElement>("button")!;
    mockPointerGeometry(inventory, resize, { width: 200, height: 100 });

    act(() => {
      resize.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }),
      );
      resize.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 0,
        }),
      );
    });

    expect(first.dataset.columnSpan).toBe("1");
    expect(first.hasAttribute("data-invalid-placement")).toBe(false);
    const preview = container.querySelector<HTMLElement>("[data-slot='inventory-preview']")!;
    expect(preview.dataset.columnSpan).toBe("2");
    expect(preview.hasAttribute("data-invalid-placement")).toBe(true);
    expect(container.querySelector("output")?.textContent).toBe("");

    act(() => {
      resize.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true }));
    });

    expect(container.querySelector("output")?.textContent).toContain("First cannot fit there");
  });
});
