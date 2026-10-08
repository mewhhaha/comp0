import { type ReactNode } from "react";
import { useCollection, useControllableState } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { AccordionContext } from "./accordion-shared.js";

type AccordionValue = string | string[];

type SingleAccordionProps = {
  type?: "single" | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next expanded item value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  collapsible?: boolean | undefined;
  children?: ReactNode | undefined;
};

type MultipleAccordionProps = {
  type: "multiple";
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  collapsible?: never;
  children?: ReactNode | undefined;
};

function valueToSet(value: string | string[]) {
  if (Array.isArray(value)) return new Set(value);
  if (value) return new Set([value]);
  return new Set<string>();
}

export type AccordionProps = RootProps<SingleAccordionProps | MultipleAccordionProps>;

export function Accordion({
  as,
  children,
  type = "single",
  value,
  defaultValue,
  onChange,
  collapsible: collapsibleProp,
  ...props
}: AccordionProps) {
  const collection = useCollection();
  let collapsible = collapsibleProp;
  if (collapsible === undefined) collapsible = type === "multiple";
  let initialValue: AccordionValue = "";
  if (type === "multiple") initialValue = [];
  if (defaultValue !== undefined) initialValue = defaultValue;
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: initialValue,
    onChange: onChange as ((value: AccordionValue) => void) | undefined,
  });
  const selectedKeys = valueToSet(currentValue);

  const context = {
    type,
    selectedKeys,
    collapsible,
    collection,
    setItemOpen(key: string, open: boolean) {
      if (type === "multiple") {
        const nextKeys = valueToSet(currentValue);
        if (open) nextKeys.add(key);
        else nextKeys.delete(key);
        setCurrentValue([...nextKeys]);
        return;
      }

      if (open) {
        setCurrentValue(key);
        return;
      }

      if (collapsible) setCurrentValue("");
    },
  };

  const Root = rootElement(as);
  return (
    <AccordionContext value={context}>
      <Root {...props} data-slot={dataSlot(props, "accordion")} data-orientation="vertical">
        {children}
      </Root>
    </AccordionContext>
  );
}
