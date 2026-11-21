import { createCollection, type Collection, type CollectionItem } from "@comp0/core";
import { type OrderedCollectionSeed } from "./collection-pass.js";

/**
 * A collection whose items read their own place in document order. Items register into its
 * collection; their positions are read from document order once per change and cached, so each
 * item's snapshot is an O(1) lookup that stays the same between notifications.
 */
export type OrderedCollection = {
  collection: Collection;
  subscribe: (listener: () => void) => () => void;
  /** The registered item's 0-based index in document order. */
  position: (key: string) => number | undefined;
  /** How many items are registered. */
  size: () => number;
  /**
   * Checks the cached order after a commit, from the item `key`: when its element no longer
   * precedes the next cached item's, React moved items without a registration change (a keyed
   * reorder), so the cache is dropped and readers are notified. Only items that rendered call
   * it, so a reorder of memoized item elements, which renders no item, leaves the order stale.
   */
  verify: (key: string) => void;
};

/**
 * `seeds` answer on the server and while hydrating; once items have registered, their elements
 * are the source of truth, so every seed is cleared on the first read that finds one.
 */
export function createOrderedCollection(...seeds: OrderedCollectionSeed[]): OrderedCollection {
  const collection = createCollection();
  const listeners = new Set<() => void>();
  let order: CollectionItem[] | null = null;
  let positions = new Map<string, number>();
  const notify = () => {
    order = null;
    for (const listener of listeners) listener();
  };
  // The store owns its collection, so listening for the store's whole life leaks nothing.
  collection.subscribe(notify);
  const read = () => {
    if (order) return positions;
    // An item unmounting notifies in React's mutation phase, before React moves the items it
    // keeps, so this order can be stale until `verify` runs after the commit.
    order = collection.items();
    positions = new Map(order.map((item, index) => [item.key, index]));
    if (order.length > 0) {
      for (const seed of seeds) seed.clear();
    }
    return positions;
  };
  return {
    collection,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    position: (key) => read().get(key),
    size: () => read().size,
    verify(key) {
      if (!order) return;
      const index = positions.get(key);
      if (index === undefined) return;
      const element = order[index]?.element;
      const following = order[index + 1]?.element;
      if (!element || !following) return;
      if (element.compareDocumentPosition(following) & Node.DOCUMENT_POSITION_PRECEDING) notify();
    },
  };
}
