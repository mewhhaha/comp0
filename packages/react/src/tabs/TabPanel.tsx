import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { tabPairIds, useTabsContext } from "./tabs-shared.js";

export type TabPanelProps = Omit<ComponentProps<"div">, "id"> &
  AsProp & {
    /** Identity that pairs this panel with its tab through the root's value. */
    value: string;
  };

export function TabPanel({ as, value, ...props }: TabPanelProps) {
  const tabs = useTabsContext("TabPanel");
  const selected = tabs.selectedKey === value;
  const { tabId, panelId } = tabPairIds(tabs.baseId, value);

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      id={panelId}
      role="tabpanel"
      // In the tab sequence so keyboard users reach text-only panel content
      // after the tab list, per the APG tabs pattern.
      tabIndex={props.tabIndex ?? 0}
      aria-labelledby={tabId}
      hidden={!selected}
      data-selected={dataAttr(selected)}
    />
  );
}
