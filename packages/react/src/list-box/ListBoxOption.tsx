import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { resolveItemLabel } from "../internal/item-label.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  resolveAutocompleteItemText,
  useAutocompleteContext,
} from "../autocomplete/autocomplete-shared.js";
import { useListBoxContext } from "./list-box-shared.js";

export type ListBoxOptionProps = ComponentProps<"div"> &
  AsProp & {
    /** Identity used for selection; unique within the ListBox. */
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for typeahead and display. */
    textValue?: string | undefined;
  };

export function ListBoxOption({
  as,
  id: idProp,
  value,
  disabled,
  textValue,
  children,
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
  ref,
  ...props
}: ListBoxOptionProps) {
  const autocomplete = useAutocompleteContext();
  const listBox = useListBoxContext("ListBoxOption");
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `listbox-option-${generatedId}`;
  const registerListBoxOption = listBox.register;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox.selectedKey === value;
  const collectionActive = listBox.activeKey === value;
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
      `ListBoxOption with value "${value}" requires textValue when Autocomplete filters child content that cannot be read before render.`,
    );
  }
  const visible = autocomplete?.isItemVisible(label) ?? true;
  const setAutocompleteCollectionVersion = autocomplete?.setCollectionVersion;

  const itemRef = (element: HTMLDivElement | null) => {
    elementRef.current = element;
    registerListBoxOption({
      key: value,
      id,
      textValue: label,
      element,
      disabled: resolvedDisabled,
    });
    composeRefs(ref)(element);
  };

  // Re-register after every render so crawled labels follow content changes.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const crawled = resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value });
    if (crawled !== label) setCrawledLabel(crawled);
    registerListBoxOption({
      key: value,
      id,
      textValue: crawled,
      element,
      disabled: resolvedDisabled,
    });
  });

  useLayoutEffect(() => {
    if (!setAutocompleteCollectionVersion || !visible) return;
    setAutocompleteCollectionVersion((version) => version + 1);
    return () => setAutocompleteCollectionVersion((version) => version + 1);
  }, [resolvedDisabled, setAutocompleteCollectionVersion, visible]);

  if (!visible) return null;

  const Part = partElement(as, "div");
  return (
    <Part
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
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) {
          listBox.setActiveKey(value);
          listBox.setSelectedKey(value);
        }
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        if (
          !event.defaultPrevented &&
          autocomplete &&
          !autocomplete.disableVirtualFocus &&
          event.pointerType !== "touch"
        )
          event.preventDefault();
      }}
      onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
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
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        listBox.setActiveKey(value);
        listBox.setSelectedKey(value);
      }}
    >
      {children}
    </Part>
  );
}
