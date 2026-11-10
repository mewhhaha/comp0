import {
  createContext,
  use,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * The items a root's children will render, in render order, known before the real items render.
 * It exists only on the server and while hydrating; once items register their elements, the
 * DOM-ordered collection is the source of truth and the seed is cleared.
 */
export type CollectionSeed = {
  /** Records an item; a key already recorded keeps its first position. */
  add: (key: string, disabled: boolean) => void;
  /** Whether `key` was recorded and is not disabled. */
  isEnabled: (key: string) => boolean;
  /** The first recorded item that is not disabled, or "". */
  firstEnabled: () => string;
  size: () => number;
  clear: () => void;
};

function createCollectionSeed(): CollectionSeed {
  const disabledByKey = new Map<string, boolean>();
  return {
    add(key, disabled) {
      if (!disabledByKey.has(key)) disabledByKey.set(key, disabled);
    },
    isEnabled(key) {
      return disabledByKey.get(key) === false;
    },
    firstEnabled() {
      for (const [key, disabled] of disabledByKey) {
        if (!disabled) return key;
      }
      return "";
    },
    size() {
      return disabledByKey.size;
    },
    clear() {
      disabledByKey.clear();
    },
  };
}

const CollectionPassContext = createContext<CollectionSeed | null>(null);
CollectionPassContext.displayName = "CollectionPassContext";

const subscribeToNothing = () => () => {};

/** True on the server and for the hydration render; false for every render after it. */
function useIsHydrating() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
}

/**
 * The seed a root resolves against before its items register. Pass it to the root's tab stop
 * store; it is cleared once the items have registered their elements.
 */
export function useCollectionSeed() {
  const [seed] = useState(createCollectionSeed);
  // Item registration runs in the items' own ref callbacks and layout effects, before this one.
  useLayoutEffect(() => {
    seed.clear();
  }, [seed]);
  return seed;
}

/**
 * The collection pass, for the part that holds the items: render the result before the real
 * `children`. On the server and while hydrating it renders the same children once more, where
 * items record themselves in `seed` and render nothing, so the real items after it already know
 * the whole collection. A client-only mount renders no pass, and after hydration it unmounts.
 */
export function useCollectionPass(seed: CollectionSeed, children: ReactNode) {
  const hydrating = useIsHydrating();
  if (!hydrating) return null;
  return (
    <CollectionPassContext value={seed}>
      {/* Holds whatever consumer elements sit between the root and its items. */}
      <div hidden>{children}</div>
    </CollectionPassContext>
  );
}

/**
 * For an item whose key cannot be known to a separate pass (a Menubar trigger's id comes from
 * its own Menu instance) and whose root has no selection: records the item as it renders for
 * real, on the server and while hydrating. The stop is then the first enabled item, which never
 * depends on the items after it. Call it before reading the stop.
 */
export function useRenderOrderSeed(seed: CollectionSeed, key: string, disabled: boolean) {
  const hydrating = useIsHydrating();
  // A render-time write, limited to where a render runs once in order (the server) or replays
  // that order (hydration). Recording is idempotent per key.
  if (hydrating) seed.add(key, disabled);
}

/**
 * For an item: records it when rendered inside a collection pass and returns true, in which
 * case the item renders nothing.
 */
export function useCollectedItem(key: string, disabled: boolean | undefined) {
  const seed = use(CollectionPassContext);
  if (!seed) return false;
  // A render-time write, which is why the pass only exists where a render runs once in order
  // (the server) or replays that order (hydration). Recording is idempotent per key.
  seed.add(key, Boolean(disabled));
  return true;
}

/** For a part between the root and its items: whether to render only its children. */
export function useIsCollectionPass() {
  return use(CollectionPassContext) !== null;
}
