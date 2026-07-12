import { composeRefs, dataAttr } from "@comp0/core";
import { createElement, useLayoutEffect, useMemo, useRef, type HTMLAttributes } from "react";
import { useComboBoxRootContext, type RefProp } from "../shared.js";
import { ComboboxCollectionContext, type PickerOptionRecord } from "./pickers-shared.js";
import { usePopoverSurface } from "./overlay-shared.js";

export type ComboboxPopoverProps = HTMLAttributes<HTMLDivElement>;

export function ComboboxPopover({
  ref,
  onToggle,
  ...props
}: ComboboxPopoverProps & RefProp<HTMLDivElement>) {
  const combo = useComboBoxRootContext();
  const { onNativeToggle, popover, surfaceRef } = usePopoverSurface<HTMLDivElement>("auto");
  if (!combo || !popover)
    throw new Error("ComboboxPopover must be rendered inside Combobox and Popover.");
  const options = useRef(new Map<string, PickerOptionRecord>());
  // This identity feeds each option's cleanup effect; useMemo keeps it stable
  // even where the React Compiler bails out, or every popover re-render would
  // unregister the options mid-life.
  const context = useMemo(() => {
    const register = (option: PickerOptionRecord) => options.current.set(option.value, option);
    const unregister = (value: string) => options.current.delete(value);
    return { register, unregister };
  }, []);
  useLayoutEffect(() => {
    if (!popover.open) {
      combo.setActiveId("");
      combo.setActiveKey("");
    }
  }, [combo, popover.open]);
  // A consumer aria-label wins; falling back to the label id would point at
  // nothing when no Label is rendered.
  let labelledBy = props["aria-labelledby"];
  if (!props["aria-label"]) labelledBy = labelledBy ?? combo.labelId;
  const surface = createElement("div", {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? combo.listBoxId,
    role: props.role ?? "listbox",
    popover: "auto",
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
  } as never);
  return <ComboboxCollectionContext value={context}>{surface}</ComboboxCollectionContext>;
}
