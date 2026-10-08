import {
  useEffect,
  useLayoutEffect,
  useState,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { dataAttr, useCollection, useControllableState } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { CarouselContext } from "./carousel-shared.js";

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
  ...props
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const collection = useCollection();
  const [order, setOrder] = useState<string[]>([]);
  const [stopped, setStopped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Slides register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncOrder = () => {
      setOrder((previous) => {
        const next = collection.items().map((item) => item.key);
        if (next.length === previous.length && next.every((key, i) => key === previous[i])) {
          return previous;
        }
        return next;
      });
    };
    syncOrder();
    return collection.subscribe(syncOrder);
  }, [collection]);

  const count = order.length;
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

  const Part = partElement(as, "section");
  return (
    <CarouselContext
      value={{
        value: currentIndex,
        count,
        loop: resolvedLoop,
        autoplay,
        rotating,
        stopped,
        collection,
        order,
        previous,
        next,
        toggleStopped: () => setStopped((current) => !current),
      }}
    >
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
      />
    </CarouselContext>
  );
}
