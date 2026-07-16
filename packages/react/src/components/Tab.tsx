import { type RefProp } from "../shared.js";
import { useCallback, useContext } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { TabsContext, tabPairIds } from "./disclosure-shared.js";
import { type TabProps } from "./disclosure-shared.js";
export type { TabProps } from "./disclosure-shared.js";
export function Tab({
  value,
  disabled,
  onClick,
  ref,
  ...props
}: TabProps & RefProp<HTMLButtonElement>) {
  const tabs = useContext(TabsContext);
  const resolvedDisabled = Boolean(disabled);
  const selected = tabs?.selectedKey === value;
  const { tabId, panelId } = tabPairIds(tabs, value);
  const registerTab = tabs?.registerTab;
  // React detaches and reattaches callback refs when their identity changes;
  // keep this registration ref stable across unrelated renders.
  const tabRef = useCallback(
    (element: HTMLButtonElement | null) => {
      registerTab?.(value, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [ref, registerTab, resolvedDisabled, value],
  );

  return (
    <button
      {...props}
      ref={tabRef}
      id={tabId}
      type="button"
      role="tab"
      tabIndex={selected && !resolvedDisabled ? 0 : -1}
      aria-selected={selected}
      aria-controls={panelId}
      disabled={resolvedDisabled}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) tabs?.setSelectedKey(value);
      }}
    />
  );
}
