import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type CarouselContextValue = {
  /** The active slide index. */
  value: number;
  /** How many slides are registered, in DOM order. */
  count: number;
  loop: boolean;
  /** Milliseconds between automatic advances; undefined when rotation is manual only. */
  autoplay: number | undefined;
  /** Whether auto-rotation is advancing right now (autoplay set, not stopped, hovered, or focused). */
  rotating: boolean;
  /** Whether the explicit autoplay toggle has stopped rotation until toggled back on. */
  stopped: boolean;
  /** Registered slides; slides read their position from `order`. */
  collection: Collection;
  /** Slide keys in document order. */
  order: readonly string[];
  previous: () => void;
  next: () => void;
  toggleStopped: () => void;
};

export const [CarouselContext, useCarouselContext] =
  createRequiredContext<CarouselContextValue>("Carousel");
