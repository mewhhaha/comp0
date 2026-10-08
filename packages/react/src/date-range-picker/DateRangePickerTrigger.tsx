import { type ComponentProps } from "react";
import { useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp } from "../internal/polymorphic.js";
import { Button } from "../button/Button.js";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { useDateRangePickerContext } from "./date-range-shared.js";
import { triggerAnchorStyle, usePopoverContext } from "../internal/overlay/index.js";

export type DateRangePickerTriggerProps = ComponentProps<"button"> & AsProp;

/** Opens the range calendar popover. The default aria-label is the English "Choose dates"; pass your own translation. */
export function DateRangePickerTrigger({ as, ref, style, ...props }: DateRangePickerTriggerProps) {
  const picker = useDateRangePickerContext("DateRangePickerTrigger");
  // DateRangePicker provides the popover context together with its own, which the required read above guarantees.
  const popover = usePopoverContext()!;
  const field = useFieldContext();
  const disabled = Boolean(props.disabled || picker.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  const composedRef = useComposedRefs(ref, popover.setTriggerElement);
  const trigger = useDisclosureTrigger({
    as,
    open: popover.open,
    onOpenChange: popover.setOpen,
    id: popover.triggerId,
    controls: popover.contentId,
    haspopup: "dialog",
    props: { ...props, disabled },
  });
  let ariaLabel = props["aria-label"];
  if (ariaLabel === undefined && props["aria-labelledby"] === undefined) {
    ariaLabel = "Choose dates";
  }

  return (
    <Button
      data-slot="date-range-picker-trigger"
      {...props}
      as={as}
      ref={composedRef}
      style={triggerAnchorStyle(popover.triggerId, style)}
      aria-describedby={description || undefined}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-label={ariaLabel}
      {...trigger}
    />
  );
}
