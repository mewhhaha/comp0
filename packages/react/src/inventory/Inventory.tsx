import { useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { dataAttr, useComposedRefs, useControllableState } from "@comp0/core";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { inventoryItemFocusables, InventoryContext } from "./inventory-shared.js";
import { sanitizeInventoryLayout, type InventoryLayout } from "./inventory-layout.js";
import {
  findInventoryNeighbor,
  inventoryTabTarget,
  isInventoryDirection,
} from "./inventory-navigation.js";
import { useInventoryKeyboard } from "./use-inventory-keyboard.js";
import { useInventoryPointer } from "./use-inventory-pointer.js";
import { useInventorySession } from "./use-inventory-session.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type InventoryProps = Omit<ComponentProps<"ol">, "defaultValue" | "onChange"> &
  AsProp & {
    columns: number;
    rows: number;
    value?: InventoryLayout | undefined;
    defaultValue?: InventoryLayout | undefined;
    /** Receives the complete next layout in grid units rather than a DOM ChangeEvent. */
    onChange?: ((value: InventoryLayout) => void) | undefined;
    /** Vetoes a complete proposed layout for the item being moved or resized. */
    canChange?: ((value: InventoryLayout, changedValue: string) => boolean) | undefined;
  };

export function Inventory({
  as,
  columns: columnsProp,
  rows: rowsProp,
  value,
  defaultValue,
  onChange,
  canChange,
  children,
  onKeyDown,
  style,
  ref,
  ...props
}: InventoryProps) {
  const warn = useWarnOnce();
  const [rawLayout, setLayout] = useControllableState<InventoryLayout>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  const { layout, columns, rows, problems } = sanitizeInventoryLayout(
    rawLayout,
    columnsProp,
    rowsProp,
  );
  for (const problem of problems) warn(problem.key, problem.message);
  const rootRef = useRef<HTMLOListElement | null>(null);
  const composedRef = useComposedRefs(rootRef, ref);
  const [focusedValue, setFocusedValue] = useState(layout[0]?.value ?? "");
  const session = useInventorySession();
  const gesture = { layout, setLayout, columns, rows, canChange, session };
  const keyboard = useInventoryKeyboard(gesture);
  const pointer = useInventoryPointer({ ...gesture, rootRef, keyboard });

  useLayoutEffect(() => {
    if (layout.some((entry) => entry.value === focusedValue)) return;
    setFocusedValue(layout[0]?.value ?? "");
  }, [focusedValue, layout]);

  const context = {
    activeValue: session.activeValue,
    columns,
    focusedValue,
    interaction: session.interaction,
    layout,
    previewEntry: session.previewEntry,
    previewInvalid: session.previewInvalid,
    rows,
    setFocusedValue,
    keyboard,
    pointer,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    const items = [...event.currentTarget.children].filter(
      (element): element is HTMLLIElement =>
        element instanceof HTMLLIElement && element.dataset["value"] !== undefined,
    );
    const item = items.find((candidate) => candidate.contains(target));
    if (!item) return;

    if (event.key === "Tab") {
      const focusables = inventoryItemFocusables(item);
      if (event.shiftKey && target === item) return;
      const destination = inventoryTabTarget(focusables, target, event.shiftKey);
      if (!destination) return;
      event.preventDefault();
      if (destination === "card") item.focus();
      else destination.focus();
      return;
    }

    if (target !== item || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (!isInventoryDirection(event.key)) return;
    const currentValue = item.dataset["value"];
    if (currentValue === undefined) return;
    const nextValue = findInventoryNeighbor(layout, currentValue, event.key);
    const next = items.find((candidate) => candidate.dataset["value"] === nextValue);
    if (!nextValue || !next) return;
    event.preventDefault();
    item.tabIndex = -1;
    next.tabIndex = 0;
    setFocusedValue(nextValue);
    next.focus();
  };

  const Part = partElement(as, "ol");
  return (
    <InventoryContext value={context}>
      <Part
        data-slot="inventory"
        {...props}
        ref={composedRef}
        data-dragging={dataAttr(session.interaction === "move")}
        data-resizing={dataAttr(session.interaction === "resize")}
        onKeyDown={handleKeyDown}
        style={{
          ...style,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </Part>
      <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        {session.announcement}
      </output>
    </InventoryContext>
  );
}

export type { InventoryLayout, InventoryLayoutEntry } from "./inventory-layout.js";
