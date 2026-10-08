import { describe, expect, it } from "vitest";
import type { InventoryLayout } from "./inventory-layout.js";
import {
  findInventoryNeighbor,
  inventoryTabTarget,
  isInventoryDirection,
} from "./inventory-navigation.js";

const layout: InventoryLayout = [
  { value: "wide", column: 1, row: 1, columnSpan: 3, rowSpan: 1 },
  { value: "left", column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
  { value: "middle", column: 2, row: 2, columnSpan: 1, rowSpan: 1 },
  { value: "right", column: 3, row: 2, columnSpan: 1, rowSpan: 1 },
];

describe("inventory navigation", () => {
  it("recognises arrow directions only", () => {
    expect(isInventoryDirection("ArrowUp")).toBe(true);
    expect(isInventoryDirection("Home")).toBe(false);
  });

  it("moves to the neighbour in each direction", () => {
    expect(findInventoryNeighbor(layout, "left", "ArrowRight")).toBe("middle");
    expect(findInventoryNeighbor(layout, "right", "ArrowLeft")).toBe("middle");
    expect(findInventoryNeighbor(layout, "middle", "ArrowUp")).toBe("wide");
    expect(findInventoryNeighbor(layout, "wide", "ArrowDown")).toBe("middle");
  });

  it("returns undefined at an edge or for an unknown item", () => {
    expect(findInventoryNeighbor(layout, "left", "ArrowLeft")).toBeUndefined();
    expect(findInventoryNeighbor(layout, "missing", "ArrowUp")).toBeUndefined();
  });

  it("skips unavailable items", () => {
    expect(findInventoryNeighbor(layout, "left", "ArrowRight", (value) => value !== "middle")).toBe(
      "right",
    );
  });

  it("walks card controls with Tab and returns to the card on Shift+Tab", () => {
    const controls = ["move", "resize"];
    expect(inventoryTabTarget(controls, "move", false)).toBe("resize");
    expect(inventoryTabTarget(controls, "resize", false)).toBeUndefined();
    expect(inventoryTabTarget(controls, "resize", true)).toBe("move");
    expect(inventoryTabTarget(controls, "move", true)).toBe("card");
  });
});
