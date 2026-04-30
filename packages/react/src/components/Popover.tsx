import { useId, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import {
  useComboBoxRootContext,
  usePickerRootContext,
  useSelectRootContext,
  type AnchorAttributeProps,
  type RefProp,
} from "../shared.js";
import { type PopoverProps } from "./overlay-shared.js";
export type { PopoverProps } from "./overlay-shared.js";
export function Popover({
  open: openProp,
  defaultOpen = false,
  onChange,
  hidden,
  popover,
  ref,
  ...props
}: PopoverProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const datePicker = usePickerRootContext();
  const picker = select ?? comboBox ?? datePicker;
  const [open] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });
  const generatedId = useId();
  const id = props.id ?? picker?.popoverId ?? generatedId;
  const isOpenResolved = picker?.open ?? open;
  const divProps = {
    ...props,
    anchor: props.anchor ?? select?.triggerId ?? comboBox?.inputId ?? datePicker?.triggerId,
  } as HTMLAttributes<HTMLDivElement> & AnchorAttributeProps;

  return (
    <div
      {...divProps}
      ref={ref}
      id={id}
      role={props.role ?? (datePicker || !picker ? "dialog" : undefined)}
      popover={popover}
      hidden={hidden ?? (popover === undefined ? !isOpenResolved : undefined)}
      data-open={dataAttr(isOpenResolved)}
    />
  );
}
