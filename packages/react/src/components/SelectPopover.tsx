import { composeRefs, dataAttr, findTypeaheadMatch, useTypeaheadSearch } from "@comp0/core";
import {
  createElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
} from "react";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { SelectCollectionContext, type PickerOptionRecord } from "./pickers-shared.js";
import { usePopoverSurface } from "./overlay-shared.js";

export type SelectPopoverProps = HTMLAttributes<HTMLDivElement>;

export function SelectPopover({
  ref,
  onKeyDown,
  onToggle,
  ...props
}: SelectPopoverProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const typeaheadSearch = useTypeaheadSearch();
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  if (!select || !popover)
    throw new Error("SelectPopover must be rendered inside Select and Popover.");
  const options = useRef(new Map<string, PickerOptionRecord>());
  const wasOpen = useRef(false);
  const register = useCallback(
    (option: PickerOptionRecord) => options.current.set(option.value, option),
    [],
  );
  const unregister = useCallback((value: string) => options.current.delete(value), []);
  const context = useMemo(() => ({ register, unregister }), [register, unregister]);
  useLayoutEffect(() => {
    if (popover.open && !wasOpen.current) {
      const items = [...options.current.values()].filter((item) => !item.disabled);
      (items.find((item) => item.value === select.selectedKey) ?? items[0])?.element?.focus();
    }
    wasOpen.current = popover.open;
  }, [popover.open, select.selectedKey]);
  const move = (key: string) => {
    const items = [...options.current.values()].filter((item) => !item.disabled);
    const index = items.findIndex((item) => item.element === document.activeElement);
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
  if (!props["aria-label"]) labelledBy ??= select.labelId;
  const surface = createElement("div", {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? select.listBoxId,
    role: props.role ?? "listbox",
    popover: "auto",
    anchor: select.triggerId,
    hidden: !popover.open,
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
        const current = [...options.current.values()].find(
          (item) => item.element === document.activeElement,
        );
        if (current) select.setSelectedKey(current.value);
        popover.requestClose();
        return;
      }
      if (event.key.length === 1 && event.key.trim() !== "") {
        const items = [...options.current.values()];
        const currentKey = items.find((item) => item.element === document.activeElement)?.value;
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
  return (
    <SelectCollectionContext.Provider value={context}>{surface}</SelectCollectionContext.Provider>
  );
}
