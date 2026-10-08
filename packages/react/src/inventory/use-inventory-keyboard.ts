import { useRef, type KeyboardEvent } from "react";
import {
  hasSamePlacement,
  inventoryAnnouncement,
  inventoryKeyDelta,
  proposeInventoryChange,
  stepInventoryEntry,
  type InventoryInteraction,
  type InventoryLayout,
  type InventoryLayoutEntry,
} from "./inventory-layout.js";
import { type InventorySession } from "./use-inventory-session.js";

type KeyboardTransaction = {
  value: string;
  label: string;
  interaction: InventoryInteraction;
  /** The layout when the gesture began; cancelling restores it. */
  layout: InventoryLayout;
  latestEntry: InventoryLayoutEntry;
  previewInvalid: boolean;
};

export type InventoryGestureOptions = {
  layout: InventoryLayout;
  setLayout: (layout: InventoryLayout) => void;
  columns: number;
  rows: number;
  canChange?: ((layout: InventoryLayout, changedValue: string) => boolean) | undefined;
  session: InventorySession;
};

/**
 * The keyboard move/resize state machine: a handle begins a gesture, arrow
 * keys step the item in grid units (pushing neighbours forward), and the
 * handle commits it or restores the layout the gesture began with.
 */
export function useInventoryKeyboard({
  layout,
  setLayout,
  columns,
  rows,
  canChange,
  session,
}: InventoryGestureOptions) {
  const transaction = useRef<KeyboardTransaction | null>(null);

  const begin = (value: string, label: string, kind: InventoryInteraction) => {
    const current = transaction.current;
    const startingLayout = current?.layout ?? layout;
    const entry = startingLayout.find((candidate) => candidate.value === value);
    if (!entry) return;
    if (current) setLayout(startingLayout);
    transaction.current = {
      value,
      label,
      interaction: kind,
      layout: startingLayout,
      latestEntry: entry,
      previewInvalid: false,
    };
    session.begin(value, kind, entry);
    session.announce(inventoryAnnouncement("start", kind, label));
  };

  const handleKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    value: string,
    kind: InventoryInteraction,
  ) => {
    const active = transaction.current;
    if (!active || active.value !== value || active.interaction !== kind) return;
    const delta = inventoryKeyDelta(event.key);
    if (!delta) return;
    event.preventDefault();
    const update = proposeInventoryChange({
      layout: active.layout,
      value,
      interaction: kind,
      columns,
      rows,
      canChange,
      change: () => stepInventoryEntry(active.latestEntry, kind, delta.column, delta.row),
    });
    if (!update) return;
    active.previewInvalid = update.status === "invalid";
    session.preview(update.entry, active.previewInvalid);
    if (update.status === "changed" && update.layout) {
      setLayout(update.layout);
      active.latestEntry = update.entry;
      session.announce(inventoryAnnouncement("result", kind, active.label, update.entry));
    }
    if (update.status === "invalid") {
      session.announce(inventoryAnnouncement("invalid", kind, active.label));
    }
    if (update.status === "unchanged" && !hasSamePlacement(active.latestEntry, update.entry)) {
      setLayout(active.layout);
      active.latestEntry = update.entry;
    }
  };

  const commit = (value: string) => {
    const current = transaction.current;
    if (!current || current.value !== value) return;
    transaction.current = null;
    session.end();
    if (current.previewInvalid) {
      session.announce(inventoryAnnouncement("invalid", current.interaction, current.label));
    } else {
      session.announce(
        inventoryAnnouncement("result", current.interaction, current.label, current.latestEntry),
      );
    }
  };

  const cancel = (value: string) => {
    const current = transaction.current;
    if (!current || current.value !== value) return;
    setLayout(current.layout);
    transaction.current = null;
    session.end();
    session.announce(inventoryAnnouncement("cancel", current.interaction, current.label));
  };

  return {
    begin,
    handleKey,
    commit,
    cancel,
    /** The layout a pending gesture would restore, without ending it. */
    pendingLayout: () => transaction.current?.layout,
    /** Drops the pending gesture without announcing; a pointer gesture takes over. */
    release: () => {
      transaction.current = null;
    },
  };
}

export type InventoryKeyboard = ReturnType<typeof useInventoryKeyboard>;
