import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@comp0/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Accordion
      as="div"
      className="divide-y divide-zinc-950/10 rounded border border-zinc-950/10 dark:divide-white/10 dark:border-white/10"
      defaultValue="shipping"
    >
      <AccordionItem value="shipping">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Shipping{" "}
            <ChevronDownIcon
              className="size-4 text-zinc-400 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="docs-accordion-panel grid grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none [&[hidden]]:grid-rows-[0fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
              Orders leave our warehouse in two business days.
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="group flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Returns{" "}
            <ChevronDownIcon
              className="size-4 text-zinc-400 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="docs-accordion-panel grid grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none [&[hidden]]:grid-rows-[0fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
              Returns are accepted within 30 days.
            </div>
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
