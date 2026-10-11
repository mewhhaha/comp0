import { useState } from "react";
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
import { type CatalogProps } from "../catalog/types.js";
import { tabsProps, accordionProps, disclosureProps } from "./disclosure.props.js";
import { asNode, asRecords, asText } from "../safe.js";

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

/** The facades that render the disclosure components, by component name. */
export const disclosureComponents = {
  Tabs: TabsFacade,
  Accordion: AccordionFacade,
  Disclosure: DisclosureFacade,
};
