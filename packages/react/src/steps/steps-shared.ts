import { type CollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { type OrderedCollection } from "../internal/ordered-collection.js";

/**
 * The values Steps' collection pass saw, for the server and hydration renders. A value recorded
 * again moves to the end, so duplicates answer as the client does: the collection is keyed by
 * value and the last duplicate's element is the registered one. Replaying the pass records the
 * same order again.
 */
export type StepsSeed = CollectionSeed & {
  /** The value's 0-based place among the recorded values, if recorded. */
  position: (value: string) => number | undefined;
};

export function createStepsSeed(): StepsSeed {
  const values = new Set<string>();
  let positions: Map<string, number> | null = null;
  return {
    add(value) {
      values.delete(value);
      values.add(value);
      positions = null;
    },
    // Steps has no tab stop, so nothing resolves against its seed.
    resolve: () => null,
    position(value) {
      positions ??= new Map([...values].map((recorded, index) => [recorded, index]));
      return positions.get(value);
    },
    clear() {
      values.clear();
      positions = null;
    },
  };
}

/** Where an item stands against the current step. */
export type StepStatus = "current" | "completed" | "upcoming";

/**
 * The uncontrolled current step, held outside React state so a change re-renders only the parts
 * whose answer changes instead of every part that reads the root's context. Each answer is a
 * primitive from O(1) position lookups. A controlled value is passed to `status` instead, from the
 * same render as the root, so no commit shows a value the root did not render.
 */
export type StepsStatus = {
  /** Notifies when the current step changes and when items register or move. */
  subscribe: (listener: () => void) => () => void;
  current: () => string;
  /** Moves the uncontrolled current step; notifies only when it differs. */
  setCurrent: (value: string) => void;
  /** The item's status from the registered items' document order, against `controlled` if set. */
  status: (value: string, controlled: string | undefined) => StepStatus;
  /** The same from the collection pass, on the server and while hydrating. */
  serverStatus: (value: string, controlled: string | undefined) => StepStatus;
};

function statusFrom(
  value: string,
  current: string,
  position: (key: string) => number | undefined,
): StepStatus {
  if (value === current) return "current";
  const own = position(value);
  const target = position(current);
  if (own !== undefined && target !== undefined && own < target) return "completed";
  return "upcoming";
}

export function createStepsStatus(
  items: OrderedCollection,
  seed: StepsSeed,
  initial: string,
): StepsStatus {
  const listeners = new Set<() => void>();
  let current = initial;
  return {
    subscribe(listener) {
      listeners.add(listener);
      const unsubscribeItems = items.subscribe(listener);
      return () => {
        listeners.delete(listener);
        unsubscribeItems();
      };
    },
    current: () => current,
    setCurrent(value) {
      if (value === current) return;
      current = value;
      for (const listener of listeners) listener();
    },
    status: (value, controlled) => statusFrom(value, controlled ?? current, items.position),
    serverStatus: (value, controlled) => statusFrom(value, controlled ?? current, seed.position),
  };
}

export type StepsContextValue = {
  baseId: string;
  /** Asks to make `value` the current step, through the root's `onChange`. */
  select: (value: string) => void;
  /** Registered items, keyed by value; each reads its place with `useSyncExternalStore`. */
  items: OrderedCollection;
  /** The values the collection pass saw, on the server and while hydrating: their places. */
  seed: StepsSeed;
  /** The uncontrolled current step; parts read their status from it with `useSyncExternalStore`. */
  status: StepsStatus;
  /**
   * The controlled value, undefined when uncontrolled. Parts read it in the same render as the
   * root, so a controlled change re-renders every part, as a value in context does.
   */
  value: string | undefined;
};

export const [StepsContext, useStepsContext] = createRequiredContext<StepsContextValue>("Steps");

export type StepsItemContextValue = {
  value: string;
  current: boolean;
  completed: boolean;
};

export const [StepsItemContext, useStepsItemContext] =
  createRequiredContext<StepsItemContextValue>("StepsItem");

export const stepsPairIds = (baseId: string, value: string) => ({
  itemId: `${baseId}-item-${value}`,
  panelId: `${baseId}-panel-${value}`,
});
