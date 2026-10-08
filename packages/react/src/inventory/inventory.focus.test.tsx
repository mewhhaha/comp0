import { act } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { renderInventory } from "../../test/inventory-fixtures.js";
import { Inventory } from "./Inventory.js";
import { InventoryItem } from "./InventoryItem.js";

describe("inventory structure and focus", () => {
  it("renders a semantic list with grid placement and named controls", async () => {
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
    expect(move.getAttribute("aria-keyshortcuts")).toContain("Enter");
    expect(resize.getAttribute("aria-label")).toBe("Resize Revenue");
    expect(container.querySelector("[data-slot='inventory-preview']")).toBeNull();
    const items = container.querySelectorAll<HTMLElement>("li[data-value]");
    expect(items[0]!.tabIndex).toBe(0);
    expect([...items].slice(1).every((item) => item.tabIndex === -1)).toBe(true);
    expect(
      [...container.querySelectorAll("button")].every((button) => button.tabIndex === -1),
    ).toBe(true);
  });

  it("moves item focus to the closest card in each visual direction", async () => {
    const { container, user } = setup(
      <Inventory
        columns={5}
        rows={5}
        defaultValue={[
          { value: "center", column: 3, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "up", column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "right", column: 5, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "down", column: 3, row: 5, columnSpan: 1, rowSpan: 1 },
          { value: "left", column: 1, row: 3, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="center">Center</InventoryItem>
        <InventoryItem value="up">Up</InventoryItem>
        <InventoryItem value="right">Right</InventoryItem>
        <InventoryItem value="down">Down</InventoryItem>
        <InventoryItem value="left">Left</InventoryItem>
      </Inventory>,
    );
    const item = (value: string) =>
      container.querySelector<HTMLElement>(`li[data-value='${value}']`)!;

    for (const [key, value] of [
      ["ArrowUp", "up"],
      ["ArrowRight", "right"],
      ["ArrowDown", "down"],
      ["ArrowLeft", "left"],
    ] as const) {
      act(() => item("center").focus());
      await user.keyboard(`{${key}}`);
      expect(document.activeElement).toBe(item(value));
      expect(item(value).tabIndex).toBe(0);
      expect(item("center").tabIndex).toBe(-1);
    }
  });

  it("prefers the card most aligned with the movement direction", async () => {
    const { container, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;

    await pressKey(user, revenue, "{ArrowRight}");

    expect(document.activeElement).toBe(conversion);
  });

  it("tabs through the focused card controls before leaving the inventory", async () => {
    const { container, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const [move, resize] = revenue.querySelectorAll<HTMLButtonElement>("button");

    act(() => revenue.focus());
    await user.tab();
    expect(document.activeElement).toBe(move);
    await user.tab();
    expect(document.activeElement).toBe(resize);

    const leaving = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    act(() => resize!.dispatchEvent(leaving));
    expect(leaving.defaultPrevented).toBe(false);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(move);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(revenue);
  });

  it("makes the focused card the inventory tab stop", async () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;

    act(() => alerts.focus());

    expect(alerts.tabIndex).toBe(0);
    expect(revenue.tabIndex).toBe(-1);
  });
});
