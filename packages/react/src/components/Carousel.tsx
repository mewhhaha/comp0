import { useCallback, useEffect, useState, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { CarouselContext } from "./carousel-shared.js";

export type CarouselProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  /** Controlled index of the current slide. */
  index?: number | undefined;
  /** Initial slide index when uncontrolled. */
  defaultIndex?: number | undefined;
  /** Receives the next slide index. */
  onChange?: ((index: number) => void) | undefined;
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
  index,
  defaultIndex = 0,
  onChange,
  loop,
  autoplay,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: CarouselProps & RefProp<HTMLElement>) {
  const [currentIndex, setCurrentIndex] = useControllableState({
    value: index,
    defaultValue: defaultIndex,
    onChange,
  });
  const [slides, setSlides] = useState<HTMLElement[]>([]);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // The registration identity feeds a layout-effect dependency in every
  // CarouselSlide; useCallback keeps slides from unregistering mid-render.
  const registerSlide = useCallback((element: HTMLElement) => {
    setSlides((current) => {
      if (current.includes(element)) return current;
      return [...current, element].sort((a, b) => {
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return -1;
      });
    });
    return () => {
      setSlides((current) => current.filter((entry) => entry !== element));
    };
  }, []);

  const count = slides.length;
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

  return (
    <CarouselContext
      value={{
        index: currentIndex,
        count,
        loop: resolvedLoop,
        autoplay,
        rotating,
        stopped,
        slides,
        registerSlide,
        setIndex: setCurrentIndex,
        previous,
        next,
        toggleStopped: () => setStopped((current) => !current),
      }}
    >
      <section
        {...props}
        ref={ref}
        role="group"
        aria-roledescription="carousel"
        data-rotating={dataAttr(rotating)}
        data-stopped={dataAttr(stopped)}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (!event.defaultPrevented) setHovered(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (!event.defaultPrevented) setFocused(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (event.defaultPrevented) return;
          const to = event.relatedTarget as Node | null;
          if (to && event.currentTarget.contains(to)) return;
          setFocused(false);
        }}
      />
    </CarouselContext>
  );
}
