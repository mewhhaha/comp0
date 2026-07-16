import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Carousel, type CarouselProps } from "./components/Carousel.js";
import { CarouselAutoplayToggle } from "./components/CarouselAutoplayToggle.js";
import { CarouselNext } from "./components/CarouselNext.js";
import { CarouselPrevious } from "./components/CarouselPrevious.js";
import { CarouselSlide } from "./components/CarouselSlide.js";
import { CarouselViewport } from "./components/CarouselViewport.js";

// React synthesizes onPointerEnter and onPointerLeave from pointerover and
// pointerout crossings, so hover simulation dispatches those primitives.
function hoverStart(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  });
}

function hoverEnd(element: Element) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent("pointerout", { bubbles: true, relatedTarget: document.body }),
    );
  });
}

function App(props: Partial<CarouselProps> = {}) {
  return (
    <Carousel aria-label="Featured recipes" {...props}>
      <CarouselAutoplayToggle />
      <CarouselPrevious />
      <CarouselNext />
      <CarouselViewport>
        <CarouselSlide>Soup</CarouselSlide>
        <CarouselSlide>Salad</CarouselSlide>
        <CarouselSlide>Stew</CarouselSlide>
      </CarouselViewport>
    </Carousel>
  );
}

function renderCarousel(props: Partial<CarouselProps> = {}) {
  const result = render(<App {...props} />);
  const root = result.container.querySelector<HTMLElement>("section")!;
  const viewport = result.container.querySelector<HTMLElement>("[aria-live]")!;
  const slides = [
    ...result.container.querySelectorAll<HTMLElement>("[aria-roledescription='slide']"),
  ];
  const previous = result.container.querySelector<HTMLButtonElement>(
    "[aria-label='Previous slide']",
  )!;
  const next = result.container.querySelector<HTMLButtonElement>("[aria-label='Next slide']")!;
  return { ...result, root, viewport, slides, previous, next };
}

function currentLabels(slides: HTMLElement[]) {
  return slides.map((slide) => slide.hasAttribute("data-current"));
}

describe("carousel composition", () => {
  it("renders the APG roles, roledescriptions, and N of M slide labels", () => {
    const { root, slides, viewport } = renderCarousel();
    expect(root.getAttribute("role")).toBe("group");
    expect(root.getAttribute("aria-roledescription")).toBe("carousel");
    expect(root.getAttribute("aria-label")).toBe("Featured recipes");
    expect(slides).toHaveLength(3);
    expect(slides.map((slide) => slide.getAttribute("role"))).toEqual(["group", "group", "group"]);
    expect(slides.map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 3",
      "2 of 3",
      "3 of 3",
    ]);
    expect(currentLabels(slides)).toEqual([true, false, false]);
    expect(slides.map((slide) => slide.getAttribute("aria-hidden"))).toEqual([
      null,
      "true",
      "true",
    ]);
    expect(slides.map((slide) => slide.hasAttribute("inert"))).toEqual([false, true, true]);
    expect(viewport.style.getPropertyValue("--comp0-carousel-index")).toBe("0");
  });

  it("prefers an explicit slide aria-label over the computed position", () => {
    const { container } = render(
      <Carousel aria-label="Featured recipes">
        <CarouselViewport>
          <CarouselSlide aria-label="Tomato soup">Soup</CarouselSlide>
          <CarouselSlide>Salad</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    const slides = [...container.querySelectorAll<HTMLElement>("[aria-roledescription='slide']")];
    expect(slides[0]!.getAttribute("aria-label")).toBe("Tomato soup");
    expect(slides[1]!.getAttribute("aria-label")).toBe("2 of 2");
  });

  it("moves with next and previous and disables them at the bounds", () => {
    const { slides, previous, next, viewport } = renderCarousel();
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    fireClick(next);
    expect(currentLabels(slides)).toEqual([false, true, false]);
    expect(slides.map((slide) => slide.hasAttribute("inert"))).toEqual([true, false, true]);
    expect(viewport.style.getPropertyValue("--comp0-carousel-index")).toBe("1");
    expect(previous.disabled).toBe(false);

    fireClick(next);
    expect(currentLabels(slides)).toEqual([false, false, true]);
    expect(next.disabled).toBe(true);

    fireClick(previous);
    expect(currentLabels(slides)).toEqual([false, true, false]);
  });

  it("wraps around the bounds with loop and never disables the buttons", () => {
    const { slides, previous, next } = renderCarousel({ loop: true });
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(false);

    fireClick(previous);
    expect(currentLabels(slides)).toEqual([false, false, true]);

    fireClick(next);
    expect(currentLabels(slides)).toEqual([true, false, false]);
  });

  it("starts on defaultIndex and reports changes when uncontrolled", () => {
    const onChange = vi.fn();
    const { slides, next } = renderCarousel({ defaultIndex: 1, onChange });
    expect(currentLabels(slides)).toEqual([false, true, false]);

    fireClick(next);
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(currentLabels(slides)).toEqual([false, false, true]);
  });

  it("respects a controlled index", () => {
    const onChange = vi.fn();
    const { slides, next, rerender } = renderCarousel({ index: 0, onChange });

    fireClick(next);
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(currentLabels(slides)).toEqual([true, false, false]);

    rerender(<App index={2} onChange={onChange} />);
    expect(currentLabels(slides)).toEqual([false, false, true]);
  });

  it("omits the autoplay toggle when the carousel has no autoplay", () => {
    const { container } = renderCarousel();
    expect(container.querySelector("[aria-label='Pause carousel']")).toBeNull();
  });

  describe("autoplay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("advances cyclically on the interval and keeps aria-live off while rotating", () => {
      const { slides, viewport } = renderCarousel({ autoplay: 500 });
      expect(viewport.getAttribute("aria-live")).toBe("off");

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([false, true, false]);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([false, false, true]);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([true, false, false]);
    });

    it("pauses while hovered and resumes with polite announcements flipped back off", () => {
      const { root, slides, viewport } = renderCarousel({ autoplay: 500 });

      hoverStart(root);
      expect(viewport.getAttribute("aria-live")).toBe("polite");
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(currentLabels(slides)).toEqual([true, false, false]);

      hoverEnd(root);
      expect(viewport.getAttribute("aria-live")).toBe("off");
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([false, true, false]);
    });

    it("pauses while focus is inside the carousel", () => {
      const { container, slides, viewport } = renderCarousel({ autoplay: 500 });
      const next = container.querySelector<HTMLButtonElement>("[aria-label='Next slide']")!;

      act(() => {
        next.focus();
      });
      expect(viewport.getAttribute("aria-live")).toBe("polite");
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(currentLabels(slides)).toEqual([true, false, false]);

      act(() => {
        next.blur();
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([false, true, false]);
    });

    it("stops through the toggle and stays stopped until toggled back on", () => {
      const { container, slides, viewport } = renderCarousel({ autoplay: 500 });
      const toggle = container.querySelector<HTMLButtonElement>("[aria-label='Pause carousel']")!;

      fireClick(toggle);
      expect(toggle.getAttribute("aria-label")).toBe("Play carousel");
      expect(toggle.hasAttribute("data-stopped")).toBe(true);
      expect(viewport.getAttribute("aria-live")).toBe("polite");
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(currentLabels(slides)).toEqual([true, false, false]);

      fireClick(toggle);
      expect(toggle.getAttribute("aria-label")).toBe("Pause carousel");
      expect(viewport.getAttribute("aria-live")).toBe("off");
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(currentLabels(slides)).toEqual([false, true, false]);
    });
  });
});
