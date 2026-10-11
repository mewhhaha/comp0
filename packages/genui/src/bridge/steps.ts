import { bindingNamePattern, maxBindingName } from "../catalog/schema.js";
import { evaluateExpression } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";
import { useGenUI, type GenUIAction } from "../render/context.js";

/**
 * One step of an action, as the model writes it. A step does one thing:
 * `{ "call": tool, "args": {...}, "into": name }` calls a host tool and stores its result,
 * `{ "set": name, "value": ... }` stores a value, and `{ "send": text }` asks the assistant.
 * Values in `args` and `value` may be `{ "$bind": name }` or `{ "$expr": "..." }`, read when the
 * step runs.
 */
export type ActionStep = {
  call?: string | null | undefined;
  args?: unknown;
  into?: string | null | undefined;
  set?: string | null | undefined;
  value?: unknown;
  send?: string | null | undefined;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isName(value: unknown): value is string {
  return (
    typeof value === "string" && value.length <= maxBindingName && bindingNamePattern.test(value)
  );
}

/** Resolves `$bind` and `$expr` in step JSON against the current values. */
export function resolveStepValue(value: unknown, read: (name: string) => unknown): JsonValue {
  if (isRecord(value) && typeof value.$bind === "string") {
    const bound = read(value.$bind);
    return bound === undefined ? null : (bound as JsonValue);
  }
  if (isRecord(value) && typeof value.$expr === "string")
    return evaluateExpression(value.$expr, read);
  if (Array.isArray(value)) return value.map((item) => resolveStepValue(item, read));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveStepValue(item, read)]),
    );
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return null;
}

/** What running an action's steps came to. */
export type StepsResult = { ok: true } | { ok: false; error: string };

/**
 * Runs an action's steps in order and stops at the first that fails. Steps read and write the
 * store directly, so a tool's result shows up in every component bound to its name without a
 * round trip to the model.
 */
export function useActionSteps() {
  const { store, bindings, call, act } = useGenUI();
  const read = (name: string) => store.get(name) ?? bindings.get(name);
  return async (
    steps: readonly ActionStep[],
    origin: Omit<GenUIAction, "message">,
  ): Promise<StepsResult> => {
    for (const step of steps) {
      if (typeof step.call === "string") {
        if (call === undefined) return { ok: false, error: "This app does not offer tools." };
        // In a form, a call without args sends the form's values by control name.
        const args =
          step.args === undefined && origin.values !== undefined
            ? origin.values
            : resolveStepValue(step.args ?? {}, read);
        const result = await call(step.call, args);
        if (!result.ok) return { ok: false, error: result.error };
        if (isName(step.into)) store.set(step.into, result.value);
      } else if (isName(step.set)) {
        store.set(step.set, resolveStepValue(step.value ?? null, read));
      } else if (typeof step.send === "string" && step.send.trim() !== "") {
        act({ ...origin, message: step.send });
      }
    }
    return { ok: true };
  };
}
