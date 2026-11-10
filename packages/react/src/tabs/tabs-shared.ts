import { type Collection } from "@comp0/core";
import { type CollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { type TabStopSelection, type TabStopStore } from "../internal/tab-stop.js";

export type TabsContextValue = {
  baseId: string;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  /** The document-order registry every Tab joins. */
  collection: Collection;
  /** What TabList's collection pass fills on the server and while hydrating. */
  seed: CollectionSeed;
  /** The one tab rendered with tabIndex 0; tabs read it with `useIsTabStop`. */
  tabStops: TabStopStore;
  /** The numbered selection the stop is resolved under. */
  selection: TabStopSelection;
  /** Records the tab holding focus inside the list, or "" once focus leaves it. */
  setFocusedKey: (key: string) => void;
};

export const [TabsContext, useTabsContext] = createRequiredContext<TabsContextValue>("Tabs");

export const tabPairIds = (baseId: string, tab: string) => ({
  tabId: `${baseId}-tab-${tab}`,
  panelId: `${baseId}-panel-${tab}`,
});
