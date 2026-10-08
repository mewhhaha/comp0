import { type ComponentProps, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useAccordionItemContext } from "./accordion-shared.js";

export type AccordionPanelProps = Omit<ComponentProps<"div">, "id" | "role"> &
  AsProp & {
    role?: "region" | "group" | undefined;
    children?: ReactNode;
  };

export function AccordionPanel({ as, role = "region", ...props }: AccordionPanelProps) {
  const item = useAccordionItemContext("AccordionPanel");

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      id={item.panelId}
      role={role}
      hidden={!item.open}
      aria-labelledby={item.triggerId}
      data-slot={dataSlot(props, "accordion-panel")}
      data-open={dataAttr(item.open)}
      data-disabled={dataAttr(item.disabled)}
    />
  );
}
