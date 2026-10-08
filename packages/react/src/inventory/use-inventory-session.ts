import { useState } from "react";
import { type InventoryInteraction, type InventoryLayoutEntry } from "./inventory-layout.js";

/**
 * The visible state of the move or resize in progress: which item and kind,
 * the preview placement, and the live-region announcement. The gesture state
 * machines (keyboard, pointer) drive it through these setters.
 */
export function useInventorySession() {
  const [interaction, setInteraction] = useState<InventoryInteraction | "">("");
  const [activeValue, setActiveValue] = useState("");
  const [previewEntry, setPreviewEntry] = useState<InventoryLayoutEntry | null>(null);
  const [previewInvalid, setPreviewInvalid] = useState(false);
  const [announcement, announce] = useState("");

  const begin = (value: string, kind: InventoryInteraction, entry: InventoryLayoutEntry) => {
    setActiveValue(value);
    setInteraction(kind);
    setPreviewEntry(entry);
    setPreviewInvalid(false);
  };

  const preview = (entry: InventoryLayoutEntry, invalid: boolean) => {
    setPreviewEntry(entry);
    setPreviewInvalid(invalid);
  };

  const end = () => {
    setInteraction("");
    setActiveValue("");
    setPreviewEntry(null);
    setPreviewInvalid(false);
  };

  return {
    interaction,
    activeValue,
    previewEntry,
    previewInvalid,
    announcement,
    announce,
    begin,
    preview,
    end,
  };
}

export type InventorySession = ReturnType<typeof useInventorySession>;
