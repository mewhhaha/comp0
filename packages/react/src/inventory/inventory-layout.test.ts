import { describe, expect, it, vi } from "vitest";
import {
  assertInventoryLayout,
  constrainInventoryEntry,
  inventoryAnnouncement,
  inventoryKeyDelta,
  inventoryPointerDelta,
  inventoryTrackSteps,
  proposeInventoryChange,
  resolveInventoryLayout,
  stepInventoryEntry,
  type InventoryLayout,
} from "./inventory-layout.js";

const layout: InventoryLayout = [
  { value: "a", column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
  { value: "b", column: 3, row: 1, columnSpan: 2, rowSpan: 1 },
  { value: "c", column: 1, row: 2, columnSpan: 1, rowSpan: 1 },
];

describe("inventory layout", () => {
  it("steps moves by origin and resizes by span", () => {
    const entry = layout[0]!;
    expect(stepInventoryEntry(entry, "move", 1, 2)).toMatchObject({ column: 2, row: 3 });
    expect(stepInventoryEntry(entry, "resize", 1, 2)).toMatchObject({ columnSpan: 3, rowSpan: 3 });
  });

  it("clamps moves to the grid and resizes to the remaining tracks", () => {
    const entry = layout[0]!;
    expect(constrainInventoryEntry({ ...entry, column: 9, row: -4 }, "move", 4, 3)).toMatchObject({
      column: 3,
      row: 1,
    });
    expect(
      constrainInventoryEntry({ ...entry, columnSpan: 9, rowSpan: 0 }, "resize", 4, 3),
    ).toMatchObject({ columnSpan: 4, rowSpan: 1 });
  });

  it("pushes obstructing items to the first free cell", () => {
    const resolved = resolveInventoryLayout(
      layout,
      "c",
      { ...layout[2]!, column: 3, row: 1 },
      4,
      3,
    );
    expect(resolved?.find((entry) => entry.value === "b")).toMatchObject({ column: 1, row: 2 });
  });

  it("rejects a proposal that does not fit", () => {
    expect(resolveInventoryLayout(layout, "a", { ...layout[0]!, column: 4 }, 4, 3)).toBeUndefined();
  });

  it("classifies a proposed change", () => {
    const base = { layout, value: "c", interaction: "move", columns: 4, rows: 2 } as const;
    expect(proposeInventoryChange({ ...base, change: (entry) => entry })?.status).toBe("unchanged");
    const moved = proposeInventoryChange({ ...base, change: (e) => ({ ...e, column: 2 }) });
    expect(moved?.status).toBe("changed");
    expect(moved?.layout?.find((entry) => entry.value === "c")?.column).toBe(2);
    const veto = vi.fn(() => false);
    const rejected = proposeInventoryChange({
      ...base,
      canChange: veto,
      change: (e) => ({ ...e, column: 2 }),
    });
    expect(rejected?.status).toBe("invalid");
    expect(veto).toHaveBeenCalledWith(expect.any(Array), "c");
    expect(proposeInventoryChange({ ...base, value: "x", change: (e) => e })).toBeUndefined();
  });

  it("reports invalid when displaced items cannot fit anywhere", () => {
    const full: InventoryLayout = [
      { value: "a", column: 1, row: 1, columnSpan: 1, rowSpan: 1 },
      { value: "b", column: 2, row: 1, columnSpan: 1, rowSpan: 1 },
    ];
    const update = proposeInventoryChange({
      layout: full,
      value: "a",
      interaction: "resize",
      columns: 2,
      rows: 1,
      change: (entry) => ({ ...entry, columnSpan: 2 }),
    });
    expect(update?.status).toBe("invalid");
  });

  it("maps arrow keys to grid deltas", () => {
    expect(inventoryKeyDelta("ArrowLeft")).toEqual({ column: -1, row: 0 });
    expect(inventoryKeyDelta("ArrowDown")).toEqual({ column: 0, row: 1 });
    expect(inventoryKeyDelta("Enter")).toBeUndefined();
  });

  it("derives grid steps from measured tracks", () => {
    const steps = inventoryTrackSteps({ width: 600, height: 400, columnGap: 8, rowGap: 0 }, 6, 4);
    expect(steps?.columnStep).toBeCloseTo((600 - 40) / 6 + 8);
    expect(steps?.rowStep).toBe(100);
    expect(
      inventoryTrackSteps({ width: 0, height: 400, columnGap: 0, rowGap: 0 }, 6, 4),
    ).toBeUndefined();
  });

  it("rounds pointer displacement to whole grid steps", () => {
    const steps = { columnStep: 100, rowStep: 50 };
    expect(inventoryPointerDelta({ x: 149, y: -80 }, steps)).toEqual({ column: 1, row: -2 });
    expect(inventoryPointerDelta({ x: 40, y: 10 }, steps)).toEqual({ column: 0, row: 0 });
  });

  it("words announcements per interaction", () => {
    const entry = layout[0]!;
    expect(inventoryAnnouncement("result", "move", "Card", entry)).toBe(
      "Card moved to column 1, row 1.",
    );
    expect(inventoryAnnouncement("result", "resize", "Card", entry)).toBe(
      "Card resized to 2 columns by 1 rows.",
    );
    expect(inventoryAnnouncement("invalid", "move", "Card")).toBe("Card cannot fit there.");
    expect(inventoryAnnouncement("cancel", "move", "Card")).toBe("Card change cancelled.");
    expect(inventoryAnnouncement("start", "resize", "Card")).toContain("Resizing Card.");
  });

  it("asserts duplicate, overlapping, and out-of-bounds entries", () => {
    expect(() => assertInventoryLayout(layout, 4, 2)).not.toThrow();
    expect(() => assertInventoryLayout([layout[0]!, layout[0]!], 4, 2)).toThrow(/more than once/);
    expect(() => assertInventoryLayout([layout[0]!, { ...layout[1]!, column: 2 }], 4, 2)).toThrow(
      /overlap/,
    );
    expect(() => assertInventoryLayout(layout, 3, 2)).toThrow(/exceeds/);
    expect(() => assertInventoryLayout(layout, 0, 2)).toThrow(/positive integer/);
  });
});
