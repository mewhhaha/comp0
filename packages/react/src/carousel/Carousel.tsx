import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { useCollectionPass, useCollectionSeed } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { CarouselContext, createCarouselSlides } from "./carousel-shared.js";

export type CarouselProps = Omit<ComponentProps<"section">, "defaultValue" | "onChange" | "value"> &
  AsProp & {
    /** Controlled index of the current slide. */
    value?: number | undefined;
    /** Initial slide index when uncontrolled. */
    defaultValue?: number | undefined;
    /** Receives the next slide index. */
    onChange?: ((value: number) => void) | undefined;
    /** Previous on the first slide and Next on the last wrap around. */
    loop?: boolean | undefined;
    /** Milliseconds between automatic advances; omit for a manually rotated carousel. */
    autoplay?: number | undefined;
  };

/**
 * APG grouped carousel root. Needs an accessible name: pass aria-label (or
 * aria-labelledby) naming the content, such as "Featured articles". With
 * autoplay set, rotation advances cyclically but pauses while the pointer is
 * over the carousel or focus is inside it, and CarouselAutoplayToggle stops
 * it until pressed again (WCAG 2.2.2). Slides register in document order, so
 * each announces its "N of M" position automatically.
 */
export function Carousel({
  as,
  value,
  defaultValue = 0,
  onChange,
  loop,
  autoplay,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  children,
  ...props
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const seed = useCollectionSeed();
  const renderOrder = useCollectionSeed();
  const [slides] = useState(() => createCarouselSlides(seed, renderOrder));
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // The root renders ahead of its collection pass, so on the server and while hydrating it knows
  // no slides yet and does not rotate; the parts that render the count read it after the pass.
  const count = useSyncExternalStore(slides.subscribe, slides.size, () => 0);
  const resolvedLoop = Boolean(loop);
  const rotating = Boolean(autoplay) && !stopped && !hovered && !focused && count > 1;

  useEffect(() => {
    if (!rotating || !autoplay) return;
    const id = window.setInterval(() => {
      // Auto-rotation is cyclic regardless of loop, matching APG carousels.
      setCurrentIndex((current) => (current + 1) % count);
    }, autoplay);
    return () => window.clearInterval(id);
  }, [rotating, autoplay, count, setCurrentIndex]);

  const next = () => {
    if (count === 0) return;
    if (currentIndex < count - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    if (resolvedLoop) setCurrentIndex(0);
  };

  const previous = () => {
    if (count === 0) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return;
    }
    if (resolvedLoop) setCurrentIndex(count - 1);
  };

  const pass = useCollectionPass(seed, children);
  const Part = partElement(as, "section");
  return (
    <CarouselContext
      value={{
        value: currentIndex,
        loop: resolvedLoop,
        autoplay,
        rotating,
        stopped,
        slides,
        seed,
        renderOrder,
        previous,
        next,
        toggleStopped: () => setStopped((current) => !current),
      }}
    >
      {pass}
      <Part
        {...props}
        role="group"
        aria-roledescription="carousel"
        data-rotating={dataAttr(rotating)}
        data-stopped={dataAttr(stopped)}
        onPointerEnter={(event: PointerEvent<HTMLElement>) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) setHovered(true);
        }}
        onPointerLeave={(event: PointerEvent<HTMLElement>) => {
          onPointerLeave?.(event);
          if (!event.defaultPrevented) setHovered(false);
        }}
        onFocus={(event: FocusEvent<HTMLElement>) => {
          onFocus?.(event);
          if (!event.defaultPrevented) setFocused(true);
        }}
        onBlur={(event: FocusEvent<HTMLElement>) => {
          onBlur?.(event);
          if (event.defaultPrevented) return;
          const to = event.relatedTarget as Node | null;
          if (to && event.currentTarget.contains(to)) return;
          setFocused(false);
        }}
      >
        {children}
      </Part>
    </CarouselContext>
  );
}
