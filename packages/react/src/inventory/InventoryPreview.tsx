import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useInventoryContext } from "./inventory-shared.js";

export type InventoryPreviewProps = ComponentProps<"li"> & AsProp;

export function InventoryPreview({ as, style, ...props }: InventoryPreviewProps) {
  const inventory = useInventoryContext("InventoryPreview");
  const entry = inventory.previewEntry;
  if (!entry) return null;

  const Part = partElement(as, "li");
  return (
    <Part
      data-slot="inventory-preview"
      {...props}
      aria-hidden="true"
      data-column={entry.column}
      data-column-span={entry.columnSpan}
      data-invalid-placement={dataAttr(inventory.previewInvalid)}
      data-row={entry.row}
      data-row-span={entry.rowSpan}
      style={{
        ...style,
        gridColumn: `${entry.column} / span ${entry.columnSpan}`,
        gridRow: `${entry.row} / span ${entry.rowSpan}`,
      }}
    />
  );
}
