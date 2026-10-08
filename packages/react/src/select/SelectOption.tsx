import {
  useId,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { resolveItemLabel } from "../internal/item-label.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useSelectContext } from "./select-shared.js";

export type SelectOptionProps = ComponentProps<"div"> &
  AsProp & {
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for display and typeahead. */
    textValue?: string | undefined;
  };

export function SelectOption({
  as,
  value,
  id: idProp,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  ref,
  ...props
}: SelectOptionProps) {
  const select = useSelectContext("SelectOption");
  const { collection, popover } = select;
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `${select.listBoxId}-option-${generatedId}`;
  const ariaLabel = props["aria-label"];
  const resolvedDisabled = Boolean(disabled || select.disabled);
  const element = useRef<HTMLDivElement | null>(null);
  // Register with the rendered element's text (or the textValue override) so
  // options with markup children still display and typeahead by their text.
  // Runs every render; the collection ignores unchanged registrations.
  useLayoutEffect(() => {
    collection.register({
      key: value,
      id,
      textValue: resolveItemLabel({
        textValue,
        children,
        element: element.current,
        ariaLabel,
        fallback: value,
      }),
      disabled: resolvedDisabled,
      element: element.current,
    });
  });
  useLayoutEffect(() => {
    return () => {
      collection.unregister(value);
    };
  }, [collection, value]);
  const composedRef = useComposedRefs(element, ref);
  const selected = select.selectedKey === value;
  const choose = () => {
    select.setSelectedKey(value);
    popover.requestClose();
  };

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={id}
      role="option"
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-selected={dataAttr(selected)}
      data-value={value}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) choose();
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        choose();
      }}
    >
      {children}
    </Part>
  );
}
