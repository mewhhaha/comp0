import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type TabsContextValue = {
  baseId: string;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  /** The document-order registry every Tab joins. */
  collection: Collection;
  /** The one tab rendered with tabIndex 0. */
  tabStopKey: string;
  /** Records the tab holding focus inside the list, or "" once focus leaves it. */
  setFocusedKey: (key: string) => void;
};

export const [TabsContext, useTabsContext] = createRequiredContext<TabsContextValue>("Tabs");

export const tabPairIds = (baseId: string, tab: string) => ({
  tabId: `${baseId}-tab-${tab}`,
  panelId: `${baseId}-panel-${tab}`,
});
