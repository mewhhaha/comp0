import { useId, useLayoutEffect, useRef, useSyncExternalStore, type ComponentProps } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import {
  useCollectedItem,
  useIsCollectionPass,
  useRenderOrderSeed,
} from "../internal/collection-pass.js";
import { useHydrationRepair } from "../internal/hydration-repair.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useCarouselContext, useSlideCount } from "./carousel-shared.js";

const ignoreFocus = () => {};

function CarouselSlidePart({ as, ref, ...props }: CarouselSlideProps) {
  const carousel = useCarouselContext("CarouselSlide");
  const key = useId();
  // Read the stable registry outside the ref callback: depending on the whole context would
  // re-register every slide whenever the current slide moves, and each registration notifies.
  const { slides, renderOrder } = carousel;
  const { collection } = slides;
  // The pass's copy of this slide has another id, so the real slide's place on the server and
  // while hydrating is its render order, and the count is how many slides the pass saw.
  useRenderOrderSeed(renderOrder, key, false);
  const position = useSyncExternalStore(
    slides.subscribe,
    () => slides.position(key),
    () => renderOrder.position(key),
  );
  const count = useSlideCount(carousel);

  const ownLabel = props["aria-label"];
  let label = ownLabel;
  if (label === undefined && position !== undefined) label = `${position + 1} of ${count}`;
  const current = position !== undefined && position === carousel.value;

  const elementRef = useRef<HTMLElement | null>(null);
  // The position depends on the whole carousel, which the server can see in another order.
  useHydrationRepair(
    elementRef,
    {
      "aria-label": ownLabel === undefined ? label : undefined,
      "aria-hidden": current ? null : "true",
      "data-current": current ? "" : null,
      inert: current ? null : "",
    },
    ignoreFocus,
  );
  const slideRef = useComposedRefs(ref, elementRef, (element: HTMLElement | null) => {
    if (!element) return;
    collection.register({ key, textValue: "", element });
    // Guarded by element, so a stale cleanup never removes what a newer element registered
    // under this key.
    return () => {
      collection.unregister(key, element);
    };
  });
  // After every render, once React has moved the slides: a keyed reorder moves elements without
  // registering anything, so the cached order is checked against the DOM here, one pair per
  // slide, which is O(1) per slide and O(n) per commit. It only runs in slides that rendered: a
  // reorder of memoized slide elements renders none, so the order stays stale, as it did before.
  useLayoutEffect(() => {
    slides.verify(key);
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={slideRef}
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!current || undefined}
      inert={!current}
      data-current={dataAttr(current)}
    />
  );
}

export type CarouselSlideProps = ComponentProps<"div"> & AsProp;

/**
 * One slide of the carousel. Slides register themselves in document order, so
 * each is announced as "N of M" by default; pass aria-label to name a slide
 * after its content instead. The active slide carries data-current.
 */
export function CarouselSlide(props: CarouselSlideProps) {
  // Inside Carousel's collection pass the slide only records itself, so the real slides know
  // how many there are before they render.
  const carousel = useCarouselContext("CarouselSlide");
  const key = useId();
  const collecting = useIsCollectionPass();
  useCollectedItem(carousel.seed, key, false);
  if (collecting) return null;
  return <CarouselSlidePart {...props} />;
}
