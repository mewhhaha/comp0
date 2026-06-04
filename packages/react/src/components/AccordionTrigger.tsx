import { useCallback, useContext } from "react";
import { composeRefs, dataAttr, getRovingFocusTarget } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { AccordionContext, AccordionItemContext } from "./accordion-shared.js";
import { type AccordionTriggerProps } from "./accordion-shared.js";
export type { AccordionTriggerProps } from "./accordion-shared.js";

export function AccordionTrigger({
  disabled,
  onClick,
  onKeyDown,
  ref,
  ...props
}: AccordionTriggerProps & RefProp<HTMLButtonElement>) {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const resolvedDisabled = Boolean(disabled || item?.disabled);
  const open = item?.open ?? false;
  const itemValue = item?.value ?? props.id ?? "";

  const triggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      if (item) accordion?.registerTrigger(item.value, element, resolvedDisabled);
      composeRefs(ref)(element);
    },
    [accordion, item, ref, resolvedDisabled],
  );

  return (
    <button
      {...props}
      ref={triggerRef}
      id={props.id ?? item?.triggerId}
      type={props.type ?? "button"}
      aria-expanded={open}
      aria-controls={item?.panelId}
      aria-disabled={
        accordion?.type === "single" && open && !accordion.collapsible ? true : undefined
      }
      disabled={resolvedDisabled}
      data-slot={dataSlot(props, "accordion-trigger")}
      data-open={dataAttr(open)}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && item && !resolvedDisabled) {
          accordion?.setItemOpen(item.value, !open);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !accordion) return;
        const targetKey = getRovingFocusTarget(accordion.triggers(), itemValue, event.key, {
          orientation: "vertical",
          loop: true,
        });
        if (!targetKey) return;
        event.preventDefault();
        accordion
          .triggers()
          .find((trigger) => trigger.key === targetKey)
          ?.element?.focus();
      }}
    />
  );
}
