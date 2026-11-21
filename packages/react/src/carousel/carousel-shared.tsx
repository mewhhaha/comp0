import { useSyncExternalStore } from "react";
import { type OrderedCollectionSeed } from "../internal/collection-pass.js";
import { createRequiredContext } from "../internal/context.js";
import { type OrderedCollection } from "../internal/ordered-collection.js";

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
  slides: OrderedCollection;
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
