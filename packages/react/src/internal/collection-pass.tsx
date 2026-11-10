import {
  createContext,
  Fragment,
  use,
  useState,
  useSyncExternalStore,
  type ElementType,
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
 * The collection pass, for the part that holds the items. On the server and while hydrating it
 * renders the same children once more ahead of the real ones, where items record themselves in
 * `seed` and render nothing, so the real items already know the whole collection. A client-only
 * mount renders no pass, and after hydration it unmounts.
 *
 * Render `before` ahead of the part and `content` as the part's children. The pass normally
 * sits inside the part; `as={Fragment}` merges the part into its single child, so there it goes
 * before the part instead.
 */
export function useCollectionPass(
  seed: CollectionSeed,
  children: ReactNode,
  as: ElementType | undefined,
) {
  const hydrating = useIsHydrating();
  let pass: ReactNode = null;
  if (hydrating) {
    pass = (
      <CollectionPassContext value={seed}>
        {/* Holds whatever consumer elements sit between the root and its items. */}
        <div hidden>{children}</div>
      </CollectionPassContext>
    );
  }
  if (as === Fragment) return { before: pass, content: children };
  return {
    before: null,
    content: (
      <>
        {pass}
        {children}
      </>
    ),
  };
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
  // A render-time write, which is why the pass only exists where a render runs once in order
  // (the server) or replays that order (hydration). Recording is idempotent per key.
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
