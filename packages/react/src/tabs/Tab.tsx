import { type ComponentProps } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { useCollectedItem } from "../internal/collection-pass.js";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useIsTabStop } from "../internal/tab-stop.js";
import { tabPairIds, useTabsContext } from "./tabs-shared.js";

function TabPart({ as, value, disabled, onClick, ref, ...props }: TabProps) {
  const tabs = useTabsContext("Tab");
  const resolvedDisabled = Boolean(disabled);
  const isNativeButton = as === undefined || as === "button";
  const selected = tabs.selectedKey === value;
  const { tabId, panelId } = tabPairIds(tabs.baseId, value);
  // Read the stable registry outside the ref callback: depending on the whole context would
  // re-register every tab whenever the stop moves, and each registration notifies the store.
  const { collection } = tabs;
  const isTabStop = useIsTabStop(tabs.tabStops, value, tabs.selection);
  const tabRef = useComposedRefs(ref, (element: HTMLButtonElement | null) => {
    if (!element) return;
    collection.register({
      key: value,
      id: tabId,
      textValue: element.textContent?.trim() || value,
      disabled: resolvedDisabled,
      element,
    });
    // Guarded by element: when React reuses this element for another value, the stale cleanup
    // must not remove the registration a sibling just made under this key.
    return () => {
      collection.unregister(value, element);
    };
  });
  const disabledAttributes = disabledProps<HTMLButtonElement>(resolvedDisabled, {
    native: isNativeButton,
    onClick(event) {
      onClick?.(event);
      if (!event.defaultPrevented) tabs.setSelectedKey(value);
    },
    onKeyDown: props.onKeyDown,
  });

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={tabRef}
      id={tabId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      role="tab"
      tabIndex={isTabStop && !resolvedDisabled ? 0 : -1}
      aria-selected={selected}
      aria-controls={panelId}
      data-selected={dataAttr(selected)}
      {...disabledAttributes}
    />
  );
}

export type TabProps = Omit<ComponentProps<"button">, "id" | "value"> &
  AsProp & {
    /** Identity that pairs this tab with its panel through the root's value. */
    value: string;
  };

export function Tab(props: TabProps) {
  // Inside TabList's collection pass the tab only records itself, so the real tabs know the
  // whole collection before they render.
  const collected = useCollectedItem(props.value, props.disabled);
  if (collected) return null;
  return <TabPart {...props} />;
}
