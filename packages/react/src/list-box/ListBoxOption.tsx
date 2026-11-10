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
import { dataAttr, useComposedRefs } from "@comp0/core";
import {
  useCollectedItem,
  useIsCollectionPass,
  useRenderOrderSeed,
} from "../internal/collection-pass.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { useWarnOnce } from "../internal/dev.js";
import { resolveItemLabel } from "../internal/item-label.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useIsTabStop } from "../internal/tab-stop.js";
import {
  resolveAutocompleteItemText,
  useAutocompleteContext,
} from "../autocomplete/autocomplete-shared.js";
import { useListBoxContext } from "./list-box-shared.js";

function ListBoxOptionPart({
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
  const warn = useWarnOnce();
  const autocomplete = useAutocompleteContext();
  const listBox = useListBoxContext("ListBoxOption");
  const { collection } = listBox;
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `listbox-option-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const selected = listBox.selectedKey === value;
  // Autocomplete keeps DOM focus in its input and moves a virtual active option instead, so no
  // option takes the roving tab stop while it is in charge.
  const virtualFocus = autocomplete?.disableVirtualFocus === false;
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
    warn(
      `ListBoxOption:missing-text-value:${value}`,
      `ListBoxOption with value "${value}" requires textValue when Autocomplete filters child content that cannot be read before render. Its value was used as its text.`,
    );
  }
  const visible = autocomplete?.isItemVisible(label) ?? true;
  // An option the filter hides renders nothing, so it must not be recorded as a stop either.
  useRenderOrderSeed(listBox.seed, value, resolvedDisabled, visible);
  const isTabStop = useIsTabStop(listBox.tabStops, value, listBox.selection);
  const active = virtualFocus ? autocomplete?.activeId === id : isTabStop;
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (!virtualFocus && isTabStop) tabIndex = 0;

  // The stop depends on the whole collection, which the server can see in another order.
  useHydrationRepair(elementRef, {
    tabindex: tabIndex === undefined ? null : String(tabIndex),
    "data-active": active ? "" : null,
  });

  const itemRef = useComposedRefs(elementRef, ref);

  // Re-register after every render so crawled labels follow content changes; registering an
  // unchanged option is a no-op in the collection.
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) {
      collection.unregister(value);
      return;
    }
    const crawled = resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value });
    if (crawled !== label) setCrawledLabel(crawled);
    collection.register({
      key: value,
      id,
      textValue: crawled,
      element,
      disabled: resolvedDisabled,
    });
  });

  useLayoutEffect(() => {
    return () => {
      collection.unregister(value);
    };
    // The cleanup must run only when the option unmounts or changes identity,
    // not whenever its label or the ListBox's callback identity changes.
  }, [collection, value]);

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
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={value}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) {
          listBox.setFocusedKey(value);
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
        listBox.setFocusedKey(value);
        listBox.setSelectedKey(value);
      }}
    >
      {children}
    </Part>
  );
}

export type ListBoxOptionProps = ComponentProps<"div"> &
  AsProp & {
    /** Identity used for selection; unique within the ListBox. */
    value: string;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for typeahead and display. */
    textValue?: string | undefined;
  };

export function ListBoxOption(props: ListBoxOptionProps) {
  // Inside a collection pass the option only records itself, so the real options know the
  // whole collection before they render.
  const collecting = useIsCollectionPass();
  if (collecting) return <CollectedListBoxOption {...props} />;
  return <ListBoxOptionPart {...props} />;
}

function CollectedListBoxOption({
  value,
  disabled,
  textValue,
  children,
  ...props
}: ListBoxOptionProps) {
  const autocomplete = useAutocompleteContext();
  const listBox = useListBoxContext("ListBoxOption");
  // The text the real option filters on in its first render, before it can crawl its element.
  let label = textValue;
  const renderedText = resolveAutocompleteItemText(children).text;
  if (label === undefined && renderedText) label = renderedText;
  if (label === undefined) label = props["aria-label"] ?? value;
  // An option the filter hides renders nothing, so it must not be recorded as a stop either.
  useCollectedItem(listBox.seed, value, disabled, autocomplete?.isItemVisible(label) ?? true);
  return null;
}
