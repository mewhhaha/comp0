import { useRef, type PointerEvent, type RefObject } from "react";
import {
  hasSamePlacement,
  inventoryAnnouncement,
  inventoryPointerDelta,
  inventoryTrackSteps,
  proposeInventoryChange,
  stepInventoryEntry,
  type InventoryInteraction,
  type InventoryLayout,
  type InventoryLayoutEntry,
} from "./inventory-layout.js";
import { type InventoryGestureOptions, type InventoryKeyboard } from "./use-inventory-keyboard.js";

type PointerTransaction = {
  pointerId: number;
  value: string;
  label: string;
  interaction: InventoryInteraction;
  startX: number;
  startY: number;
  columnStep: number;
  rowStep: number;
  /** The item's entry when the gesture began. */
  entry: InventoryLayoutEntry;
  /** The layout when the gesture began; cancelling restores it. */
  layout: InventoryLayout;
  latestEntry: InventoryLayoutEntry;
  previewInvalid: boolean;
};

function numberStyle(element: HTMLElement, property: string) {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) ? value : 0;
}

function measureTrackSteps(root: HTMLElement, columns: number, rows: number) {
  return inventoryTrackSteps(
    {
      width:
        root.clientWidth - numberStyle(root, "padding-left") - numberStyle(root, "padding-right"),
      height:
        root.clientHeight - numberStyle(root, "padding-top") - numberStyle(root, "padding-bottom"),
      columnGap: numberStyle(root, "column-gap"),
      rowGap: numberStyle(root, "row-gap"),
    },
    columns,
    rows,
  );
}

/**
 * The pointer move/resize state machine: a handle captures the pointer, the
 * displacement is converted to whole grid steps against the measured tracks,
 * and release commits or cancels back to the layout the gesture began with.
 */
export function useInventoryPointer(
  options: InventoryGestureOptions & {
    rootRef: RefObject<HTMLElement | null>;
    keyboard: InventoryKeyboard;
  },
) {
  const { layout, setLayout, columns, rows, canChange, session, rootRef, keyboard } = options;
  const transaction = useRef<PointerTransaction | null>(null);

  const start = (
    event: PointerEvent<HTMLButtonElement>,
    value: string,
    label: string,
    kind: InventoryInteraction,
  ) => {
    const root = rootRef.current;
    const startingLayout = keyboard.pendingLayout() ?? layout;
    const entry = startingLayout.find((candidate) => candidate.value === value);
    if (!root || !entry) return;
    const steps = measureTrackSteps(root, columns, rows);
    if (!steps) return;
    event.preventDefault();
    if (keyboard.pendingLayout()) setLayout(startingLayout);
    keyboard.release();
    transaction.current = {
      pointerId: event.pointerId,
      value,
      label,
      interaction: kind,
      startX: event.clientX,
      startY: event.clientY,
      ...steps,
      entry,
      layout: startingLayout,
      latestEntry: entry,
      previewInvalid: false,
    };
    session.begin(value, kind, entry);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = transaction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const delta = inventoryPointerDelta(
      { x: event.clientX - current.startX, y: event.clientY - current.startY },
      current,
    );
    const update = proposeInventoryChange({
      layout: current.layout,
      value: current.value,
      interaction: current.interaction,
      columns,
      rows,
      canChange,
      change: () => stepInventoryEntry(current.entry, current.interaction, delta.column, delta.row),
    });
    if (!update) return;
    current.previewInvalid = update.status === "invalid";
    session.preview(update.entry, current.previewInvalid);
    if (update.status === "changed" && update.layout) {
      setLayout(update.layout);
      current.latestEntry = update.entry;
    }
    if (update.status === "unchanged" && !hasSamePlacement(current.latestEntry, update.entry)) {
      setLayout(current.layout);
      current.latestEntry = update.entry;
    }
  };

  const clear = (event: PointerEvent<HTMLButtonElement>) => {
    transaction.current = null;
    session.end();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    const current = transaction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    clear(event);
    if (current.previewInvalid) {
      session.announce(inventoryAnnouncement("invalid", current.interaction, current.label));
    } else {
      session.announce(
        inventoryAnnouncement("result", current.interaction, current.label, current.latestEntry),
      );
    }
  };

  const cancel = (event: PointerEvent<HTMLButtonElement>) => {
    const current = transaction.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setLayout(current.layout);
    clear(event);
    session.announce(inventoryAnnouncement("cancel", current.interaction, current.label));
  };

  return { start, move, finish, cancel };
}
