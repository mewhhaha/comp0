import { type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";
import { composeRefs, dataAttr, useCollectionNavigation } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useAccordionContext, useAccordionItemContext } from "./accordion-shared.js";

export type AccordionTriggerProps = Omit<ComponentProps<"button">, "id"> & AsProp;

export function AccordionTrigger({
  as,
  disabled,
  onClick,
  onKeyDown,
  ref,
  ...props
}: AccordionTriggerProps) {
  const accordion = useAccordionContext("AccordionTrigger");
  const item = useAccordionItemContext("AccordionTrigger");
  const navigate = useCollectionNavigation();
  const isNativeButton = as === undefined || as === "button";
  const resolvedDisabled = Boolean(disabled || item.disabled);
  const { open } = item;
  const triggerRef = (element: HTMLButtonElement | null) => {
    accordion.collection.register({
      key: item.value,
      id: item.triggerId,
      textValue: element?.textContent?.trim() || item.value,
      disabled: resolvedDisabled,
      element,
    });
    composeRefs(ref)(element);
  };
  let ariaDisabled: boolean | undefined;
  if (accordion.type === "single" && open && !accordion.collapsible) ariaDisabled = true;
  if (!isNativeButton && resolvedDisabled) ariaDisabled = true;

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={triggerRef}
      id={item.triggerId}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-expanded={open}
      aria-controls={item.panelId}
      aria-disabled={ariaDisabled}
      disabled={isNativeButton ? resolvedDisabled : undefined}
      data-slot={dataSlot(props, "accordion-trigger")}
      data-open={dataAttr(open)}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) accordion.setItemOpen(item.value, !open);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        const targetKey = navigate(event.key, accordion.collection.items(), item.value, {
          orientation: "vertical",
          loop: true,
          typeahead: false,
        });
        if (!targetKey) return;
        event.preventDefault();
        accordion.collection.get(targetKey)?.element?.focus();
      }}
    />
  );
}
