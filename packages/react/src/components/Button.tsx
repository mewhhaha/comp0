import {
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Slot,
  dataAttr,
  mergeInteractionProps,
  mergeProps,
  useFocusRing,
  useHover,
  usePress,
} from "@comp0/core";
import {
  resolveChildren,
  resolveClassName,
  type AsChildProps,
  type CommandAttributeProps,
  type SharedStateProps,
  useComboBoxRootContext,
  usePickerRootContext,
  useSearchFieldContext,
  useSelectRootContext,
  type RefProp,
} from "../shared.js";

export type ButtonState = {
  disabled: boolean;
  focused: boolean;
  focusVisible: boolean;
  hovered: boolean;
  pressed: boolean;
  pending: boolean;
};

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> &
  SharedStateProps<ButtonState> &
  AsChildProps &
  CommandAttributeProps & {
    pending?: boolean | undefined;
  };

export function Button({
  asChild,
  children,
  className,
  disabled: disabledProp,
  onKeyDown,
  pending,
  type = "button",
  ref,
  ...props
}: ButtonProps & RefProp<HTMLButtonElement>) {
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const datePicker = usePickerRootContext();
  const search = useSearchFieldContext();
  const picker = select ?? comboBox;
  const triggerPicker = picker ?? datePicker;
  const resolvedPending = Boolean(pending);
  const disabled = Boolean(disabledProp ?? resolvedPending ?? triggerPicker?.disabled);
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLButtonElement>({ disabled });
  const { hoverProps, isHovered } = useHover<HTMLButtonElement>({ disabled });
  const { pressProps, isPressed } = usePress<HTMLButtonElement>({ disabled });
  let ariaHasPopup = props["aria-haspopup"];
  if (picker) ariaHasPopup = "listbox";
  else if (datePicker) ariaHasPopup = "dialog";
  let ariaLabelledBy = props["aria-labelledby"];
  if (select) ariaLabelledBy = `${select.labelId} ${select.triggerId}`;
  const state: ButtonState = {
    disabled,
    focused: isFocused,
    focusVisible: isFocusVisible,
    hovered: isHovered,
    pressed: isPressed,
    pending: resolvedPending,
  };
  const Component = asChild ? Slot : "button";
  const mergedProps = mergeProps<Record<string, unknown>>(
    props as Record<string, unknown>,
    mergeInteractionProps(focusProps, hoverProps, pressProps) as Record<string, unknown>,
    {
      ref,
      type: asChild ? undefined : type,
      disabled: asChild ? undefined : disabled,
      "aria-disabled": asChild ? disabled || undefined : undefined,
      "aria-busy": resolvedPending || undefined,
      "data-disabled": dataAttr(disabled),
      "data-focused": dataAttr(isFocused),
      "data-focus-visible": dataAttr(isFocusVisible),
      "data-hovered": dataAttr(isHovered),
      "data-open": dataAttr(triggerPicker?.open),
      "data-pressed": dataAttr(isPressed),
      "data-pending": dataAttr(resolvedPending),
      id: select?.triggerId ?? datePicker?.triggerId ?? props.id,
      "aria-controls": picker?.listBoxId ?? datePicker?.popoverId ?? props["aria-controls"],
      "aria-expanded": triggerPicker ? triggerPicker.open : props["aria-expanded"],
      "aria-haspopup": ariaHasPopup,
      "aria-labelledby": ariaLabelledBy,
      className: resolveClassName(className, state),
      children: resolveChildren(children, state),
      onClick(event: ReactMouseEvent<HTMLButtonElement>) {
        if (!event.defaultPrevented && select) select.setOpen(!select.open);
        if (!event.defaultPrevented && !select && comboBox) comboBox.setOpen(!comboBox.open);
        if (!event.defaultPrevented && !picker && datePicker) datePicker.setOpen(!datePicker.open);
        if (
          !event.defaultPrevented &&
          !select &&
          !comboBox &&
          search &&
          (props["aria-label"]?.toString().toLowerCase().includes("clear") ||
            props.slot === "clear" ||
            (props as Record<string, unknown>)["data-slot"] === "clear")
        ) {
          search.clear();
        }
      },
      onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          disabled ||
          !triggerPicker ||
          (event.key !== "Enter" && event.key !== " ")
        )
          return;
        event.preventDefault();
        triggerPicker.setOpen(!triggerPicker.open);
      },
    },
  );

  return <Component {...mergedProps} />;
}
