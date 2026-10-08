import { FOCUSABLE_SELECTOR } from "../grid-list/grid-list-shared.js";
import { createRequiredContext } from "../internal/context.js";
import {
  type InventoryInteraction,
  type InventoryLayout,
  type InventoryLayoutEntry,
} from "./inventory-layout.js";
import { type InventoryKeyboard } from "./use-inventory-keyboard.js";
import { type useInventoryPointer } from "./use-inventory-pointer.js";

export type InventoryContextValue = {
  activeValue: string;
  columns: number;
  focusedValue: string;
  interaction: InventoryInteraction | "";
  layout: InventoryLayout;
  previewEntry: InventoryLayoutEntry | null;
  previewInvalid: boolean;
  rows: number;
  setFocusedValue: (value: string) => void;
  keyboard: InventoryKeyboard;
  pointer: ReturnType<typeof useInventoryPointer>;
};

export type InventoryItemContextValue = {
  label: string;
  value: string;
};

export const [InventoryContext, useInventoryContext, useOptionalInventoryContext] =
  createRequiredContext<InventoryContextValue>("Inventory");
export const [InventoryItemContext, useInventoryItemContext, useOptionalInventoryItemContext] =
  createRequiredContext<InventoryItemContextValue>("InventoryItem");

export function inventoryItemFocusables(item: HTMLLIElement) {
  return [...item.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.matches(":disabled"),
  );
}
