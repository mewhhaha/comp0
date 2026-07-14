import { useContext, useId, useLayoutEffect, useRef, useState } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { InteractiveDiv, type RefProp } from "../shared.js";
import { MenuContext, resolveItemLabel } from "./collection-shared.js";
import { resolveAutocompleteItemText, useAutocompleteContext } from "./autocomplete-shared.js";
import { type MenuItemProps } from "./menu-shared.js";

export type { MenuItemProps } from "./menu-shared.js";

export function MenuItem({
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
}: MenuItemProps & RefProp<HTMLDivElement>) {
  const autocomplete = useAutocompleteContext();
  const menu = useContext(MenuContext);
  if (!menu) throw new Error("MenuItem must be rendered inside MenuList.");
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
    throw new Error(
      `MenuItem with value "${value}" requires textValue when Autocomplete filters child content that cannot be read before render.`,
    );
  }
  const visible = autocomplete?.isItemVisible(label) ?? true;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;
  const active = autocomplete?.activeId === id;
  const itemRef = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    menu?.register(value, label, element, resolvedDisabled);
    composeRefs(ref)(element);
  };

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const crawled = resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value });
    if (crawled !== label) setCrawledLabel(crawled);
    menu?.register(value, crawled, element, resolvedDisabled);
  });

  useLayoutEffect(() => {
    if (!setAutocompleteCollectionVersion || !visible) return;
    setAutocompleteCollectionVersion((version) => version + 1);
    return () => setAutocompleteCollectionVersion((version) => version + 1);
  }, [resolvedDisabled, setAutocompleteCollectionVersion, visible]);

  if (!visible) return null;

  return (
    <InteractiveDiv
      {...props}
      ref={itemRef}
      id={id}
      role={props.role ?? "menuitem"}
      tabIndex={resolvedDisabled ? undefined : -1}
      aria-disabled={resolvedDisabled || undefined}
      data-active={dataAttr(active)}
      data-autocomplete-item={autocomplete ? "" : undefined}
      data-value={value}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (autocomplete && !autocomplete.disableVirtualFocus) {
          autocomplete.setActiveId(id);
          return;
        }
        // Hover follows focus in menus, which also lets an open sibling
        // submenu notice it lost focus and close.
        menu?.setActiveKey(value);
        event.currentTarget.focus();
      }}
      data-disabled={dataAttr(resolvedDisabled)}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (
          !event.defaultPrevented &&
          autocomplete &&
          !autocomplete.disableVirtualFocus &&
          event.pointerType !== "touch"
        )
          event.preventDefault();
      }}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) menu?.close?.();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          resolvedDisabled ||
          (event.key !== "Enter" && event.key !== " ")
        )
          return;
        event.preventDefault();
        event.currentTarget.click();
      }}
    >
      {children}
    </InteractiveDiv>
  );
}
