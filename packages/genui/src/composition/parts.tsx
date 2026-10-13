"use client";

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Link,
  Description,
  Label,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@comp0/react";
import { fieldKey, useFormSnapshot, useRegisterField, useStateKey } from "../bridge/fields.js";
import { useActionSteps, type ActionStep } from "../bridge/steps.js";
import { useHeadingLevel } from "../bridge/heading-level.js";
import { useField } from "../bridge/state.js";
import { type InputOf } from "../catalog/schema.js";
import { actionsComponents } from "../facades/actions.js";
import { dataComponents } from "../facades/data.js";
import { DisclosureFacade } from "../facades/disclosure.js";
import { feedbackComponents } from "../facades/feedback.js";
import { formsComponents, FormFacade } from "../facades/forms.js";
import { CardFacade, GridFacade, ImageFacade, StackFacade } from "../facades/layout.js";
import { resultsComponents } from "../facades/results.js";
import { asNumber, asRecords, asText, asToken, safeHref } from "../safe.js";
import { useGenUI } from "../render/context.js";
import { type Binding } from "../validate/values.js";
import {
  accordionSpec,
  buttonSpec,
  formSpec,
  headingSpec,
  linkSpec,
  listSpec,
  optionSpec,
  sectionSpec,
  selectSpec,
  tabListSpec,
  tabPanelSpec,
  tabSpec,
  tabsSpec,
  textSpec,
} from "./builtins.js";

type Children = { children?: ReactNode | undefined };

export type HeadingPartProps = InputOf<typeof headingSpec.props> & Children;
export function HeadingPart({ level, children }: HeadingPartProps) {
  const resolved = Math.min(6, Math.max(1, Math.round(asNumber(level) ?? 2)));
  const Heading = `h${resolved}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <Heading data-slot="heading">{children}</Heading>;
}

export type TextPartProps = InputOf<typeof textSpec.props> & Children;
export function TextPart({ tone, size, children }: TextPartProps) {
  return (
    <p data-slot="text" data-tone={tone ?? undefined} data-size={size ?? undefined}>
      {children}
    </p>
  );
}

export type ListPartProps = InputOf<typeof listSpec.props> & Children;
export function ListPart({ ordered, children }: ListPartProps) {
  if (ordered === true) return <ol data-slot="list">{children}</ol>;
  return <ul data-slot="list">{children}</ul>;
}

export type ItemPartProps = Children;
export function ItemPart({ children }: ItemPartProps) {
  return <li>{children}</li>;
}

export type FormPartProps = InputOf<typeof formSpec.props> & Children;
export function FormPart({ label, name, submitLabel, action, children }: FormPartProps) {
  return (
    <FormFacade name={name} title={label} submitLabel={submitLabel} action={action}>
      {children}
    </FormFacade>
  );
}

export type ButtonPartProps = InputOf<typeof buttonSpec.props> & Children;
export function ButtonPart({ variant, message, action, children }: ButtonPartProps) {
  const { act, streaming } = useGenUI();
  const snapshot = useFormSnapshot();
  const runSteps = useActionSteps();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const steps = asRecords(action) as ActionStep[];
  let failure = null;
  if (error !== "")
    failure = (
      <p data-slot="button-error" role="alert">
        {error}
      </p>
    );
  return (
    <>
      <Button
        data-slot="button"
        data-variant={variant ?? undefined}
        disabled={streaming || pending}
        aria-busy={pending || undefined}
        onClick={(event) => {
          const { name, values } = snapshot();
          if (steps.length === 0) {
            let sentence = asText(message);
            if (sentence.trim() === "") sentence = event.currentTarget.textContent ?? "";
            act({ type: "button", name, message: sentence, values });
            return;
          }
          setPending(true);
          setError("");
          void runSteps(steps, { type: "button", name, values }).then((result) => {
            setPending(false);
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {children}
      </Button>
      {failure}
    </>
  );
}

export type LinkPartProps = InputOf<typeof linkSpec.props> & Children;
export function LinkPart({ href, children }: LinkPartProps) {
  const safe = safeHref(href);
  if (safe === undefined) return <span data-slot="link">{children}</span>;
  let rel: string | undefined;
  if (/^https?:/i.test(safe)) rel = "noopener noreferrer";
  return (
    <Link data-slot="link" href={safe} rel={rel}>
      {children}
    </Link>
  );
}

const SelectPartsContext = createContext(false);

export type SelectPartProps = Omit<InputOf<typeof selectSpec.props>, "value"> &
  Children & {
    value?: string | Binding | null | undefined;
  };
export function SelectPart({
  label,
  name,
  value,
  required,
  description,
  children,
}: SelectPartProps) {
  const key = fieldKey(name, label);
  const stateKey = useStateKey(key);
  let literal: string | undefined;
  if (typeof value === "string") literal = value;
  const field = useField<string>(stateKey, literal, value);
  useRegisterField({ name: key, label, key: field.key, initial: field.fallback });
  let hint = null;
  if (description) hint = <Description>{description}</Description>;
  return (
    <SelectPartsContext value={true}>
      <Select
        as="div"
        name={key}
        value={asText(field.value)}
        onChange={field.setValue}
        required={required === true}
      >
        <Label>{label}</Label>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectPopover placement="bottom start" offset={4}>
          {children}
        </SelectPopover>
        {hint}
      </Select>
    </SelectPartsContext>
  );
}

export type OptionPartProps = InputOf<typeof optionSpec.props> & Children;
export function OptionPart({ value, disabled, children }: OptionPartProps) {
  const inside = use(SelectPartsContext);
  if (!inside) return null;
  return (
    <SelectOption value={value} disabled={disabled === true}>
      {children}
    </SelectOption>
  );
}

const TabsPartsContext = createContext<{
  selected: string | undefined;
  chooseFirst: (value: string) => void;
} | null>(null);

export type TabsPartProps = InputOf<typeof tabsSpec.props> & Children;
export function TabsPart({ defaultValue, children }: TabsPartProps) {
  const [chosen, setChosen] = useState<string>();
  const selected = chosen ?? defaultValue ?? undefined;
  return (
    <TabsPartsContext
      value={{
        selected,
        chooseFirst(value) {
          setChosen((current) => current ?? value);
        },
      }}
    >
      <Tabs as="div" value={selected ?? ""} onChange={setChosen}>
        {children}
      </Tabs>
    </TabsPartsContext>
  );
}

export type TabListPartProps = InputOf<typeof tabListSpec.props> & Children;
export function TabListPart({ label, orientation, children }: TabListPartProps) {
  const tabs = use(TabsPartsContext);
  if (tabs === null) return null;
  return (
    <TabList
      aria-label={label}
      orientation={asToken(orientation, ["horizontal", "vertical"] as const)}
    >
      {children}
    </TabList>
  );
}

export type TabPartProps = InputOf<typeof tabSpec.props> & Children;
export function TabPart({ value, disabled, children }: TabPartProps) {
  const tabs = use(TabsPartsContext);
  useEffect(() => {
    if (tabs !== null && tabs.selected === undefined && disabled !== true) tabs.chooseFirst(value);
  }, [tabs, disabled, value]);
  if (tabs === null) return null;
  return (
    <Tab value={value} disabled={disabled === true}>
      {children}
    </Tab>
  );
}

export type TabPanelPartProps = InputOf<typeof tabPanelSpec.props> & Children;
export function TabPanelPart({ value, children }: TabPanelPartProps) {
  const tabs = use(TabsPartsContext);
  if (tabs === null) return null;
  return <TabPanel value={value}>{children}</TabPanel>;
}

const AccordionPartsContext = createContext(false);

export type AccordionPartProps = InputOf<typeof accordionSpec.props> & Children;
export function AccordionPart({ multiple, defaultValue, children }: AccordionPartProps) {
  if (multiple === true) {
    let initial: string[] = [];
    if (Array.isArray(defaultValue)) initial = defaultValue;
    if (typeof defaultValue === "string") initial = [defaultValue];
    return (
      <AccordionPartsContext value={true}>
        <Accordion as="div" type="multiple" defaultValue={initial}>
          {children}
        </Accordion>
      </AccordionPartsContext>
    );
  }
  let initial = "";
  if (typeof defaultValue === "string") initial = defaultValue;
  if (Array.isArray(defaultValue)) initial = defaultValue[0] ?? "";
  return (
    <AccordionPartsContext value={true}>
      <Accordion as="div" collapsible defaultValue={initial}>
        {children}
      </Accordion>
    </AccordionPartsContext>
  );
}

export type SectionPartProps = InputOf<typeof sectionSpec.props> & Children;
export function SectionPart({ value, title, disabled, children }: SectionPartProps) {
  const inside = use(AccordionPartsContext);
  const level = useHeadingLevel();
  if (!inside) return null;
  return (
    <AccordionItem value={value} disabled={disabled === true}>
      <AccordionHeader level={level}>
        <AccordionTrigger>{title}</AccordionTrigger>
      </AccordionHeader>
      <AccordionPanel>{children}</AccordionPanel>
    </AccordionItem>
  );
}

/** Client implementations of the server-safe built-in vocabulary. */
export const compositionComponents = {
  ...formsComponents,
  ...actionsComponents,
  ...dataComponents,
  ...resultsComponents,
  ...feedbackComponents,
  Stack: StackFacade,
  Grid: GridFacade,
  Card: CardFacade,
  Image: ImageFacade,
  Heading: HeadingPart,
  Text: TextPart,
  List: ListPart,
  Item: ItemPart,
  Form: FormPart,
  Button: ButtonPart,
  Link: LinkPart,
  Select: SelectPart,
  Option: OptionPart,
  Tabs: TabsPart,
  TabList: TabListPart,
  Tab: TabPart,
  TabPanel: TabPanelPart,
  Accordion: AccordionPart,
  Section: SectionPart,
  Disclosure: DisclosureFacade,
};
