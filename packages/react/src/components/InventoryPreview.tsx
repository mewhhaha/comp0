import { type LiHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useInventoryContext } from "./inventory-shared.js";

export type InventoryPreviewProps = LiHTMLAttributes<HTMLLIElement>;

export function InventoryPreview({
  style,
  ref,
  ...props
}: InventoryPreviewProps & RefProp<HTMLLIElement>) {
  const inventory = useInventoryContext("InventoryPreview");
  const entry = inventory.previewEntry;
  if (!entry) return null;

  return (
    <li
      {...props}
      ref={ref}
      aria-hidden="true"
      data-column={entry.column}
      data-column-span={entry.columnSpan}
      data-invalid-placement={dataAttr(inventory.previewInvalid)}
      data-row={entry.row}
      data-row-span={entry.rowSpan}
      data-slot={dataSlot(props, "inventory-preview")}
      style={{
        ...style,
        gridColumn: `${entry.column} / span ${entry.columnSpan}`,
        gridRow: `${entry.row} / span ${entry.rowSpan}`,
      }}
    />
  );
}
