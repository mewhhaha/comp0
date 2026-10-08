import { useId, type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { AccordionItemContext, useAccordionContext } from "./accordion-shared.js";

export type AccordionItemProps = ComponentProps<"div"> &
  AsProp & {
    value: string;
    disabled?: boolean | undefined;
  };

export function AccordionItem({ as, value, disabled = false, id, ...props }: AccordionItemProps) {
  const accordion = useAccordionContext("AccordionItem");
  const generatedId = useId();
  const itemId = id ?? `${generatedId}-${value}`;
  const open = accordion.selectedKeys.has(value);

  const Part = partElement(as, "div");
  return (
    <AccordionItemContext
      value={{
        value,
        open,
        disabled,
        triggerId: `${itemId}-trigger`,
        panelId: `${itemId}-panel`,
      }}
    >
      <Part
        {...props}
        id={id}
        data-slot={dataSlot(props, "accordion-item")}
        data-open={dataAttr(open)}
        data-disabled={dataAttr(disabled)}
      />
    </AccordionItemContext>
  );
}
