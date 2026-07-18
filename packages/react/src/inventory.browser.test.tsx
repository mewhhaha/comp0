import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { Inventory } from "./components/Inventory.js";
import { InventoryItem } from "./components/InventoryItem.js";
import { InventoryMoveHandle } from "./components/InventoryMoveHandle.js";
import { InventoryResizeHandle } from "./components/InventoryResizeHandle.js";
import { render } from "../test/render.js";

describe("inventory browser interactions", () => {
  it("enters once, moves spatially, tabs through one card, and leaves", async () => {
    const { unmount } = render(
      <div>
        <button type="button">Before</button>
        <Inventory
          aria-label="Dashboard"
          columns={3}
          rows={1}
          defaultValue={[
            { value: "left", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
            { value: "right", column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
          ]}
        >
          <InventoryItem value="left" textValue="Left card">
            Left
            <InventoryMoveHandle />
          </InventoryItem>
          <InventoryItem value="right" textValue="Right card">
            Right
            <InventoryMoveHandle />
            <InventoryResizeHandle />
          </InventoryItem>
        </Inventory>
        <button type="button">After</button>
      </div>,
    );
    const before = page.getByRole("button", { name: "Before" }).element();
    const after = page.getByRole("button", { name: "After" }).element();
    const leftMove = page.getByRole("button", { name: "Move Left card" }).element();
    const move = page.getByRole("button", { name: "Move Right card" }).element();
    const resize = page.getByRole("button", { name: "Resize Right card" }).element();
    const left = leftMove.closest("li")!;
    const right = move.closest("li")!;

    await act(async () => userEvent.click(before));
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(left);

    await act(async () => userEvent.keyboard("{ArrowRight}"));
    expect(document.activeElement).toBe(right);

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(move);
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(resize);
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(after);

    await act(async () => userEvent.tab({ shift: true }));
    expect(document.activeElement).toBe(right);
    unmount();
  });

  it("requires handle activation and cancels an active change when focus leaves", async () => {
    const { unmount } = render(
      <div>
        <Inventory
          aria-label="Dashboard"
          columns={2}
          rows={1}
          defaultValue={[{ value: "card", column: 1, row: 1, columnSpan: 1, rowSpan: 1 }]}
        >
          <InventoryItem value="card" textValue="Card">
            Card
            <InventoryMoveHandle />
          </InventoryItem>
        </Inventory>
        <button type="button">After</button>
      </div>,
    );
    const move = page.getByRole("button", { name: "Move Card" }).element();
    const after = page.getByRole("button", { name: "After" }).element();
    const card = move.closest("li")!;

    act(() => move.focus());
    await act(async () => userEvent.keyboard("{ArrowRight}"));
    expect(card.dataset.column).toBe("1");

    await act(async () => userEvent.keyboard("{Enter}{ArrowRight}"));
    expect(card.dataset.column).toBe("2");
    expect(card.hasAttribute("data-dragging")).toBe(true);

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(after);
    expect(card.dataset.column).toBe("1");
    expect(card.hasAttribute("data-dragging")).toBe(false);
    unmount();
  });
});
