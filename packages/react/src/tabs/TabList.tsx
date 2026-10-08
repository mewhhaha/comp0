import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { useCollectionNavigation, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { writingDirection } from "../internal/writing-direction.js";
import { useTabsContext } from "./tabs-shared.js";

export type TabListProps = ComponentProps<"div"> &
  AsProp & {
    orientation?: "horizontal" | "vertical" | undefined;
  };

export function TabList({
  as,
  orientation = "horizontal",
  onFocus,
  onKeyDown,
  ref,
  ...props
}: TabListProps) {
  const tabs = useTabsContext("TabList");
  const { collection } = tabs;
  const navigate = useCollectionNavigation();
  const tabListRef = useRef<HTMLElement | null>(null);
  const listRef = useComposedRefs(ref, tabListRef);
  const hasEnabledSelectedTab = () => {
    const selected = collection.get(tabs.selectedKey);
    return Boolean(selected?.element && !selected.disabled);
  };
  useLayoutEffect(() => {
    const element = tabListRef.current;
    if (!element) return;
    if (hasEnabledSelectedTab()) element.removeAttribute("tabindex");
    else element.tabIndex = 0;
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      tabIndex={0}
      onFocus={(event: FocusEvent<HTMLElement>) => {
        onFocus?.(event as FocusEvent<HTMLDivElement>);
        if (event.defaultPrevented || hasEnabledSelectedTab()) return;
        if (event.target !== event.currentTarget) return;
        collection.enabledItems()[0]?.element?.focus();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        onKeyDown?.(event as KeyboardEvent<HTMLDivElement>);
        if (event.defaultPrevented) return;
        const items = collection.items();
        const focusedTab = items.find((tab) => tab.element?.contains(event.target as Node));
        const targetKey = navigate(event.key, items, focusedTab?.key ?? tabs.selectedKey, {
          orientation,
          dir: writingDirection(event.currentTarget),
          loop: true,
          typeahead: false,
        });
        if (!targetKey) return;
        event.preventDefault();
        tabs.setSelectedKey(targetKey);
        collection.get(targetKey)?.element?.focus();
      }}
    />
  );
}
