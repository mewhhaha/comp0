import { createContext, useContext } from "react";

export interface CarouselContextValue {
  /** The active slide index. */
  index: number;
  /** How many slides are registered, in DOM order. */
  count: number;
  loop: boolean;
  /** Milliseconds between automatic advances; undefined when rotation is manual only. */
  autoplay: number | undefined;
  /** Whether auto-rotation is advancing right now (autoplay set, not stopped, hovered, or focused). */
  rotating: boolean;
  /** Whether the explicit autoplay toggle has stopped rotation until toggled back on. */
  stopped: boolean;
  slides: HTMLElement[];
  /** Adds a slide, kept sorted in document order; returns its unregister. */
  registerSlide: (element: HTMLElement) => () => void;
  setIndex: (index: number) => void;
  previous: () => void;
  next: () => void;
  toggleStopped: () => void;
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarouselContext(part: string) {
  const context = useContext(CarouselContext);
  if (!context) throw new Error(`${part} must be rendered inside Carousel.`);
  return context;
}
