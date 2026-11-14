import { type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { useCollectionNavigation } from "@comp0/core";
import { useCollectionPass } from "../internal/collection-pass.js";
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
  onBlur,
  onFocus,
  onKeyDown,
  children,
  ref,
  ...props
}: TabListProps) {
  const tabs = useTabsContext("TabList");
  const { collection } = tabs;
  const navigate = useCollectionNavigation();
  const pass = useCollectionPass(tabs.seed, children);

  const Part = partElement(as, "div");
  return (
    <>
      {pass}
      <Part
        {...props}
        ref={ref}
        role="tablist"
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
      >
        {children}
      </Part>
    </>
  );
}
