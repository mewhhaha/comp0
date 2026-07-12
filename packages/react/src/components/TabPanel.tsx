import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { TabsContext, tabPairIds } from "./disclosure-shared.js";
import { type TabPanelProps } from "./disclosure-shared.js";
export type { TabPanelProps } from "./disclosure-shared.js";
export function TabPanel({ tab, id, ref, ...props }: TabPanelProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);
  const selected = tabs?.selectedKey === tab;
  const { tabId, panelId } = tabPairIds(tabs, tab);

  return (
    <div
      {...props}
      ref={ref}
      id={id ?? panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!selected}
      data-selected={dataAttr(selected)}
    />
  );
}
