import { useSyncExternalStore } from "react";
import { createCollection, type Collection, type CollectionItem } from "@comp0/core";
import { type OrderedCollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";

/**
 * The carousel's registered slides. Slides register into its collection; their positions are
 * read from document order once per change and cached, so each slide's snapshot is an O(1)
 * lookup. Every slide also reads the count, so a registration change re-renders them all.
 */
export type CarouselSlides = {
  collection: Collection;
  subscribe: (listener: () => void) => () => void;
  /** The registered slide's 0-based index in document order. */
  position: (key: string) => number | undefined;
  /** How many slides are registered. */
  size: () => number;
  /**
   * Checks the cached order after a commit, from the slide `key`: when its element no longer
   * precedes the next cached slide's, React moved slides without a registration change (a keyed
   * reorder), so the cache is dropped and readers are notified. Only slides that rendered call
   * it, so a reorder of memoized slide elements, which renders no slide, leaves the order stale.
   */
  verify: (key: string) => void;
};

/**
 * `seed` and `renderOrder` answer on the server and while hydrating; once slides have
 * registered, their elements are the source of truth, so both are dropped.
 */
export function createCarouselSlides(
  seed: OrderedCollectionSeed,
  renderOrder: OrderedCollectionSeed,
): CarouselSlides {
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
    // A slide unmounting notifies in React's mutation phase, before React moves the slides it
    // keeps, so this order can be stale until `verify` runs after the commit.
    order = collection.items();
    positions = new Map(order.map((item, index) => [item.key, index]));
    if (order.length > 0) {
      seed.clear();
      renderOrder.clear();
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

export type CarouselContextValue = {
  /** The active slide index. */
  value: number;
  loop: boolean;
  /** Milliseconds between automatic advances; undefined when rotation is manual only. */
  autoplay: number | undefined;
  /** Whether auto-rotation is advancing right now (autoplay set, not stopped, hovered, or focused). */
  rotating: boolean;
  /** Whether the explicit autoplay toggle has stopped rotation until toggled back on. */
  stopped: boolean;
  /** Registered slides; parts read their position and count with `useSyncExternalStore`. */
  slides: CarouselSlides;
  /** The slides the collection pass saw, on the server and while hydrating: the count. */
  seed: OrderedCollectionSeed;
  /** The real slides in render order, on the server and while hydrating: each one's position. */
  renderOrder: OrderedCollectionSeed;
  previous: () => void;
  next: () => void;
  toggleStopped: () => void;
};

export const [CarouselContext, useCarouselContext] =
  createRequiredContext<CarouselContextValue>("Carousel");

/**
 * How many slides the carousel has: from the collection pass on the server and while
 * hydrating, then from registration.
 */
export function useSlideCount(carousel: CarouselContextValue) {
  const { slides, seed } = carousel;
  return useSyncExternalStore(slides.subscribe, slides.size, seed.size);
}
