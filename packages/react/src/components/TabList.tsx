import { type RefProp } from "../shared.js";
import { useContext } from "react";
import { getRovingFocusTarget } from "@comp0/core";
import { TabsContext } from "./disclosure-shared.js";
import { type TabListProps } from "./disclosure-shared.js";
export type { TabListProps } from "./disclosure-shared.js";
export function TabList({
  orientation = "horizontal",
  onKeyDown,
  ref,
  ...props
}: TabListProps & RefProp<HTMLDivElement>) {
  const tabs = useContext(TabsContext);

  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !tabs) return;
        const targetKey = getRovingFocusTarget(tabs.tabs(), tabs.selectedKey, event.key, {
          orientation,
          loop: true,
        });
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
