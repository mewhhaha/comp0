import { useMemo, useRef } from "react";
import { useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { AccordionContext } from "./accordion-shared.js";
import { type AccordionProps, type AccordionTriggerRecord } from "./accordion-shared.js";
export type { AccordionProps } from "./accordion-shared.js";

function valueToSet(value: string | string[]) {
  if (Array.isArray(value)) return new Set(value);
  if (value) return new Set([value]);
  return new Set<string>();
}

function sortTriggers(triggers: AccordionTriggerRecord[]) {
  return [...triggers].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return -1;
  });
}

export function Accordion({
  type = "single",
  value,
  defaultValue,
  onChange,
  collapsible = type === "multiple",
  ref,
  ...props
}: AccordionProps & RefProp<HTMLDivElement>) {
  const triggerMap = useRef(new Map<string, AccordionTriggerRecord>());
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? (type === "multiple" ? [] : ""),
    onChange,
  });
  const selectedKeys = valueToSet(currentValue);

  const context = useMemo(
    () => ({
      type,
      selectedKeys,
      collapsible,
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
      registerTrigger(key: string, element: HTMLButtonElement | null, disabled?: boolean) {
        if (element) triggerMap.current.set(key, { key, element, disabled });
        else triggerMap.current.delete(key);
      },
      triggers() {
        return sortTriggers([...triggerMap.current.values()]);
      },
    }),
    [collapsible, currentValue, selectedKeys, setCurrentValue, type],
  );

  return (
    <AccordionContext.Provider value={context}>
      <div {...props} ref={ref} data-slot={dataSlot(props, "accordion")} />
    </AccordionContext.Provider>
  );
}
