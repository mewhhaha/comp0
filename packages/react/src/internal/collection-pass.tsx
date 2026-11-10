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
 * A root's handle on the collection pass. Render `pass` before the element that holds the real
 * children: on the server and while hydrating it renders the same children once more, where
 * items record themselves in `seed` and render nothing, so the real items after it already know
 * the whole collection. A client-only mount renders no pass, and after hydration it unmounts.
 */
export function useCollectionPass(children: ReactNode) {
  const [seed] = useState(createCollectionSeed);
  const hydrating = useIsHydrating();
  // Item registration runs in the items' own layout effects, before this one.
  useLayoutEffect(() => {
    seed.clear();
  }, [seed]);
  let pass: ReactNode = null;
  if (hydrating) {
    pass = (
      <CollectionPassContext value={seed}>
        {/* Holds whatever consumer elements sit between the root and its items. */}
        <div hidden>{children}</div>
      </CollectionPassContext>
    );
  }
  return { seed, pass };
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
