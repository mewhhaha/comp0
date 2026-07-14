import { type RefProp } from "../shared.js";
import { useContext, useLayoutEffect, useRef } from "react";
import { composeRefs, getRovingFocusTarget } from "@comp0/core";
import { TabsContext } from "./disclosure-shared.js";
import { type TabListProps } from "./disclosure-shared.js";
export type { TabListProps } from "./disclosure-shared.js";
export function TabList({
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  ref,
  ...props
}: TabListProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const element = tabListRef.current;
    if (!element || !tabs) return;
    if (tabs.hasEnabledTab(tabs.selectedKey)) element.removeAttribute("tabindex");
    else element.tabIndex = 0;
  });

  return (
    <div
      {...props}
      ref={composeRefs(ref, tabListRef)}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      tabIndex={tabs ? 0 : undefined}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented || !tabs || tabs.hasEnabledTab(tabs.selectedKey)) return;
        if (event.target !== event.currentTarget) return;
        tabs
          .tabs()
          .find((item) => item.element && !item.disabled)
          ?.element?.focus();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !tabs) return;
        const focusedTab = tabs
          .tabs()
          .find((tab) => tab.element && tab.element.contains(event.target as Node));
        const targetKey = getRovingFocusTarget(
          tabs.tabs(),
          focusedTab?.key ?? tabs.selectedKey,
          event.key,
          {
            orientation,
            loop: true,
          },
        );
        if (!targetKey) return;
        event.preventDefault();
        tabs.setSelectedKey(targetKey);
        tabs
          .tabs()
          .find((item) => item.key === targetKey)
          ?.element?.focus();
      }}
    />
  );
}
