import { useEffect, useSyncExternalStore } from "react";
import { evaluateExpression } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";
import { useGenUI } from "../render/context.js";
import { Binding, Computed } from "../validate/values.js";

/**
 * A control's value in the store. The person's edits win; until there are any, the value is the
 * binding's initial value or the model's literal one. Once the response is complete the default
 * is also written into the store, so the state a host saves and a form submit include it.
 *
 * `binding` is the raw prop of a control whose schema is `bindable()`. When the model wrote
 * `{ "$bind": name }` there, the value lives under that name, where expressions read it.
 */
export function useField<TValue extends JsonValue>(
  key: string,
  literal: TValue | undefined,
  binding?: unknown,
): {
  value: TValue | undefined;
  setValue: (value: TValue | null | undefined) => void;
  /** The state key the value is stored under. */
  key: string;
  /** The value shown until the person changes the control. */
  fallback: JsonValue | undefined;
} {
  const { store, streaming, bindings } = useGenUI();
  const bound = binding instanceof Binding ? binding : undefined;
  const stateKey = bound === undefined ? key : bound.name;
  let fallback: JsonValue | undefined = literal;
  if (bound !== undefined) fallback = bindings.get(bound.name) ?? bound.initial ?? literal;
  const stored = useSyncExternalStore(
    store.subscribe,
    () => store.get(stateKey),
    () => store.get(stateKey),
  );
  // Semantic identity: a default such as an array is rebuilt on every render, so the effect
  // depends on its JSON text instead of the object.
  const fallbackText = JSON.stringify(fallback);
  useEffect(() => {
    if (streaming || fallbackText === undefined) return;
    store.seed(stateKey, JSON.parse(fallbackText) as JsonValue);
  }, [store, streaming, stateKey, fallbackText]);
  return {
    value: (stored === undefined ? fallback : stored) as TValue | undefined,
    setValue: (value) => store.set(stateKey, value as JsonValue | undefined),
    key: stateKey,
    fallback,
  };
}

/**
 * The value of a prop that may be computed: a literal comes back unchanged, and a
 * `{ "$expr": ... }` is evaluated against the store and re-evaluated whenever a bound value
 * changes.
 */
export function useComputed(value: unknown): unknown {
  const { store, bindings } = useGenUI();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  if (!(value instanceof Computed)) return value;
  return evaluateExpression(value.expression, (name) =>
    Object.hasOwn(state, name) ? state[name] : bindings.get(name),
  );
}
