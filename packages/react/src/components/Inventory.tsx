import {
  useLayoutEffect,
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
  inventoryItemFocusables,
  InventoryContext,
  resolveInventoryLayout,
  type InventoryInteraction,
  type InventoryLayout,
  type InventoryLayoutEntry,
} from "./inventory-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- The native list coordinates roving item focus and Tab entry without claiming ARIA grid semantics. */

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
  previewInvalid: boolean;
};

type KeyboardInteraction = Pick<
  PointerInteraction,
  "value" | "label" | "interaction" | "layout" | "latestEntry" | "previewInvalid"
>;

type InventoryUpdate = {
  entry: InventoryLayoutEntry;
  status: "changed" | "invalid" | "unchanged";
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

function hasSamePlacement(first: InventoryLayoutEntry, second: InventoryLayoutEntry) {
  return (
    first.column === second.column &&
    first.row === second.row &&
    first.columnSpan === second.columnSpan &&
    first.rowSpan === second.rowSpan
  );
}

export function Inventory({
  columns,
  rows,
  value,
  defaultValue,
  onChange,
  canChange,
  children,
  onKeyDown,
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
  const keyboardInteraction = useRef<KeyboardInteraction | null>(null);
  const pointerInteraction = useRef<PointerInteraction | null>(null);
  const [interaction, setInteraction] = useState<InventoryInteraction | "">("");
  const [activeValue, setActiveValue] = useState("");
  const [focusedValue, setFocusedValue] = useState(layout[0]?.value ?? "");
  const [previewEntry, setPreviewEntry] = useState<InventoryLayoutEntry | null>(null);
  const [previewInvalid, setPreviewInvalid] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useLayoutEffect(() => {
    if (layout.some((entry) => entry.value === focusedValue)) return;
    setFocusedValue(layout[0]?.value ?? "");
  }, [focusedValue, layout]);

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
    interaction: InventoryInteraction,
    change: (entry: InventoryLayoutEntry) => InventoryLayoutEntry,
  ): InventoryUpdate | undefined => {
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
      return { entry: constrained, status: "unchanged" };
    }
    const resolved = resolveInventoryLayout(source, value, constrained, columns, rows);
    if (!resolved || (canChange && !canChange(resolved, value))) {
      return { entry: constrained, status: "invalid" };
    }
    setLayout(resolved);
    const entry = resolved.find((entry) => entry.value === value);
    return entry ? { entry, status: "changed" } : undefined;
  };

  const handleKeyboardInteraction = (
    event: KeyboardEvent<HTMLButtonElement>,
    itemValue: string,
    label: string,
    kind: InventoryInteraction,
  ) => {
    const current = keyboardInteraction.current;
    if (event.key === "Escape" && current?.value === itemValue) {
      event.preventDefault();
      setLayout(current.layout);
      keyboardInteraction.current = null;
      setInteraction("");
      setActiveValue("");
      setPreviewEntry(null);
      setPreviewInvalid(false);
      setAnnouncement(`${current.label} change cancelled.`);
      return;
    }

    let columnDelta = 0;
    let rowDelta = 0;
    if (event.key === "ArrowLeft") columnDelta = -1;
    else if (event.key === "ArrowRight") columnDelta = 1;
    else if (event.key === "ArrowUp") rowDelta = -1;
    else if (event.key === "ArrowDown") rowDelta = 1;
    else return;
    event.preventDefault();
    if (!event.shiftKey) {
      const update = updateEntry(layout, itemValue, kind, (entry) => {
        if (kind === "move") {
          return { ...entry, column: entry.column + columnDelta, row: entry.row + rowDelta };
        }
        return {
          ...entry,
          columnSpan: Math.max(1, entry.columnSpan + columnDelta),
          rowSpan: Math.max(1, entry.rowSpan + rowDelta),
        };
      });
      if (update?.status === "changed") announce(update.entry, label, kind);
      if (update?.status === "invalid") setAnnouncement(`${label} cannot fit there.`);
      return;
    }

    let active = keyboardInteraction.current;
    if (!active) {
      const entry = layout.find((candidate) => candidate.value === itemValue);
      if (!entry) return;
      active = {
        value: itemValue,
        label,
        interaction: kind,
        layout,
        latestEntry: entry,
        previewInvalid: false,
      };
      keyboardInteraction.current = active;
      setActiveValue(itemValue);
      setInteraction(kind);
      setPreviewEntry(entry);
      setPreviewInvalid(false);
    }
    const update = updateEntry(active.layout, itemValue, kind, () => {
      if (kind === "move") {
        return {
          ...active.latestEntry,
          column: active.latestEntry.column + columnDelta,
          row: active.latestEntry.row + rowDelta,
        };
      }
      return {
        ...active.latestEntry,
        columnSpan: active.latestEntry.columnSpan + columnDelta,
        rowSpan: active.latestEntry.rowSpan + rowDelta,
      };
    });
    if (!update) return;
    active.previewInvalid = update.status === "invalid";
    setPreviewEntry(update.entry);
    setPreviewInvalid(active.previewInvalid);
    if (update.status === "changed") active.latestEntry = update.entry;
    if (update.status === "unchanged" && !hasSamePlacement(active.latestEntry, update.entry)) {
      setLayout(active.layout);
      active.latestEntry = update.entry;
    }
  };

  const finishKeyboardInteraction = (itemValue: string) => {
    const current = keyboardInteraction.current;
    if (!current || current.value !== itemValue) return;
    keyboardInteraction.current = null;
    setInteraction("");
    setActiveValue("");
    setPreviewEntry(null);
    setPreviewInvalid(false);
    if (current.previewInvalid) {
      setAnnouncement(`${current.label} cannot fit there.`);
    } else {
      announce(current.latestEntry, current.label, current.interaction);
    }
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
      previewInvalid: false,
    };
    setActiveValue(itemValue);
    setInteraction(kind);
    setPreviewEntry(entry);
    setPreviewInvalid(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continuePointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointerInteraction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const columnDelta = Math.round((event.clientX - current.startX) / current.columnStep);
    const rowDelta = Math.round((event.clientY - current.startY) / current.rowStep);
    const update = updateEntry(current.layout, current.value, current.interaction, (entry) => {
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
    });
    if (!update) return;
    current.previewInvalid = update.status === "invalid";
    setPreviewEntry(update.entry);
    setPreviewInvalid(current.previewInvalid);
    if (update.status === "changed") current.latestEntry = update.entry;
    if (update.status === "unchanged" && !hasSamePlacement(current.latestEntry, update.entry)) {
      setLayout(current.layout);
      current.latestEntry = update.entry;
    }
  };

  const clearPointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    pointerInteraction.current = null;
    setInteraction("");
    setActiveValue("");
    setPreviewEntry(null);
    setPreviewInvalid(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const finishPointerInteraction = (event: PointerEvent<HTMLButtonElement>) => {
    const current = pointerInteraction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    clearPointerInteraction(event);
    if (current.previewInvalid) {
      setAnnouncement(`${current.label} cannot fit there.`);
    } else {
      announce(current.latestEntry, current.label, current.interaction);
    }
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
    focusedValue,
    interaction,
    layout,
    previewEntry,
    previewInvalid,
    rows,
    setFocusedValue,
    cancelPointerInteraction,
    continuePointerInteraction,
    finishKeyboardInteraction,
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
        onKeyDown={(event) => {
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
            if (event.shiftKey) {
              if (target === item) return;
              event.preventDefault();
              const previous = focusables[focusables.indexOf(target) - 1];
              if (previous) previous.focus();
              else item.focus();
              return;
            }
            const next = focusables[focusables.indexOf(target) + 1];
            if (next) {
              event.preventDefault();
              next.focus();
            }
            return;
          }

          if (target !== item || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
          }
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
            return;
          }
          const current = layout.find((entry) => entry.value === item.dataset["value"]);
          if (!current) return;
          const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
          const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
          let currentPrimaryCenter = current.column + current.columnSpan / 2;
          let currentCrossStart = current.row;
          let currentCrossEnd = current.row + current.rowSpan;
          if (vertical) {
            currentPrimaryCenter = current.row + current.rowSpan / 2;
            currentCrossStart = current.column;
            currentCrossEnd = current.column + current.columnSpan;
          }
          const candidates = layout.flatMap((entry, index) => {
            if (entry.value === current.value) return [];
            const element = items.find((candidate) => candidate.dataset["value"] === entry.value);
            if (!element) return [];
            let primaryCenter = entry.column + entry.columnSpan / 2;
            let crossStart = entry.row;
            let crossEnd = entry.row + entry.rowSpan;
            if (vertical) {
              primaryCenter = entry.row + entry.rowSpan / 2;
              crossStart = entry.column;
              crossEnd = entry.column + entry.columnSpan;
            }
            if (forward && primaryCenter <= currentPrimaryCenter) return [];
            if (!forward && primaryCenter >= currentPrimaryCenter) return [];
            const crossGap = Math.max(
              currentCrossStart - crossEnd,
              crossStart - currentCrossEnd,
              0,
            );
            return [
              {
                crossGap,
                crossDistance: Math.abs(
                  (crossStart + crossEnd) / 2 - (currentCrossStart + currentCrossEnd) / 2,
                ),
                element,
                index,
                primaryDistance: Math.abs(primaryCenter - currentPrimaryCenter),
                value: entry.value,
              },
            ];
          });
          candidates.sort(
            (first, second) =>
              first.crossGap - second.crossGap ||
              first.crossDistance - second.crossDistance ||
              first.primaryDistance - second.primaryDistance ||
              first.index - second.index,
          );
          const next = candidates[0];
          if (!next) return;
          event.preventDefault();
          item.tabIndex = -1;
          next.element.tabIndex = 0;
          setFocusedValue(next.value);
          next.element.focus();
        }}
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
