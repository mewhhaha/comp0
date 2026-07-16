import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { TabsContext, tabPairIds } from "./disclosure-shared.js";
import { type TabPanelProps } from "./disclosure-shared.js";
export type { TabPanelProps } from "./disclosure-shared.js";
export function TabPanel({ value, ref, ...props }: TabPanelProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);
  const selected = tabs?.selectedKey === value;
  const { tabId, panelId } = tabPairIds(tabs, value);

  return (
    <div
      {...props}
      ref={ref}
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
