import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import { type TabStopSelection, type TabStopStore } from "../internal/tab-stop.js";

export type ListBoxContextValue = {
  /** The one option rendered with tabIndex 0; options read it with `useIsTabStop`. */
  tabStops: TabStopStore;
  /** The numbered selection the stop is resolved under. */
  selection: TabStopSelection;
  selectedKey: string;
  /** Records the option that holds focus or was chosen, so the stop stays on it. */
  setFocusedKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  /** The option registry; each option registers and unregisters itself on this stable object. */
  collection: Collection;
};

export const [ListBoxContext, useListBoxContext] =
  createRequiredContext<ListBoxContextValue>("ListBox");
