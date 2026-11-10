import { type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { rootEntryKey } from "../internal/tab-stop.js";
import { writingDirection } from "../internal/writing-direction.js";
import { useTabsContext } from "./tabs-shared.js";

export type TabListProps = ComponentProps<"div"> &
  AsProp & {
    orientation?: "horizontal" | "vertical" | undefined;
  };

export function TabList({
  as,
  orientation = "horizontal",
  onBlur,
  onFocus,
  onKeyDown,
  ref,
  ...props
}: TabListProps) {
  const tabs = useTabsContext("TabList");
  const { collection } = tabs;
  const navigate = useCollectionNavigation();

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={ref}
      role="tablist"
      tabIndex={props.tabIndex ?? tabs.rootTabIndex}
      aria-orientation={orientation}
      data-orientation={orientation}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        onFocus?.(event as FocusEvent<HTMLDivElement>);
        if (event.defaultPrevented) return;
        const focusedTab = collection
          .items()
          .find((tab) => tab.element?.contains(event.target as Node));
        if (focusedTab) tabs.setFocusedKey(focusedTab.key);
      }}
      onBlur={(event: FocusEvent<HTMLElement>) => {
        onBlur?.(event as FocusEvent<HTMLDivElement>);
        if (event.defaultPrevented) return;
        // Focus moving to another tab in the list keeps the stop on that tab; leaving the list
        // hands the stop back to the selected tab, so re-entry lands there.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        tabs.setFocusedKey("");
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event as KeyboardEvent<HTMLDivElement>);
        if (event.defaultPrevented) return;
        const items = collection.items();
        const focusedTab = items.find((tab) => tab.element?.contains(event.target as Node));
        const options = {
          orientation,
          dir: writingDirection(event.currentTarget),
          loop: true,
          typeahead: false,
        };
        if (event.target === event.currentTarget) {
          // Focus is on the list itself (focused before its tabs registered, or by a click
          // between tabs): enter at the stop without changing the selection.
          const entry = navigate(event.key, items, undefined, options);
          const entryKey = rootEntryKey(event.key, tabs.tabStopKey, entry);
          if (!entryKey) return;
          event.preventDefault();
          collection.get(entryKey)?.element?.focus();
          return;
        }
        const targetKey = navigate(event.key, items, focusedTab?.key ?? tabs.selectedKey, options);
        if (!targetKey) return;
        event.preventDefault();
        tabs.setSelectedKey(targetKey);
        collection.get(targetKey)?.element?.focus();
      }}
    />
  );
}
