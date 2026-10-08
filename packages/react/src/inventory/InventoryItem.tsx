import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  inventoryItemFocusables,
  InventoryItemContext,
  useInventoryContext,
} from "./inventory-shared.js";

export type InventoryItemProps = ComponentProps<"li"> &
  AsProp & {
    value: string;
    /** Accessible fallback used by the move and resize handles. */
    textValue?: string | undefined;
  };

export function InventoryItem({
  as,
  value,
  textValue,
  onFocusCapture,
  onPointerDownCapture,
  style,
  ref,
  ...props
}: InventoryItemProps) {
  const inventory = useInventoryContext("InventoryItem");
  const itemRef = useRef<HTMLLIElement | null>(null);
  const composedRef = useComposedRefs(itemRef, ref);
  const entry = inventory.layout.find((candidate) => candidate.value === value);
  const label = textValue ?? value;
  const dragging = inventory.activeValue === value && inventory.interaction === "move";
  const resizing = inventory.activeValue === value && inventory.interaction === "resize";
  const focused = inventory.focusedValue === value;

  useLayoutEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    for (const element of inventoryItemFocusables(item)) element.tabIndex = -1;
  });

  if (!entry) {
    warnOnce(
      `InventoryItem:missing:${value}`,
      `InventoryItem value "${value}" is missing from Inventory layout. It was skipped.`,
    );
    return null;
  }

  const Part = partElement(as, "li");
  return (
    <InventoryItemContext value={{ label, value }}>
      <Part
        data-slot="inventory-item"
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
        data-value={value}
        onFocusCapture={(event: FocusEvent<HTMLLIElement>) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented) inventory.setFocusedValue(value);
        }}
        onPointerDownCapture={(event: PointerEvent<HTMLLIElement>) => {
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
