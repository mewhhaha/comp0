import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
import { disabledProps } from "../internal/disabled.js";
import { resolveItemLabel } from "../internal/item-label.js";
import {
  resolveAutocompleteItemText,
  useAutocompleteContext,
} from "../autocomplete/autocomplete-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useMenuListContext } from "./menu-shared.js";

export type MenuItemProps = Omit<ComponentProps<"div">, "id"> &
  AsProp & {
    /** Identity within the menu; generated when omitted since items are commands. */
    value?: string | undefined;
    id?: string | undefined;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for typeahead. */
    textValue?: string | undefined;
  };

export function MenuItem({
  as,
  id: idProp,
  value: valueProp,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
  ref,
  ...props
}: MenuItemProps) {
  const autocomplete = useAutocompleteContext();
  const menu = useMenuListContext("MenuItem");
  const generatedId = useId().replace(/:/g, "");
  // The id prop is only ever the DOM id; the item key is value alone so the
  // two concepts cannot silently stand in for each other.
  const value = valueProp ?? generatedId;
  const id = idProp ?? `menu-item-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const ariaLabel = props["aria-label"];
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [crawledLabel, setCrawledLabel] = useState("");
  const renderedText = resolveAutocompleteItemText(children);
  let label = textValue;
  if (label === undefined && crawledLabel) label = crawledLabel;
  if (label === undefined && renderedText.text) label = renderedText.text;
  if (label === undefined) label = ariaLabel ?? value;
  if (
    autocomplete?.hasFilter &&
    autocomplete.inputValue &&
    textValue === undefined &&
    !crawledLabel &&
    !renderedText.text &&
    renderedText.hasElement &&
    !ariaLabel
  ) {
    warnOnce(
      `MenuItem:unreadable-text:${value}`,
      `MenuItem with value "${value}" requires textValue when Autocomplete filters child content that cannot be read before render. It is filtered by its aria-label or value instead.`,
    );
  }
  const visible = autocomplete?.isItemVisible(label) ?? true;
  const active = autocomplete?.activeId === id;
  const itemRef = useComposedRefs(ref, (element: HTMLDivElement | null) => {
    elementRef.current = element;
    menu.collection.register({
      key: value,
      id,
      textValue: label,
      element,
      disabled: resolvedDisabled,
    });
  });

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const crawled = resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value });
    if (crawled !== label) setCrawledLabel(crawled);
    menu.collection.register({
      key: value,
      id,
      textValue: crawled,
      element,
      disabled: resolvedDisabled,
    });
  });

  if (!visible) return null;

  const disabledAttributes = disabledProps<HTMLDivElement>(resolvedDisabled, {
    native: false,
    onClick(event) {
      onClick?.(event);
      if (!event.defaultPrevented) menu.close();
    },
    onKeyDown(event) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.currentTarget.click();
    },
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={itemRef}
      id={id}
      role={props.role ?? "menuitem"}
      tabIndex={resolvedDisabled ? undefined : -1}
      data-active={dataAttr(active)}
      data-value={value}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (autocomplete && !autocomplete.disableVirtualFocus) {
          autocomplete.setActiveId(id);
          return;
        }
        // Hover follows focus in menus, which also lets an open sibling
        // submenu notice it lost focus and close.
        event.currentTarget.focus();
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        if (
          !event.defaultPrevented &&
          autocomplete &&
          !autocomplete.disableVirtualFocus &&
          event.pointerType !== "touch"
        ) {
          event.preventDefault();
        }
      }}
      {...disabledAttributes}
    >
      {children}
    </Part>
  );
}
