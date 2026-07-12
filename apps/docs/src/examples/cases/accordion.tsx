import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@comp0/react";

export function Example() {
  return (
    <Accordion
      as="div"
      className="divide-y divide-zinc-950/10 rounded border border-zinc-950/10 dark:divide-white/10 dark:border-white/10"
      defaultValue="shipping"
    >
      <AccordionItem value="shipping">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Shipping <span aria-hidden="true">+</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Orders leave our warehouse in two business days.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Returns <span aria-hidden="true">+</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Returns are accepted within 30 days.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
