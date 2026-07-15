import {
  useRef,
  useState,
  type KeyboardEvent,
  type OlHTMLAttributes,
  type PointerEvent,
} from "react";
import { dataAttr, useComposedRefs, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  assertInventoryLayout,
  InventoryContext,
  resolveInventoryLayout,
  type InventoryInteraction,
  type InventoryLayout,
  type InventoryLayoutEntry,
} from "./inventory-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

type PointerInteraction = {
  pointerId: number;
  value: string;
  label: string;
  interaction: InventoryInteraction;
  startX: number;
  startY: number;
  columnStep: number;
  rowStep: number;
  entry: InventoryLayoutEntry;
  layout: InventoryLayout;
  latestEntry: InventoryLayoutEntry;
};

export type InventoryProps = Omit<
  OlHTMLAttributes<HTMLOListElement>,
  "defaultValue" | "onChange"
> & {
  columns: number;
  rows: number;
  value?: InventoryLayout | undefined;
  defaultValue?: InventoryLayout | undefined;
  /** Receives the complete next layout in grid units rather than a DOM ChangeEvent. */
  onChange?: ((value: InventoryLayout) => void) | undefined;
  /** Vetoes a complete proposed layout for the item being moved or resized. */
  canChange?: ((value: InventoryLayout, changedValue: string) => boolean) | undefined;
};

function numberStyle(element: HTMLElement, property: string) {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) ? value : 0;
}

export function Inventory({
  columns,
  rows,
  value,
  defaultValue,
  onChange,
  canChange,
  children,
  style,
  ref,
  ...props
}: InventoryProps & RefProp<HTMLOListElement>) {
  const [layout, setLayout] = useControllableState<InventoryLayout>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  assertInventoryLayout(layout, columns, rows);
  const rootRef = useRef<HTMLOListElement | null>(null);
  const composedRef = useComposedRefs(rootRef, ref);
  const pointerInteraction = useRef<PointerInteraction | null>(null);
  const [interaction, setInteraction] = useState<InventoryInteraction | "">("");
  const [activeValue, setActiveValue] = useState("");
  const [invalidValue, setInvalidValue] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const announce = (entry: InventoryLayoutEntry, label: string, kind: InventoryInteraction) => {
    if (kind === "move") {
      setAnnouncement(`${label} moved to column ${entry.column}, row ${entry.row}.`);
      return;
    }
    setAnnouncement(`${label} resized to ${entry.columnSpan} columns by ${entry.rowSpan} rows.`);
  };

  const updateEntry = (
    source: InventoryLayout,
    value: string,
    label: string,
    interaction: InventoryInteraction,
    change: (entry: InventoryLayoutEntry) => InventoryLayoutEntry,
  ) => {
    const current = source.find((entry) => entry.value === value);
    if (!current) return undefined;
    const proposed = change(current);
    let constrained = proposed;
    if (interaction === "move") {
      constrained = {
        ...proposed,
        column: Math.min(Math.max(1, proposed.column), columns - proposed.columnSpan + 1),
        row: Math.min(Math.max(1, proposed.row), rows - proposed.rowSpan + 1),
      };
    } else {
      constrained = {
        ...proposed,
        columnSpan: Math.min(Math.max(1, proposed.columnSpan), columns - proposed.column + 1),
        rowSpan: Math.min(Math.max(1, proposed.rowSpan), rows - proposed.row + 1),
      };
    }
    if (
      constrained.column === current.column &&
      constrained.row === current.row &&
      constrained.columnSpan === current.columnSpan &&
      constrained.rowSpan === current.rowSpan
    ) {
      setInvalidValue("");
      return undefined;
    }
    const resolved = resolveInventoryLayout(source, value, constrained, columns, rows);
    if (!resolved || (canChange && !canChange(resolved, value))) {
      setInvalidValue(value);
      setAnnouncement(`${label} cannot fit there.`);
      return undefined;
    }
    setInvalidValue("");
    setLayout(resolved);
    return resolved.find((entry) => entry.value === value);
  };

  const handleKeyboardInteraction = (
    event: KeyboardEvent<HTMLButtonElement>,
    itemValue: string,
    label: string,
    kind: InventoryInteraction,
  ) => {
    let columnDelta = 0;
    let rowDelta = 0;
    if (event.key === "ArrowLeft") columnDelta = -1;
    else if (event.key === "ArrowRight") columnDelta = 1;
    else if (event.key === "ArrowUp") rowDelta = -1;
    else if (event.key === "ArrowDown") rowDelta = 1;
    else return;
    event.preventDefault();
    const next = updateEntry(layout, itemValue, label, kind, (entry) => {
      if (kind === "move") {
        return { ...entry, column: entry.column + columnDelta, row: entry.row + rowDelta };
      }
      return {
        ...entry,
        columnSpan: Math.max(1, entry.columnSpan + columnDelta),
        rowSpan: Math.max(1, entry.rowSpan + rowDelta),
      };
    });
    if (next) announce(next, label, kind);
  };

  const startPointerInteraction = (
    event: PointerEvent<HTMLButtonElement>,
    itemValue: string,
    label: string,
    kind: InventoryInteraction,
  ) => {
    const root = rootRef.current;
    const entry = layout.find((candidate) => candidate.value === itemValue);
    if (!root || !entry) return;
    const columnGap = numberStyle(root, "column-gap");
    const rowGap = numberStyle(root, "row-gap");
    const contentWidth =
      root.clientWidth - numberStyle(root, "padding-left") - numberStyle(root, "padding-right");
    const contentHeight =
      root.clientHeight - numberStyle(root, "padding-top") - numberStyle(root, "padding-bottom");
    const columnSize = (contentWidth - columnGap * (columns - 1)) / columns;
    const rowSize = (contentHeight - rowGap * (rows - 1)) / rows;
    if (columnSize <= 0 || rowSize <= 0) return;
    event.preventDefault();
    pointerInteraction.current = {
      pointerId: event.pointerId,
      value: itemValue,
      label,
      interaction: kind,
      startX: event.clientX,
      startY: event.clientY,
      columnStep: columnSize + columnGap,
      rowStep: rowSize + rowGap,
      entry,
      layout,
      latestEntry: entry,
    };
    setActiveValue(itemValue);
    setInteraction(kind);
    setInvalidValue("");
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continuePointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointerInteraction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const columnDelta = Math.round((event.clientX - current.startX) / current.columnStep);
    const rowDelta = Math.round((event.clientY - current.startY) / current.rowStep);
    const next = updateEntry(
      current.layout,
      current.value,
      current.label,
      current.interaction,
      (entry) => {
        if (current.interaction === "move") {
          return {
            ...entry,
            column: current.entry.column + columnDelta,
            row: current.entry.row + rowDelta,
          };
        }
        return {
          ...entry,
          columnSpan: current.entry.columnSpan + columnDelta,
          rowSpan: current.entry.rowSpan + rowDelta,
        };
      },
    );
    if (next) current.latestEntry = next;
  };

  const clearPointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    pointerInteraction.current = null;
    setInteraction("");
    setActiveValue("");
    setInvalidValue("");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const finishPointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointerInteraction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    clearPointerInteraction(event);
    announce(current.latestEntry, current.label, current.interaction);
  };

  const cancelPointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointerInteraction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setLayout(current.layout);
    clearPointerInteraction(event);
    setAnnouncement(`${current.label} change cancelled.`);
  };

  const context = {
    activeValue,
    columns,
    interaction,
    invalidValue,
    layout,
    rows,
    cancelPointerInteraction,
    continuePointerInteraction,
    finishPointerInteraction,
    handleKeyboardInteraction,
    startPointerInteraction,
  };

  return (
    <InventoryContext value={context}>
      <ol
        {...props}
        ref={composedRef}
        data-dragging={dataAttr(interaction === "move")}
        data-resizing={dataAttr(interaction === "resize")}
        data-slot={dataSlot(props, "inventory")}
        style={{
          ...style,
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {children}
      </ol>
      <output style={visuallyHiddenStyle} aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
    </InventoryContext>
  );
}

export type { InventoryLayout, InventoryLayoutEntry } from "./inventory-shared.js";
