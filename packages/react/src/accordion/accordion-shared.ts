import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type AccordionContextValue = {
  type: "single" | "multiple";
  selectedKeys: Set<string>;
  collapsible: boolean;
  setItemOpen: (key: string, open: boolean) => void;
  /** The document-order registry every AccordionTrigger joins. */
  collection: Collection;
};

export const [AccordionContext, useAccordionContext] =
  createRequiredContext<AccordionContextValue>("Accordion");

export type AccordionItemContextValue = {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  panelId: string;
};

export const [AccordionItemContext, useAccordionItemContext] =
  createRequiredContext<AccordionItemContextValue>("AccordionItem");
