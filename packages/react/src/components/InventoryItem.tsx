import { type LiHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { InventoryItemContext, useInventoryContext } from "./inventory-shared.js";

export type InventoryItemProps = LiHTMLAttributes<HTMLLIElement> & {
  value: string;
  /** Accessible fallback used by the move and resize handles. */
  textValue?: string | undefined;
};

export function InventoryItem({
  value,
  textValue,
  style,
  ref,
  ...props
}: InventoryItemProps & RefProp<HTMLLIElement>) {
  const inventory = useInventoryContext("InventoryItem");
  const entry = inventory.layout.find((candidate) => candidate.value === value);
  if (!entry) throw new Error(`InventoryItem value "${value}" is missing from Inventory layout.`);
  const label = textValue ?? value;
  const dragging = inventory.activeValue === value && inventory.interaction === "move";
  const resizing = inventory.activeValue === value && inventory.interaction === "resize";
  const invalidPlacement = inventory.invalidValue === value;

  return (
    <InventoryItemContext value={{ label, value }}>
      <li
        {...props}
        ref={ref}
        data-column={entry.column}
        data-column-span={entry.columnSpan}
        data-dragging={dataAttr(dragging)}
        data-invalid-placement={dataAttr(invalidPlacement)}
        data-resizing={dataAttr(resizing)}
        data-row={entry.row}
        data-row-span={entry.rowSpan}
        data-slot={dataSlot(props, "inventory-item")}
        data-value={value}
        style={{
          ...style,
          gridColumn: `${entry.column} / span ${entry.columnSpan}`,
          gridRow: `${entry.row} / span ${entry.rowSpan}`,
        }}
      />
    </InventoryItemContext>
  );
}
