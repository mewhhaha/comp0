import {
  createElement,
  type ComponentProps,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { dataAttr, useCollectionNavigation, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { Button } from "../button/Button.js";
import { type AsProp } from "../internal/polymorphic.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { useSelectContext } from "./select-shared.js";

export type SelectTriggerProps = ComponentProps<"button"> &
  Pick<ComponentProps<"a">, "download" | "href" | "rel" | "target"> &
  AsProp;

export function SelectTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  ref,
  style,
  ...props
}: SelectTriggerProps) {
  const select = useSelectContext("SelectTrigger");
  const { popover } = select;
  const field = useFieldContext();
  const navigate = useCollectionNavigation();
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
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (!event.defaultPrevented) popover.setOpen(!popover.open);
    },
    onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || popover.open) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        popover.setOpen(true);
        return;
      }
      // Typing on the closed trigger changes the selection, like a native
      // select. The listbox stays mounted while hidden, so its options are
      // registered here.
      if (event.key.length !== 1 || event.key.trim() === "") return;
      const match = navigate(event.key, select.collection.items(), select.selectedKey, {
        orientation: "vertical",
      });
      if (!match) return;
      event.preventDefault();
      select.setSelectedKey(match);
    },
  });
}
