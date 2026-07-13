import { useContext, useId, useLayoutEffect, useRef, useState } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ListBoxContext, resolveItemLabel } from "./collection-shared.js";
import { resolveAutocompleteItemText, useAutocompleteContext } from "./autocomplete-shared.js";
import { type ListBoxItemProps } from "./collection-shared.js";
export type { ListBoxItemProps } from "./collection-shared.js";
export function ListBoxItem({
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
}: ListBoxItemProps & RefProp<HTMLDivElement>) {
  const autocomplete = useAutocompleteContext();
  const listBox = useContext(ListBoxContext);
  const generatedId = useId().replace(/:/g, "");
  // The id prop is only ever the DOM id; the selection key is value alone so
  // the two concepts cannot silently stand in for each other.
  const value = valueProp ?? generatedId;
  const id = idProp ?? `listbox-option-${generatedId}`;
  const registerListBoxItem = listBox?.register;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox?.selectedKey === value;
  const collectionActive = !listBox?.selectedKey && listBox?.activeKey === value;
  const virtualActive = autocomplete?.activeId === id;
  const active = autocomplete?.disableVirtualFocus === false ? virtualActive : collectionActive;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (selected || active) tabIndex = 0;
  if (autocomplete && !autocomplete.disableVirtualFocus && !resolvedDisabled) tabIndex = -1;
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
      `ListBoxItem with value "${value}" requires textValue when Autocomplete filters child content that cannot be read before render.`,
    );
  }
  const visible = autocomplete?.isItemVisible(label) ?? true;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;

  const itemRef = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    registerListBoxItem?.(value, label, element, resolvedDisabled);
    composeRefs(ref)(element);
  };

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const crawled = resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value });
    if (crawled !== label) setCrawledLabel(crawled);
    registerListBoxItem?.(value, crawled, element, resolvedDisabled);
  });

  useLayoutEffect(() => {
    if (!setAutocompleteCollectionVersion || !visible) return;
    setAutocompleteCollectionVersion((version) => version + 1);
    return () => setAutocompleteCollectionVersion((version) => version + 1);
  }, [resolvedDisabled, setAutocompleteCollectionVersion, visible]);

  if (!visible) return null;

  return (
    <div
      {...props}
      ref={itemRef}
      id={id}
      role="option"
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-active={dataAttr(active)}
      data-autocomplete-item={autocomplete ? "" : undefined}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={value}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) {
          listBox?.setActiveKey(value);
          listBox?.setSelectedKey(value);
        }
      }}
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
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (
          event.defaultPrevented ||
          resolvedDisabled ||
          !autocomplete ||
          autocomplete.disableVirtualFocus
        )
          return;
        autocomplete.setActiveId(id);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        listBox?.setActiveKey(value);
        listBox?.setSelectedKey(value);
      }}
    >
      {children}
    </div>
  );
}
