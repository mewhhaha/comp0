import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { TabsContext } from "./disclosure-shared.js";
import { type TabProps } from "./disclosure-shared.js";
export type { TabProps } from "./disclosure-shared.js";
export function Tab({
  tab,
  disabled,
  id,
  onClick,
  ref,
  ...props
}: TabProps & RefProp<HTMLButtonElement>) {
  const tabs = useContext(TabsContext);
  const resolvedDisabled = Boolean(disabled);
  const selected = tabs?.selectedKey === tab;
  const tabId = id ?? `tab-${tab}`;
  const panelId = `${tabId}-panel`;

  return (
    <button
      {...props}
      ref={(element) => {
        tabs?.registerTab(tab, element, resolvedDisabled);
        composeRefs(ref)(element);
      }}
      id={tabId}
      type="button"
      role="tab"
      tabIndex={selected ? 0 : -1}
      aria-selected={selected}
      aria-controls={panelId}
      disabled={resolvedDisabled}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) tabs?.setSelectedKey(tab);
      }}
    />
  );
}
