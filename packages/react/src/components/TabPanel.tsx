import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { TabsContext } from "./disclosure-shared.js";
import { type TabPanelProps } from "./disclosure-shared.js";
export type { TabPanelProps } from "./disclosure-shared.js";
export function TabPanel({ tab, id, ref, ...props }: TabPanelProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);
  const selected = tabs?.selectedKey === tab;
  const tabId = `tab-${tab}`;

  return (
    <div
      {...props}
      ref={ref}
      id={id ?? `${tabId}-panel`}
      role="tabpanel"
      aria-labelledby={tabId}
      hidden={!selected}
      data-selected={dataAttr(selected)}
    />
  );
}
