import { vi } from "vitest";
import { setup } from "./render.js";
import { Inventory, type InventoryLayout } from "../src/inventory/Inventory.js";
import { InventoryItem } from "../src/inventory/InventoryItem.js";
import { InventoryMoveHandle } from "../src/inventory/InventoryMoveHandle.js";
import { InventoryPreview } from "../src/inventory/InventoryPreview.js";
import { InventoryResizeHandle } from "../src/inventory/InventoryResizeHandle.js";

export const initialLayout: InventoryLayout = [
  { value: "revenue", column: 1, row: 1, columnSpan: 3, rowSpan: 2 },
  { value: "conversion", column: 4, row: 1, columnSpan: 3, rowSpan: 1 },
  { value: "alerts", column: 6, row: 2, columnSpan: 1, rowSpan: 2 },
];

export function renderInventory(onChange = vi.fn()) {
  const result = setup(
    <Inventory
      aria-label="Store overview"
      columns={6}
      rows={6}
      defaultValue={initialLayout}
      onChange={onChange}
      style={{ width: 600, height: 480, gap: 8 }}
    >
      <InventoryItem value="revenue" textValue="Revenue">
        Revenue
        <InventoryMoveHandle />
        <InventoryResizeHandle />
      </InventoryItem>
      <InventoryItem value="conversion" textValue="Conversion">
        Conversion
        <InventoryMoveHandle />
      </InventoryItem>
      <InventoryItem value="alerts" textValue="Alerts">
        Alerts
        <InventoryResizeHandle />
      </InventoryItem>
      <InventoryPreview />
    </Inventory>,
  );
  return { ...result, onChange };
}

export function mockPointerGeometry(
  inventory: HTMLOListElement,
  control: HTMLButtonElement,
  size: { width: number; height: number },
) {
  Object.defineProperties(inventory, {
    clientWidth: { value: size.width },
    clientHeight: { value: size.height },
  });
  control.setPointerCapture = vi.fn();
  control.hasPointerCapture = vi.fn(() => false);
}
