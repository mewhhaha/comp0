import { describe, expect, it } from "vitest";
import {
  insertionSlot,
  orderAfterDrop,
  orderAfterStep,
  retargetKeyboardMove,
  sameOrder,
} from "./grid-list-order.js";

const order = ["a", "b", "c", "d"];

describe("grid list order arithmetic", () => {
  it("compares orders by value and position", () => {
    expect(sameOrder(order, ["a", "b", "c", "d"])).toBe(true);
    expect(sameOrder(order, ["a", "c", "b", "d"])).toBe(false);
    expect(sameOrder(order, ["a", "b"])).toBe(false);
  });

  it("steps a row one place and stops at the edges", () => {
    expect(orderAfterStep(order, "b", 1)).toEqual(["a", "c", "b", "d"]);
    expect(orderAfterStep(order, "b", -1)).toEqual(["b", "a", "c", "d"]);
    expect(orderAfterStep(order, "a", -1)).toBeNull();
    expect(orderAfterStep(order, "d", 1)).toBeNull();
    expect(orderAfterStep(order, "missing", 1)).toBeNull();
    expect(order).toEqual(["a", "b", "c", "d"]);
  });

  it("drops before or after a target row", () => {
    expect(orderAfterDrop(order, "a", { value: "c", edge: "before" })).toEqual([
      "b",
      "a",
      "c",
      "d",
    ]);
    expect(orderAfterDrop(order, "a", { value: "c", edge: "after" })).toEqual(["b", "c", "a", "d"]);
    expect(orderAfterDrop(order, "d", { value: "a", edge: "before" })).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("returns null for drops that change nothing or miss their target", () => {
    expect(orderAfterDrop(order, "b", { value: "b", edge: "before" })).toBeNull();
    expect(orderAfterDrop(order, "b", { value: "a", edge: "after" })).toBeNull();
    expect(orderAfterDrop(order, "b", { value: "c", edge: "before" })).toBeNull();
    expect(orderAfterDrop(order, "b", { value: "missing", edge: "after" })).toBeNull();
  });

  it("locates the insertion slot among the other rows", () => {
    expect(insertionSlot(order, "b", null)).toBe(1);
    expect(insertionSlot(order, "b", { value: "d", edge: "before" })).toBe(2);
    expect(insertionSlot(order, "b", { value: "d", edge: "after" })).toBe(3);
  });
});

describe("keyboard retargeting", () => {
  it("steps the pending slot down from the row's own slot", () => {
    expect(retargetKeyboardMove({ order, moved: "a", target: null, direction: "down" })).toEqual({
      kind: "target",
      target: { value: "c", edge: "before" },
      position: 2,
      total: 4,
    });
  });

  it("withdraws when the next slot is the row's own", () => {
    // Moving "b" up from slot 1 lands on slot 0; moving back down returns to its own slot.
    const up = retargetKeyboardMove({ order, moved: "b", target: null, direction: "up" });
    expect(up).toEqual({
      kind: "target",
      target: { value: "a", edge: "before" },
      position: 1,
      total: 4,
    });
    const back = retargetKeyboardMove({
      order,
      moved: "b",
      target: { value: "a", edge: "before" },
      direction: "down",
    });
    expect(back).toEqual({ kind: "withdraw", position: 2, total: 4 });
  });

  it("targets the end of the list with an after edge on the last other row", () => {
    expect(
      retargetKeyboardMove({
        order,
        moved: "a",
        target: { value: "c", edge: "after" },
        direction: "down",
      }),
    ).toEqual({ kind: "target", target: { value: "d", edge: "after" }, position: 4, total: 4 });
  });

  it("skips slots the policy vetoes and reports blocked when none remain", () => {
    expect(
      retargetKeyboardMove({
        order,
        moved: "d",
        target: null,
        direction: "up",
        allows: (proposed) => proposed[0] !== "d" && proposed[1] !== "d",
      }),
    ).toEqual({ kind: "target", target: { value: "c", edge: "before" }, position: 3, total: 4 });
    expect(
      retargetKeyboardMove({
        order,
        moved: "a",
        target: { value: "d", edge: "after" },
        direction: "down",
      }),
    ).toEqual({ kind: "blocked" });
    expect(
      retargetKeyboardMove({
        order,
        moved: "b",
        target: null,
        direction: "up",
        allows: () => false,
      }),
    ).toEqual({ kind: "blocked" });
  });
});
