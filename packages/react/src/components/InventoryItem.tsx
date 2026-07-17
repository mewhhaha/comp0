import { useLayoutEffect, useRef, type LiHTMLAttributes } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  inventoryItemFocusables,
  InventoryItemContext,
  useInventoryContext,
} from "./inventory-shared.js";

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- InventoryItem keeps native list semantics while one item acts as the composite's roving keyboard entry point. */

export type InventoryItemProps = LiHTMLAttributes<HTMLLIElement> & {
  value: string;
  /** Accessible fallback used by the move and resize handles. */
  textValue?: string | undefined;
};

export function InventoryItem({
  value,
  textValue,
  onFocusCapture,
  onPointerDownCapture,
  style,
  ref,
  ...props
}: InventoryItemProps & RefProp<HTMLLIElement>) {
  const inventory = useInventoryContext("InventoryItem");
  const itemRef = useRef<HTMLLIElement | null>(null);
  const composedRef = useComposedRefs(itemRef, ref);
  const entry = inventory.layout.find((candidate) => candidate.value === value);
  if (!entry) throw new Error(`InventoryItem value "${value}" is missing from Inventory layout.`);
  const label = textValue ?? value;
  const dragging = inventory.activeValue === value && inventory.interaction === "move";
  const resizing = inventory.activeValue === value && inventory.interaction === "resize";
  const focused = inventory.focusedValue === value;

  useLayoutEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    for (const element of inventoryItemFocusables(item)) element.tabIndex = -1;
  });

  return (
    <InventoryItemContext value={{ label, value }}>
      <li
        {...props}
        ref={composedRef}
        tabIndex={focused ? 0 : -1}
        aria-keyshortcuts={props["aria-keyshortcuts"] ?? "ArrowLeft ArrowRight ArrowUp ArrowDown"}
        data-column={entry.column}
        data-column-span={entry.columnSpan}
        data-dragging={dataAttr(dragging)}
        data-resizing={dataAttr(resizing)}
        data-row={entry.row}
        data-row-span={entry.rowSpan}
        data-slot={dataSlot(props, "inventory-item")}
        data-value={value}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented) inventory.setFocusedValue(value);
        }}
        onPointerDownCapture={(event) => {
          onPointerDownCapture?.(event);
          if (!event.defaultPrevented) inventory.setFocusedValue(value);
        }}
        style={{
          ...style,
          gridColumn: `${entry.column} / span ${entry.columnSpan}`,
          gridRow: `${entry.row} / span ${entry.rowSpan}`,
        }}
      />
    </InventoryItemContext>
  );
}
