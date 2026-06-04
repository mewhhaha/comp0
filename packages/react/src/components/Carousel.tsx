import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { CarouselContext, sortSlides } from "./carousel-shared.js";
import { type CarouselProps, type CarouselSlideRecord } from "./carousel-shared.js";
export type { CarouselProps } from "./carousel-shared.js";

function selectRelative(slides: CarouselSlideRecord[], selectedKey: string, direction: 1 | -1) {
  const enabledSlides = slides.filter((slide) => !slide.disabled);
  if (!enabledSlides.length) return "";
  const currentIndex = Math.max(
    0,
    enabledSlides.findIndex((slide) => slide.key === selectedKey),
  );
  const nextIndex = (currentIndex + direction + enabledSlides.length) % enabledSlides.length;
  return enabledSlides[nextIndex]?.key ?? enabledSlides[0]!.key;
}

export function Carousel({
  value,
  defaultValue = "",
  onChange,
  autoRotate = false,
  interval = 5000,
  onFocusCapture,
  onPointerEnter,
  ref,
  ...props
}: CarouselProps & RefProp<HTMLDivElement>) {
  const slideMap = useRef(new Map<string, CarouselSlideRecord>());
  const [, setVersion] = useState(0);
  const [rotating, setRotating] = useState(autoRotate);
  const [currentValue, setCurrentValue] = useControllableState({ value, defaultValue, onChange });

  const slides = useCallback(() => sortSlides([...slideMap.current.values()]), []);
  const registerSlide = useCallback(
    (key: string, element: HTMLElement | null, disabled?: boolean) => {
      const previous = slideMap.current.get(key);
      if (element) {
        if (previous?.element === element && previous.disabled === disabled) return;
        slideMap.current.set(key, { key, element, disabled });
        setVersion((current) => current + 1);
        return;
      }

      if (!previous) return;
      slideMap.current.delete(key);
      setVersion((current) => current + 1);
    },
    [],
  );
  const selectedKey = currentValue || slides().find((slide) => !slide.disabled)?.key || "";

  const context = useMemo(
    () => ({
      selectedKey,
      rotating,
      setRotating,
      select(key: string) {
        setCurrentValue(key);
      },
      previous() {
        const key = selectRelative(slides(), selectedKey, -1);
        if (key) setCurrentValue(key);
      },
      next() {
        const key = selectRelative(slides(), selectedKey, 1);
        if (key) setCurrentValue(key);
      },
      registerSlide,
      slides,
    }),
    [registerSlide, rotating, selectedKey, setCurrentValue, slides],
  );

  useEffect(() => {
    if (!rotating) return undefined;
    const timer = window.setInterval(() => context.next(), interval);
    return () => window.clearInterval(timer);
  }, [context, interval, rotating]);

  return (
    <CarouselContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role={props.role ?? "region"}
        aria-roledescription={props["aria-roledescription"] ?? "carousel"}
        data-rotating={dataAttr(rotating)}
        data-slot={dataSlot(props, "carousel")}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          if (!event.defaultPrevented) setRotating(false);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) setRotating(false);
        }}
      />
    </CarouselContext.Provider>
  );
}
