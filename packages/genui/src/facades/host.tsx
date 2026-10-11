import { useEffect, useSyncExternalStore } from "react";
import { resolveStepValue } from "../bridge/steps.js";
import { bindingNamePattern } from "../catalog/schema.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import { useGenUI } from "../render/context.js";
import { asText } from "../safe.js";
import { queryProps, slotProps } from "./host.props.js";

/** How long a query waits for its arguments to stop changing, such as while a slider moves. */
const settleMilliseconds = 250;

/**
 * Calls a host tool and stores its result under `into`, again whenever a bound argument changes.
 * It draws nothing: components bound to `into` show the result. It waits for the response to
 * finish streaming, so it never runs with half-written arguments.
 */
export function QueryFacade({ tool, args, into }: CatalogProps<typeof queryProps>) {
  const { store, bindings, call, streaming } = useGenUI();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const read = (name: string) => (Object.hasOwn(state, name) ? state[name] : bindings.get(name));
  // Semantic identity: the arguments are rebuilt on every render, so the effect depends on their
  // JSON text and runs only when a value they read changes.
  const argsText = JSON.stringify(resolveStepValue(args ?? {}, read));
  const toolName = asText(tool);
  const target = asText(into);
  useEffect(() => {
    if (streaming || call === undefined || toolName === "") return;
    if (!bindingNamePattern.test(target)) return;
    let current = true;
    const timer = setTimeout(() => {
      void call(toolName, JSON.parse(argsText)).then((result) => {
        if (current && result.ok) store.set(target, result.value);
      });
    }, settleMilliseconds);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [call, store, streaming, toolName, target, argsText]);
  return null;
}

/** Places one of the host's own views, by name. A name the host does not offer draws nothing. */
export function SlotFacade({ name }: CatalogProps<typeof slotProps>) {
  const { slots } = useGenUI();
  const key = asText(name);
  return Object.hasOwn(slots, key) ? slots[key] : null;
}

export const hostEntries = [
  defineEntry({
    name: "Query",
    group: "Host",
    description:
      "Calls one of the host's tools and stores the result under a name, again whenever a bound argument changes, without asking the assistant. Draws nothing: bind a chart's data, a table's rows, or a list's items to the name to show the result. Requires tool and into.",
    props: queryProps,
    component: QueryFacade,
  }),
  defineEntry({
    name: "Slot",
    group: "Host",
    description:
      "Places one of the host's own views, such as a live preview, by name. The host's views read values bound by your controls. Requires name.",
    props: slotProps,
    component: SlotFacade,
  }),
];
