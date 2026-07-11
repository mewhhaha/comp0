import { composeRefs, dataAttr } from "@comp0/core";
import {
  createElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
} from "react";
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
  const register = useCallback(
    (option: PickerOptionRecord) => options.current.set(option.value, option),
    [],
  );
  const unregister = useCallback((value: string) => options.current.delete(value), []);
  const context = useMemo(() => ({ register, unregister }), [register, unregister]);
  useLayoutEffect(() => {
    if (!popover.open) {
      combo.setActiveId("");
      combo.setActiveKey("");
    }
  }, [combo, popover.open]);
  const surface = createElement("div", {
    ...props,
    ref: composeRefs(surfaceRef, ref),
    id: props.id ?? combo.listBoxId,
    role: props.role ?? "listbox",
    popover: "auto",
    anchor: combo.inputId,
    hidden: !popover.open,
    "data-open": dataAttr(popover.open),
    "aria-labelledby": props["aria-labelledby"] ?? combo.labelId,
    onToggle(event: React.ToggleEvent<HTMLDivElement>) {
      onToggle?.(event);
      if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
    },
  } as never);
  return (
    <ComboboxCollectionContext.Provider value={context}>
      {surface}
    </ComboboxCollectionContext.Provider>
  );
}
