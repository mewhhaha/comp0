import { type ComponentProps, type KeyboardEvent } from "react";
import { useCollectionNavigation, useComposedRefs } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { Button } from "../button/Button.js";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp } from "../internal/polymorphic.js";
import { triggerAnchorStyle } from "../internal/overlay/index.js";
import { useSelectContext } from "./select-shared.js";

export type SelectTriggerProps = ComponentProps<"button"> & AsProp;

export function SelectTrigger({
  as,
  disabled,
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
  const trigger = useDisclosureTrigger({
    as,
    open: popover.open,
    onOpenChange: popover.setOpen,
    id: select.triggerId,
    controls: select.listBoxId,
    haspopup: "listbox",
    props: {
      ...props,
      disabled: resolvedDisabled,
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
    },
  });

  return (
    <Button
      {...props}
      as={as}
      ref={composedRef}
      style={triggerAnchorStyle(select.triggerId, style)}
      aria-describedby={description || undefined}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-labelledby={ariaLabelledBy}
      {...trigger}
    />
  );
}
