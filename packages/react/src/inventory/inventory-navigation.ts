import { type InventoryLayout, type InventoryLayoutEntry } from "./inventory-layout.js";

export type InventoryDirection = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown";

export function isInventoryDirection(key: string): key is InventoryDirection {
  return key === "ArrowLeft" || key === "ArrowRight" || key === "ArrowUp" || key === "ArrowDown";
}

function axes(entry: InventoryLayoutEntry, vertical: boolean) {
  if (vertical) {
    return {
      center: entry.row + entry.rowSpan / 2,
      crossStart: entry.column,
      crossEnd: entry.column + entry.columnSpan,
    };
  }
  return {
    center: entry.column + entry.columnSpan / 2,
    crossStart: entry.row,
    crossEnd: entry.row + entry.rowSpan,
  };
}

/**
 * The item visually closest to `currentValue` in the arrow key's direction.
 * Cards that overlap the current card's cross axis win first, then the one
 * most centered on it, then the nearest along the movement axis, then layout order.
 */
export function findInventoryNeighbor(
  layout: InventoryLayout,
  currentValue: string,
  direction: InventoryDirection,
  available: (value: string) => boolean = () => true,
) {
  const current = layout.find((entry) => entry.value === currentValue);
  if (!current) return undefined;
  const vertical = direction === "ArrowUp" || direction === "ArrowDown";
  const forward = direction === "ArrowRight" || direction === "ArrowDown";
  const from = axes(current, vertical);
  const candidates = layout.flatMap((entry, index) => {
    if (entry.value === current.value || !available(entry.value)) return [];
    const to = axes(entry, vertical);
    if (forward && to.center <= from.center) return [];
    if (!forward && to.center >= from.center) return [];
    return [
      {
        index,
        value: entry.value,
        crossGap: Math.max(from.crossStart - to.crossEnd, to.crossStart - from.crossEnd, 0),
        crossDistance: Math.abs(
          (to.crossStart + to.crossEnd) / 2 - (from.crossStart + from.crossEnd) / 2,
        ),
        primaryDistance: Math.abs(to.center - from.center),
      },
    ];
  });
  candidates.sort(
    (first, second) =>
      first.crossGap - second.crossGap ||
      first.crossDistance - second.crossDistance ||
      first.primaryDistance - second.primaryDistance ||
      first.index - second.index,
  );
  return candidates[0]?.value;
}

/**
 * Where Tab goes inside a focused card: through its controls in order, then
 * out of the inventory. Returns the element to focus, "card" to focus the card
 * itself, or undefined to let the browser leave the card.
 */
export function inventoryTabTarget<T>(focusables: readonly T[], current: T, backward: boolean) {
  const index = focusables.indexOf(current);
  if (backward) return focusables[index - 1] ?? "card";
  return focusables[index + 1];
}
