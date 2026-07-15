import { createContext, useContext, type KeyboardEvent, type PointerEvent } from "react";

export type InventoryLayoutEntry = {
  value: string;
  column: number;
  row: number;
  columnSpan: number;
  rowSpan: number;
};

export type InventoryLayout = InventoryLayoutEntry[];

export type InventoryInteraction = "move" | "resize";

export type InventoryContextValue = {
  activeValue: string;
  columns: number;
  interaction: InventoryInteraction | "";
  layout: InventoryLayout;
  previewEntry: InventoryLayoutEntry | null;
  previewInvalid: boolean;
  rows: number;
  cancelPointerInteraction: (event: PointerEvent<HTMLButtonElement>) => void;
  continuePointerInteraction: (event: PointerEvent<HTMLButtonElement>) => void;
  finishPointerInteraction: (event: PointerEvent<HTMLButtonElement>) => void;
  handleKeyboardInteraction: (
    event: KeyboardEvent<HTMLButtonElement>,
    value: string,
    label: string,
    interaction: InventoryInteraction,
  ) => void;
  startPointerInteraction: (
    event: PointerEvent<HTMLButtonElement>,
    value: string,
    label: string,
    interaction: InventoryInteraction,
  ) => void;
};

export type InventoryItemContextValue = {
  label: string;
  value: string;
};

export const InventoryContext = createContext<InventoryContextValue | null>(null);
export const InventoryItemContext = createContext<InventoryItemContextValue | null>(null);

export function useInventoryContext(part: string) {
  const context = useContext(InventoryContext);
  if (!context) throw new Error(`${part} must be rendered inside Inventory.`);
  return context;
}

export function useInventoryItemContext(part: string) {
  const context = useContext(InventoryItemContext);
  if (!context) throw new Error(`${part} must be rendered inside InventoryItem.`);
  return context;
}

function overlaps(first: InventoryLayoutEntry, second: InventoryLayoutEntry) {
  return (
    first.column < second.column + second.columnSpan &&
    first.column + first.columnSpan > second.column &&
    first.row < second.row + second.rowSpan &&
    first.row + first.rowSpan > second.row
  );
}

function fits(entry: InventoryLayoutEntry, columns: number, rows: number) {
  return (
    entry.column >= 1 &&
    entry.row >= 1 &&
    entry.column + entry.columnSpan - 1 <= columns &&
    entry.row + entry.rowSpan - 1 <= rows
  );
}

function firstAvailablePosition(
  entry: InventoryLayoutEntry,
  occupied: InventoryLayoutEntry[],
  columns: number,
  rows: number,
) {
  const firstIndex = (entry.row - 1) * columns + entry.column - 1;
  for (let index = firstIndex; index < columns * rows; index += 1) {
    const candidate = {
      ...entry,
      column: (index % columns) + 1,
      row: Math.floor(index / columns) + 1,
    };
    if (!fits(candidate, columns, rows)) continue;
    if (!occupied.some((placed) => overlaps(candidate, placed))) return candidate;
  }
  return undefined;
}

export function resolveInventoryLayout(
  layout: InventoryLayout,
  value: string,
  proposed: InventoryLayoutEntry,
  columns: number,
  rows: number,
) {
  if (!fits(proposed, columns, rows)) return undefined;
  const resolved = new Map<string, InventoryLayoutEntry>([[value, proposed]]);
  const occupied = [proposed];
  const remaining = layout
    .filter((entry) => entry.value !== value)
    .sort((first, second) => first.row - second.row || first.column - second.column);

  for (const entry of remaining) {
    let next = entry;
    if (occupied.some((placed) => overlaps(next, placed))) {
      const available = firstAvailablePosition(entry, occupied, columns, rows);
      if (!available) return undefined;
      next = available;
    }
    occupied.push(next);
    resolved.set(next.value, next);
  }

  return layout.map((entry) => resolved.get(entry.value) ?? entry);
}

export function assertInventoryLayout(layout: InventoryLayout, columns: number, rows: number) {
  if (!Number.isInteger(columns) || columns < 1) {
    throw new Error(`Inventory columns must be a positive integer; received ${columns}.`);
  }
  if (!Number.isInteger(rows) || rows < 1) {
    throw new Error(`Inventory rows must be a positive integer; received ${rows}.`);
  }

  const seen = new Set<string>();
  for (const entry of layout) {
    if (seen.has(entry.value)) {
      throw new Error(`Inventory layout value "${entry.value}" appears more than once.`);
    }
    seen.add(entry.value);
    for (const [name, value] of [
      ["column", entry.column],
      ["row", entry.row],
      ["columnSpan", entry.columnSpan],
      ["rowSpan", entry.rowSpan],
    ] as const) {
      if (!Number.isInteger(value) || value < 1) {
        throw new Error(
          `Inventory layout value "${entry.value}" has ${name} ${value}; expected a positive integer.`,
        );
      }
    }
    if (!fits(entry, columns, rows)) {
      throw new Error(
        `Inventory layout value "${entry.value}" at column ${entry.column}, row ${entry.row} with span ${entry.columnSpan}×${entry.rowSpan} exceeds the ${columns}×${rows} inventory.`,
      );
    }
  }

  for (let index = 0; index < layout.length; index += 1) {
    const first = layout[index]!;
    for (let otherIndex = index + 1; otherIndex < layout.length; otherIndex += 1) {
      const second = layout[otherIndex]!;
      if (overlaps(first, second)) {
        throw new Error(`Inventory layout values "${first.value}" and "${second.value}" overlap.`);
      }
    }
  }
}
