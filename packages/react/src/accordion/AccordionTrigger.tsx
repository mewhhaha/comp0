import { type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs, useCollectionNavigation } from "@comp0/core";
import { useDisclosureTrigger } from "../internal/disclosure-trigger.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useAccordionContext, useAccordionItemContext } from "./accordion-shared.js";

export type AccordionTriggerProps = Omit<ComponentProps<"button">, "id"> & AsProp;

export function AccordionTrigger({
  as,
  disabled,
  onKeyDown,
  ref,
  ...props
}: AccordionTriggerProps) {
  const accordion = useAccordionContext("AccordionTrigger");
  const item = useAccordionItemContext("AccordionTrigger");
  const navigate = useCollectionNavigation();
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
  const trigger = useDisclosureTrigger({
    as,
    open,
    onOpenChange: (next) => accordion.setItemOpen(item.value, next),
    id: item.triggerId,
    controls: item.panelId,
    props: {
      ...props,
      disabled: resolvedDisabled,
      onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
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
      },
    },
  });
  // The one open item of a non-collapsible single accordion cannot close.
  const locked = accordion.type === "single" && open && !accordion.collapsible;

  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="accordion-trigger"
      {...props}
      ref={triggerRef}
      {...trigger}
      aria-disabled={locked || trigger["aria-disabled"]}
    />
  );
}
