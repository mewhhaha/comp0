import { type Collection, type CollectionItem } from "@comp0/core";
import { type CollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { type TabStopStore } from "../internal/tab-stop.js";

export type TagGroupContextValue = {
  selectionEnabled: boolean;
  selected: string[];
  toggle: (value: string) => void;
  remove: ((value: string) => void) | undefined;
  /** Every mounted tag in document order; shared so controls outside the list (TagPickerInput) can reach the tags. */
  collection: Collection;
};

export type TagListContextValue = {
  /** What the collection pass and the tags fill on the server and while hydrating. */
  seed: CollectionSeed;
  /** The one tag rendered with tabIndex 0; tags read it with `useIsTabStop`. */
  tabStops: TabStopStore;
  /** Records the tag that holds focus or was chosen, so the stop stays on it. */
  setFocusedKey: (key: string) => void;
  /** Registers or updates one tag; registering an unchanged tag is a no-op. */
  register: (item: CollectionItem) => void;
  /** Removes a tag, but only while `element` is still the registered one. */
  unregister: (key: string, element: HTMLElement) => void;
};

export const [TagGroupContext, useTagGroupContext, useOptionalTagGroupContext] =
  createRequiredContext<TagGroupContextValue>("TagGroup");
export const [TagListContext, useTagListContext] =
  createRequiredContext<TagListContextValue>("TagList");
