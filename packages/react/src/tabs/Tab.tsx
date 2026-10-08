import { type ComponentProps } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { tabPairIds, useTabsContext } from "./tabs-shared.js";

export type TabProps = Omit<ComponentProps<"button">, "id" | "value"> &
  AsProp & {
    /** Identity that pairs this tab with its panel through the root's value. */
    value: string;
  };

export function Tab({ as, value, disabled, onClick, ref, ...props }: TabProps) {
  const tabs = useTabsContext("Tab");
  const resolvedDisabled = Boolean(disabled);
  const isNativeButton = as === undefined || as === "button";
  const selected = tabs.selectedKey === value;
  const { tabId, panelId } = tabPairIds(tabs.baseId, value);
  const tabRef = useComposedRefs(ref, (element: HTMLButtonElement | null) => {
    tabs.collection.register({
      key: value,
      id: tabId,
      textValue: element?.textContent?.trim() || value,
      disabled: resolvedDisabled,
      element,
    });
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
      tabIndex={selected && !resolvedDisabled ? 0 : -1}
      aria-selected={selected}
      aria-controls={panelId}
      data-selected={dataAttr(selected)}
      {...disabledAttributes}
    />
  );
}
