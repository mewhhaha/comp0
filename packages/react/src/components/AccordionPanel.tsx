import { useContext } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { AccordionItemContext } from "./accordion-shared.js";
import { type AccordionPanelProps } from "./accordion-shared.js";
export type { AccordionPanelProps } from "./accordion-shared.js";

export function AccordionPanel({
  role = "region",
  ref,
  ...props
}: AccordionPanelProps & RefProp<HTMLDivElement>) {
  const item = useContext(AccordionItemContext);
  const open = item?.open ?? false;

  return (
    <div
      {...props}
      ref={ref}
      id={item?.panelId}
      role={role}
      hidden={!open}
      aria-labelledby={item?.triggerId}
      data-slot={dataSlot(props, "accordion-panel")}
      data-open={dataAttr(open)}
      data-disabled={dataAttr(item?.disabled)}
    />
  );
}
