import { useContext, useId } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { AccordionContext, AccordionItemContext } from "./accordion-shared.js";
import { type AccordionItemProps } from "./accordion-shared.js";
export type { AccordionItemProps } from "./accordion-shared.js";

export function AccordionItem({
  value,
  disabled = false,
  id,
  ref,
  ...props
}: AccordionItemProps & RefProp<HTMLDivElement>) {
  const accordion = useContext(AccordionContext);
  const generatedId = useId();
  const itemId = id ?? `${generatedId}-${value}`;
  const open = accordion?.selectedKeys.has(value) ?? false;

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
      <div
        {...props}
        ref={ref}
        id={id}
        data-slot={dataSlot(props, "accordion-item")}
        data-open={dataAttr(open)}
        data-disabled={dataAttr(disabled)}
      />
    </AccordionItemContext>
  );
}
