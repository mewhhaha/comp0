import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { initialLayout, renderInventory } from "../../test/inventory-fixtures.js";
import { pressKey } from "../../test/press-key.js";
import { Inventory } from "./Inventory.js";
import { InventoryItem } from "./InventoryItem.js";
import { InventoryMoveHandle } from "./InventoryMoveHandle.js";

describe("inventory keyboard movement", () => {
  it("moves by grid units after activation and pushes obstructing items forward", async () => {
    const { container, onChange, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector("[data-slot='inventory-move-handle']")!;

    await pressKey(user, move!, "{ArrowRight}");
    expect(revenue.dataset.column).toBe("1");

    await pressKey(user, move!, "{Enter}");
    await pressKey(user, move!, "{ArrowRight}");

    expect(revenue.dataset.column).toBe("2");
    expect(conversion.dataset.column).toBe("1");
    expect(conversion.dataset.row).toBe("3");
    expect(onChange).toHaveBeenCalledOnce();
    expect(container.querySelector("output")?.textContent).toContain(
      "Revenue moved to column 2, row 1",
    );
  });

  it("keeps keyboard movement active until the handle is pressed again", async () => {
    const { container, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;

    await pressKey(user, move!, " ");

    expect(revenue.hasAttribute("data-dragging")).toBe(true);
    expect(
      container.querySelector<HTMLElement>("[data-slot='inventory-preview']")?.dataset.column,
    ).toBe("1");
    expect(container.querySelector("output")?.textContent).toContain(
      "Moving Revenue. Use the arrow keys",
    );

    await pressKey(user, move!, "{ArrowRight}");
    expect(revenue.dataset.column).toBe("2");

    await pressKey(user, move!, "{Enter}");

    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain(
      "Revenue moved to column 2, row 1",
    );
  });

  it("restores the starting layout when Escape cancels keyboard movement", async () => {
    const { container, onChange, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-slot='inventory-move-handle']")!;

    await pressKey(user, move!, "{Enter}");
    await pressKey(user, move!, "{ArrowRight}");
    await pressKey(user, move!, "{Escape}");

    expect(revenue.dataset.column).toBe("1");
    expect(conversion.dataset.column).toBe("4");
    expect(conversion.dataset.row).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain("Revenue change cancelled");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("restores the starting layout when focus leaves an active handle", async () => {
    const { container, onChange, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const [move, resize] = revenue.querySelectorAll<HTMLButtonElement>("button");

    await pressKey(user, move!, "{Enter}");
    await pressKey(user, move!, "{ArrowRight}");
    await user.tab();

    expect(document.activeElement).toBe(resize);
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    expect(container.querySelector("output")?.textContent).toContain("Revenue change cancelled");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("resizes in row and column spans without marking a grid edge invalid", async () => {
    const { container, user } = renderInventory();
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;
    const resize = alerts.querySelector("[data-slot='inventory-resize-handle']")!;

    await pressKey(user, resize, "{Enter}");
    await pressKey(user, resize, "{ArrowDown}");
    expect(alerts.dataset.rowSpan).toBe("3");

    await pressKey(user, resize, "{ArrowRight}");
    expect(alerts.dataset.columnSpan).toBe("1");
    expect(alerts.hasAttribute("data-invalid-placement")).toBe(false);
    expect(resize.hasAttribute("data-invalid-placement")).toBe(false);
  });

  it("reports controlled changes without moving until its owner responds", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <Inventory columns={6} rows={6} value={initialLayout} onChange={onChange}>
        <InventoryItem value="revenue" textValue="Revenue">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryItem value="conversion">Conversion</InventoryItem>
        <InventoryItem value="alerts">Alerts</InventoryItem>
      </Inventory>,
    );
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;

    const move = revenue.querySelector("button")!;
    await pressKey(user, move!, "{Enter}");
    await pressKey(user, move!, "{ArrowRight}");

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]?.[0][0]).toMatchObject({ value: "revenue", column: 2 });
    expect(revenue.dataset.column).toBe("1");
  });

  it("keeps the prior layout when displaced items cannot move forward", async () => {
    const { container, user } = setup(
      <Inventory
        columns={2}
        rows={1}
        defaultValue={[
          { value: "first", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "second", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="first" textValue="First">
          <InventoryMoveHandle />
        </InventoryItem>
        <InventoryItem value="second">Second</InventoryItem>
      </Inventory>,
    );
    const first = container.querySelector<HTMLElement>('[data-value="first"]')!;
    const second = container.querySelector<HTMLElement>('[data-value="second"]')!;

    const move = first.querySelector("button")!;
    await pressKey(user, move!, "{Enter}");
    await pressKey(user, move!, "{ArrowRight}");

    expect(first.dataset.column).toBe("1");
    expect(second.dataset.column).toBe("2");
    expect(first.hasAttribute("data-invalid-placement")).toBe(false);
    expect(container.querySelector("output")?.textContent).toContain("First cannot fit there");
  });
});
