import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  use,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * The items a root's children will render, in render order, known before the real items render.
 * It only fills on the server and while hydrating; once an item registers its element, the
 * DOM-ordered collection is the source of truth and the seed is cleared.
 */
export type CollectionSeed = {
  /** Records an item; a key already recorded keeps its first position. */
  add: (key: string, disabled: boolean) => void;
  /**
   * The first of `preferred` that is recorded and enabled, else the first enabled item, or
   * `null` while nothing is recorded. A fallback answer is kept: an item that streams in later
   * (a Suspense boundary that suspended on the server) cannot take the stop from an item whose
   * HTML was already sent, so server HTML never holds two stops.
   */
  resolve: (preferred: readonly string[]) => string | null;
  clear: () => void;
};

function createCollectionSeed(): CollectionSeed {
  const disabledByKey = new Map<string, boolean>();
  let fallback = "";
  const isEnabled = (key: string) => disabledByKey.get(key) === false;
  return {
    add(key, disabled) {
      if (!disabledByKey.has(key)) disabledByKey.set(key, disabled);
    },
    resolve(preferred) {
      if (disabledByKey.size === 0) return null;
      if (fallback) return fallback;
      const key = preferred.find(isEnabled);
      if (key) return key;
      for (const [candidate, disabled] of disabledByKey) {
        if (disabled) continue;
        fallback = candidate;
        break;
      }
      return fallback;
    },
    clear() {
      disabledByKey.clear();
      fallback = "";
    },
  };
}

/**
 * The same elements with every `ref` dropped, for the pass's copy of the children. The copy
 * unmounts after hydration, and React would then detach a ref it shares with the real element,
 * leaving the consumer's ref `null`. It reaches elements written in the children, not a ref a
 * consumer component forwards under another prop name.
 */
function withoutRefs(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode; ref?: unknown }>(child)) return child;
    const nested = child.props.children;
    if (nested === undefined || typeof nested === "function") {
      return cloneElement(child, { ref: null });
    }
    return cloneElement(child, { ref: null }, withoutRefs(nested));
  });
}

const CollectionPassContext = createContext<CollectionSeed | null>(null);
CollectionPassContext.displayName = "CollectionPassContext";

const subscribeToNothing = () => () => {};

/** True on the server and for a hydration render; false for every other render. */
function useIsHydrating() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
}

/** The seed a root resolves against before its items register. Pass it to the tab stop store. */
export function useCollectionSeed() {
  const [seed] = useState(createCollectionSeed);
  return seed;
}

/**
 * The collection pass, for the part that holds the items: render the result ahead of the part.
 * On the server and while hydrating it renders the same children once more, where items record
 * themselves in `seed` and render nothing, so the real items already know the whole collection.
 * A client-only mount renders no pass, and after hydration it unmounts.
 *
 * It sits beside the part, not inside it, so the part's own children are exactly what the
 * consumer passed: `as={Fragment}` still merges into its single child, and a custom `as`
 * component still receives the items as its children.
 */
export function useCollectionPass(seed: CollectionSeed, children: ReactNode) {
  const hydrating = useIsHydrating();
  if (!hydrating) return null;
  return (
    <CollectionPassContext value={seed}>
      {/* Holds whatever consumer elements sit between the root and its items. */}
      <div hidden>{withoutRefs(children)}</div>
    </CollectionPassContext>
  );
}

/** Whether this render is inside a collection pass, where parts render no elements. */
export function useIsCollectionPass() {
  return use(CollectionPassContext) !== null;
}

/**
 * For an item rendered inside a collection pass: records it in its own root's `seed`, unless it
 * is not `present` (an option an Autocomplete filter hides). An item reached through another
 * root's pass (a composite nested between that root and its items) records nothing. Either way
 * the item renders nothing.
 */
export function useCollectedItem(
  seed: CollectionSeed,
  key: string,
  disabled: boolean | undefined,
  present = true,
) {
  const pass = use(CollectionPassContext);
  // A render-time write, which is why the pass only exists on the server and while hydrating,
  // where a discarded render is replayed with the same items. Recording is idempotent per key.
  // The order is render order, which on the server is not always document order: it renders
  // past a component that suspends and comes back to it. `useHydrationRepair` covers the
  // difference that makes between server HTML and the hydrated DOM.
  if (pass === seed && present) seed.add(key, Boolean(disabled));
}

/**
 * For an item's real render, before it reads the stop: records it in render order on the server
 * and while hydrating, unless it is not `present`. It covers what a pass cannot see: an item
 * whose key a separate pass cannot know (a Menubar trigger's id comes from its own Menu), and
 * items inside a Suspense boundary, which React hydrates after the pass is gone.
 */
export function useRenderOrderSeed(
  seed: CollectionSeed,
  key: string,
  disabled: boolean,
  present = true,
) {
  const hydrating = useIsHydrating();
  // A render-time write under the same limits as `useCollectedItem`.
  if (hydrating && present) seed.add(key, disabled);
}
