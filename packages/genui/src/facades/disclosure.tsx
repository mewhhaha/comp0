import { useState } from "react";
import { z } from "zod";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@comp0/react";
import { useHeadingLevel } from "../bridge/heading-level.js";
import { nodes } from "../catalog/schema.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import { asNode, asRecords, asText } from "../safe.js";

const tabProps = z.object({
  label: z.string().describe("Visible text of the tab."),
  children: nodes("Content shown when the tab is selected."),
});

const tabsProps = z.object({
  tabs: z
    .array(tabProps)
    .describe(
      "The tabs, each { label, children } where children are the components shown when the tab is selected.",
    ),
  label: z.string().optional().describe("Accessible name of the tab list."),
});

export function TabsFacade({ tabs, label }: CatalogProps<typeof tabsProps>) {
  const entries = asRecords(tabs, 24).filter((tab) => asText(tab.label) !== "");
  if (entries.length === 0) return null;
  const ariaLabel = asText(label) === "" ? undefined : asText(label);
  return (
    <Tabs as="div" defaultValue="tab-0">
      <TabList aria-label={ariaLabel}>
        {entries.map((tab, index) => (
          <Tab key={index} value={`tab-${index}`}>
            {asText(tab.label)}
          </Tab>
        ))}
      </TabList>
      {entries.map((tab, index) => (
        <TabPanel key={index} value={`tab-${index}`}>
          {asNode(tab.children)}
        </TabPanel>
      ))}
    </Tabs>
  );
}

const accordionItemProps = z.object({
  title: z.string().describe("Visible heading of the section; it toggles the section."),
  children: nodes("Content revealed when the section is open."),
  open: z.boolean().optional().describe("Starts open."),
});

const accordionProps = z.object({
  items: z.array(accordionItemProps).describe("The sections, each { title, children, open? }."),
  multiple: z.boolean().optional().describe("Allow several sections open at once."),
});

export function AccordionFacade({ items, multiple }: CatalogProps<typeof accordionProps>) {
  const entries = asRecords(items, 100).filter((item) => asText(item.title) !== "");
  // The model's `open` flags apply until the person opens or closes a section.
  const level = useHeadingLevel();
  const [chosen, setChosen] = useState<string[] | null>(null);
  if (entries.length === 0) return null;
  const modelOpen = entries.flatMap((item, index) => (item.open === true ? [`item-${index}`] : []));
  const open = chosen ?? (multiple === true ? modelOpen : modelOpen.slice(0, 1));
  const content = entries.map((item, index) => (
    <AccordionItem key={index} value={`item-${index}`}>
      <AccordionHeader level={level}>
        <AccordionTrigger>{asText(item.title)}</AccordionTrigger>
      </AccordionHeader>
      <AccordionPanel>{asNode(item.children)}</AccordionPanel>
    </AccordionItem>
  ));
  if (multiple === true) {
    return (
      <Accordion as="div" type="multiple" value={open} onChange={setChosen}>
        {content}
      </Accordion>
    );
  }
  return (
    <Accordion
      as="div"
      type="single"
      collapsible
      value={open[0] ?? ""}
      onChange={(next) => setChosen(next === "" ? [] : [next])}
    >
      {content}
    </Accordion>
  );
}

const disclosureProps = z.object({
  summary: z.string().describe("Visible text that toggles the details."),
  children: nodes("Details revealed when opened."),
  open: z.boolean().optional().describe("Starts open."),
});

export function DisclosureFacade({
  summary,
  children,
  open,
}: CatalogProps<typeof disclosureProps>) {
  const [chosen, setChosen] = useState<boolean | null>(null);
  return (
    <Disclosure data-slot="disclosure" open={chosen ?? open === true} onOpenChange={setChosen}>
      <DisclosureTrigger>{asText(summary)}</DisclosureTrigger>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
}

export const disclosureEntries = [
  defineEntry({
    name: "Tabs",
    group: "Disclosure",
    description:
      "Switches between parallel views of the same subject (for example per region or per plan). Requires tabs, each { label, children }; only one view is visible at a time.",
    props: tabsProps,
    component: TabsFacade,
  }),
  defineEntry({
    name: "Accordion",
    group: "Disclosure",
    description:
      "A list of sections that expand one at a time (or several with multiple). Use it for FAQs and long, skimmable content. Requires items, each { title, children, open? }.",
    props: accordionProps,
    component: AccordionFacade,
  }),
  defineEntry({
    name: "Disclosure",
    group: "Disclosure",
    description:
      "One show/hide section for optional details. Requires summary and children; use Accordion for several.",
    props: disclosureProps,
    component: DisclosureFacade,
  }),
];
