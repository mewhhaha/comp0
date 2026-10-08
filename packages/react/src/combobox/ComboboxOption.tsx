import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useComboboxContext } from "./combobox-shared.js";

export type ComboboxOptionProps = ComponentProps<"div"> &
  AsProp & {
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for filtering and typeahead. */
    textValue?: string | undefined;
  };

export function ComboboxOption({
  as,
  value,
  id: idProp,
  disabled,
  textValue,
  children,
  onClick,
  ref,
  ...props
}: ComboboxOptionProps) {
  const combo = useComboboxContext("ComboboxOption");
  const { activeKey, collection, isItemVisible, popover, setActiveKey, setSelectedKey } = combo;
  const element = useRef<HTMLDivElement | null>(null);
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `${combo.listBoxId}-option-${generatedId}`;
  // Filtering happens during render, before the element exists, so crawled
  // text is cached in state and survives the option being filtered out.
  const [crawled, setCrawled] = useState("");
  let label = textValue;
  if (label === undefined && typeof children === "string") label = children;
  if (label === undefined && crawled) label = crawled;
  if (label === undefined) label = props["aria-label"] ?? value;
  const resolvedDisabled = Boolean(disabled || combo.disabled);
  const visible = isItemVisible(label);
  useLayoutEffect(() => {
    const text = element.current?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (text && text !== crawled) setCrawled(text);
  });
  // Runs every render; the collection ignores unchanged registrations.
  useLayoutEffect(() => {
    if (!visible) {
      collection.unregister(value);
      return;
    }
    collection.register({
      key: value,
      id,
      textValue: label,
      disabled: resolvedDisabled,
      element: element.current,
    });
  });
  useLayoutEffect(() => {
    return () => {
      collection.unregister(value);
    };
  }, [collection, value]);
  useLayoutEffect(() => {
    if (!visible && activeKey === value) setActiveKey("");
  }, [activeKey, setActiveKey, value, visible]);
  const composedRef = useComposedRefs(element, ref);
  if (!visible) return null;
  const selected = combo.selectedKey === value;
  const active = activeKey === value;

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-active={dataAttr(active)}
      data-selected={dataAttr(selected)}
      data-value={value}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) {
          setSelectedKey(value);
          popover.requestClose();
        }
      }}
    >
      {children}
    </Part>
  );
}
