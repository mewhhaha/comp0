import { dataAttr, findTypeaheadMatch, useComposedRefs, useTypeaheadSearch } from "@comp0/core";
import { createElement, useLayoutEffect, useMemo, useRef, type HTMLAttributes } from "react";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { SelectCollectionContext, type PickerOptionRecord } from "./pickers-shared.js";
import {
  placementSurfaceStyle,
  usePopoverSurface,
  type PopoverPlacementProps,
} from "./overlay-shared.js";

export type SelectPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

function optionsInDocumentOrder(options: Map<string, PickerOptionRecord>) {
  return [...options.values()].sort((first, second) => {
    if (!first.element || !second.element) return 0;
    const position = first.element.compareDocumentPosition(second.element);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}

export function SelectPopover({
  offset,
  onKeyDown,
  onToggle,
  placement,
  ref,
  style,
  ...props
}: SelectPopoverProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const typeaheadSearch = useTypeaheadSearch();
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  const composedRef = useComposedRefs(surfaceRef, ref);
  if (!select || !popover) throw new Error("SelectPopover must be rendered inside Select.");
  const options = useRef(new Map<string, PickerOptionRecord>());
  const wasOpen = useRef(false);
  // This identity feeds each option's cleanup effect; useMemo keeps it stable
  // even where the React Compiler bails out, or every popover re-render would
  // unregister the options mid-life.
  const context = useMemo(() => {
    const register = (option: PickerOptionRecord) => options.current.set(option.value, option);
    const unregister = (value: string) => options.current.delete(value);
    return { register, unregister };
  }, []);
  const activeElement = () => surfaceRef.current?.ownerDocument.activeElement;
  useLayoutEffect(() => {
    if (popover.open && !wasOpen.current) {
      const items = optionsInDocumentOrder(options.current).filter((item) => !item.disabled);
      (items.find((item) => item.value === select.selectedKey) ?? items[0])?.element?.focus();
    }
    wasOpen.current = popover.open;
  }, [popover.open, select.selectedKey]);
  const move = (key: string) => {
    const items = optionsInDocumentOrder(options.current).filter((item) => !item.disabled);
    const index = items.findIndex((item) => item.element === activeElement());
    let next: PickerOptionRecord | undefined;
    if (key === "Home") next = items[0];
    else if (key === "End") next = items.at(-1);
    else next = items[(index + (key === "ArrowUp" ? -1 : 1) + items.length) % items.length];
    if (next) {
      next.element?.focus();
    }
  };
  // A consumer aria-label wins; falling back to the label id would point at
  // nothing when no Label is rendered.
  let labelledBy = props["aria-labelledby"];
  if (!props["aria-label"]) labelledBy = labelledBy ?? select.labelId;
  const surface = createElement("div", {
    ...props,
    ref: composedRef,
    id: props.id ?? select.listBoxId,
    role: props.role ?? "listbox",
    popover: "auto",
    hidden: !popover.open,
    style: placementSurfaceStyle(placement, offset, select.triggerId, style),
    "data-open": dataAttr(popover.open),
    "aria-labelledby": labelledBy,
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      // Toggle events from nested popovers bubble in the React tree; only
      // this surface's own toggles drive its state.
      if (event.target !== event.currentTarget) return;
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        popover.requestClose();
        return;
      }
      if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        move(event.key);
      }
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        const current = optionsInDocumentOrder(options.current).find(
          (item) => item.element === activeElement(),
        );
        if (current) select.setSelectedKey(current.value);
        popover.requestClose();
        return;
      }
      if (event.key.length === 1 && event.key.trim() !== "") {
        const items = optionsInDocumentOrder(options.current);
        const currentKey = items.find((item) => item.element === activeElement())?.value;
        const match = findTypeaheadMatch(
          items.map((item) => ({ key: item.value, textValue: item.text, disabled: item.disabled })),
          typeaheadSearch(event.key),
          currentKey,
        );
        if (!match) return;
        event.preventDefault();
        items.find((item) => item.value === match)?.element?.focus();
      }
    },
  } as never);
  return <SelectCollectionContext value={context}>{surface}</SelectCollectionContext>;
}
