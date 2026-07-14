import {
  createElement,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type MouseEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { Button } from "./Button.js";
import { triggerAnchorStyle, usePopoverContext } from "./overlay-shared.js";

export type SelectTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target"> & {
    as?: ElementType | undefined;
  };

export function SelectTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  ref,
  style,
  ...props
}: SelectTriggerProps & RefProp<HTMLButtonElement>) {
  const select = useSelectRootContext();
  const popover = usePopoverContext();
  const field = useFieldContext();
  if (!select || !popover) throw new Error("SelectTrigger must be rendered inside Select.");
  const resolvedDisabled = Boolean(disabled || select.disabled);
  const description = describedBy(field, props["aria-describedby"]);
  const composedRef = useComposedRefs(ref, popover.setTriggerElement);
  let ariaLabelledBy = props["aria-labelledby"];
  if (ariaLabelledBy === undefined && props["aria-label"] === undefined) {
    ariaLabelledBy = `${select.labelId} ${select.triggerId}`;
  }

  return createElement(Button as ElementType, {
    ...props,
    as,
    ref: composedRef,
    disabled: resolvedDisabled,
    id: props.id ?? select.triggerId,
    style: triggerAnchorStyle(select.triggerId, style),
    "aria-controls": props["aria-controls"] ?? select.listBoxId,
    "aria-describedby": description || undefined,
    "aria-expanded": popover.open,
    "aria-haspopup": props["aria-haspopup"] ?? "listbox",
    "aria-invalid": props["aria-invalid"] ?? (field?.invalid || undefined),
    "aria-labelledby": ariaLabelledBy,
    "data-open": dataAttr(popover.open),
    onClick(event: MouseEvent<HTMLElement>) {
      onClick?.(event as never);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
    onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
      onKeyDown?.(event as never);
      if (event.defaultPrevented || popover.open) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      popover.setOpen(true);
    },
  });
}
