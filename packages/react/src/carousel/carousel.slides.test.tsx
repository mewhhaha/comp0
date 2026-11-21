import {
  act,
  Fragment,
  Profiler,
  StrictMode,
  Suspense,
  use,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireClick, render, setup } from "../../test/render.js";
import { Carousel, type CarouselProps } from "./Carousel.js";
import { CarouselNext } from "./CarouselNext.js";
import { CarouselPrevious } from "./CarouselPrevious.js";
import { CarouselSlide, type CarouselSlideProps } from "./CarouselSlide.js";
import { CarouselViewport } from "./CarouselViewport.js";

type SlideState = { label: string | null; current: boolean; hidden: string | null; inert: boolean };

function slideStates(slides: Iterable<Element>): SlideState[] {
  return [...slides].map((slide) => ({
    label: slide.getAttribute("aria-label"),
    current: slide.hasAttribute("data-current"),
    hidden: slide.getAttribute("aria-hidden"),
    inert: slide.hasAttribute("inert"),
  }));
}

const slidesIn = (container: Element) =>
  container.querySelectorAll("[aria-roledescription='slide']");

const labels = (container: Element) =>
  [...slidesIn(container)].map((slide) => slide.getAttribute("aria-label"));

const currentText = (container: Element) =>
  [...container.querySelectorAll("[data-current]")].map((slide) => slide.textContent);

function buttons(container: Element) {
  return {
    previous: container.querySelector<HTMLButtonElement>("[aria-label='Previous slide']")!,
    next: container.querySelector<HTMLButtonElement>("[aria-label='Next slide']")!,
  };
}

/** What every slide and both buttons should render for `count` slides at `value`. */
function expectedState(count: number, value: number, loop: boolean, own: (string | undefined)[]) {
  return {
    slides: Array.from({ length: count }, (_, index) => ({
      label: own[index] ?? `${index + 1} of ${count}`,
      current: index === value,
      hidden: index === value ? null : "true",
      inert: index !== value,
    })),
    previousDisabled: count === 0 || (!loop && value <= 0),
    nextDisabled: count === 0 || (!loop && value >= count - 1),
  };
}

function observedState(container: Element) {
  const { previous, next } = buttons(container);
  return {
    slides: slideStates(slidesIn(container)),
    previousDisabled: previous.disabled,
    nextDisabled: next.disabled,
  };
}

function Deck({ names, ...props }: Partial<CarouselProps> & { names: string[] }) {
  return (
    <Carousel aria-label="Deck" {...props}>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselViewport>
        {names.map((name) => (
          <CarouselSlide key={name}>{name}</CarouselSlide>
        ))}
      </CarouselViewport>
    </Carousel>
  );
}

// A consumer component between the viewport and the slide.
function Card(props: CarouselSlideProps) {
  return <CarouselSlide {...props} />;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("carousel slide positions on a client mount", () => {
  it("disables both buttons, renders no slide, and keeps autoplay idle with zero slides", () => {
    vi.useFakeTimers();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Deck names={[]} autoplay={100} />);

    expect(observedState(container)).toEqual(expectedState(0, 0, false, []));
    expect(container.querySelector("section")!.hasAttribute("data-rotating")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slidesIn(container)).toHaveLength(0);
    expect(errors).not.toHaveBeenCalled();
  });

  it("disables both buttons with zero slides even when the carousel loops", () => {
    const { container } = render(<Deck names={[]} loop />);
    expect(observedState(container)).toEqual(expectedState(0, 0, true, []));
  });

  it("labels a single slide 1 of 1, makes it current, and never rotates it", () => {
    vi.useFakeTimers();
    const { container } = render(<Deck names={["Only"]} autoplay={100} />);

    expect(observedState(container)).toEqual(expectedState(1, 0, false, []));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(currentText(container)).toEqual(["Only"]);
  });

  it("keeps an out-of-range value: no slide is current and the buttons follow the index", () => {
    const above = render(<Deck names={["A", "B", "C"]} value={5} />);
    expect(observedState(above.container)).toEqual(expectedState(3, 5, false, []));
    expect(currentText(above.container)).toEqual([]);

    const below = render(<Deck names={["A", "B", "C"]} value={-1} />);
    expect(observedState(below.container)).toEqual(expectedState(3, -1, false, []));
  });

  it("numbers slides wrapped in a consumer component and in a Fragment", () => {
    const { container } = render(
      <Carousel aria-label="Deck">
        <CarouselViewport>
          <Card>A</Card>
          <Fragment>
            <CarouselSlide>B</CarouselSlide>
            <Card>C</Card>
          </Fragment>
        </CarouselViewport>
      </Carousel>,
    );
    expect(labels(container)).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(currentText(container)).toEqual(["A"]);
  });

  it("counts slides inside a Suspense boundary once it resolves, in document order", async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    function Later({ children }: { children: ReactNode }) {
      use(promise);
      return children;
    }
    const deck = (
      <Carousel aria-label="Deck">
        <CarouselNext />
        <CarouselViewport>
          <CarouselSlide>A</CarouselSlide>
          <Suspense fallback={null}>
            <Later>
              <CarouselSlide>B</CarouselSlide>
              <CarouselSlide>C</CarouselSlide>
            </Later>
          </Suspense>
          <CarouselSlide>D</CarouselSlide>
        </CarouselViewport>
      </Carousel>
    );
    // A mount that suspends must be awaited, or act leaves the retry and the effects unflushed.
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(deck);
    });
    const { container } = view;
    expect(labels(container)).toEqual(["1 of 2", "2 of 2"]);

    await act(async () => {
      resolve();
      await promise;
    });
    expect([...slidesIn(container)].map((slide) => slide.textContent)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(labels(container)).toEqual(["1 of 4", "2 of 4", "3 of 4", "4 of 4"]);
    expect(buttons(container).next.disabled).toBe(false);
  });

  it("registers once per slide under StrictMode and moves with one click", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, user } = setup(
      <StrictMode>
        <Deck names={["A", "B", "C"]} />
      </StrictMode>,
    );
    expect(observedState(container)).toEqual(expectedState(3, 0, false, []));

    await user.click(buttons(container).next);
    expect(observedState(container)).toEqual(expectedState(3, 1, false, []));
    expect(errors).not.toHaveBeenCalled();
  });

  it("keeps a nested carousel's slides out of the outer count", async () => {
    const { container, user } = setup(
      <Carousel aria-label="Outer" data-probe="outer">
        <CarouselNext data-probe="outer-next" />
        <CarouselViewport>
          <CarouselSlide data-probe="outer-slide">
            <Carousel aria-label="Inner">
              <CarouselNext data-probe="inner-next" />
              <CarouselViewport>
                <CarouselSlide data-probe="inner-slide">x</CarouselSlide>
                <CarouselSlide data-probe="inner-slide">y</CarouselSlide>
                <CarouselSlide data-probe="inner-slide">z</CarouselSlide>
              </CarouselViewport>
            </Carousel>
          </CarouselSlide>
          <CarouselSlide data-probe="outer-slide">Second</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    const outer = container.querySelectorAll("[data-probe='outer-slide']");
    const inner = container.querySelectorAll("[data-probe='inner-slide']");
    expect([...outer].map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 2",
      "2 of 2",
    ]);
    expect(slideStates(inner)).toEqual(expectedState(3, 0, false, []).slides);

    await user.click(container.querySelector("[data-probe='inner-next']")!);
    expect(slideStates(inner)).toEqual(expectedState(3, 1, false, []).slides);
    expect(slideStates(outer)).toEqual(expectedState(2, 0, false, []).slides);

    await user.click(container.querySelector("[data-probe='outer-next']")!);
    expect(slideStates(outer)).toEqual(expectedState(2, 1, false, []).slides);
    expect(slideStates(inner)).toEqual(expectedState(3, 1, false, []).slides);
  });
});

describe("carousel slides that change while shown", () => {
  /** Each slide as `text:label` with `*` on the current one, in document order. */
  const rows = (container: Element) =>
    [...slidesIn(container)].map(
      (slide) =>
        `${slide.textContent}:${slide.getAttribute("aria-label")}${slide.hasAttribute("data-current") ? "*" : ""}`,
    );

  it.each([
    { from: ["a", "b", "c", "d", "e"], to: ["c", "b", "e"] },
    { from: ["e", "a", "d", "b", "c"], to: ["c", "b", "e"] },
  ])("numbers by document order after $from becomes $to in one update", ({ from, to }) => {
    const { container, rerender } = render(<Deck names={from} />);
    rerender(<Deck names={to} />);

    expect(rows(container)).toEqual(["c:1 of 3*", "b:2 of 3", "e:3 of 3"]);
    expect(observedState(container)).toEqual(expectedState(3, 0, false, []));
  });

  it("numbers by document order after a pure keyed reorder", () => {
    const { container, rerender } = render(<Deck names={["a", "b", "c", "d"]} value={1} />);
    rerender(<Deck names={["d", "c", "b", "a"]} value={1} />);

    expect(rows(container)).toEqual(["d:1 of 4", "c:2 of 4*", "b:3 of 4", "a:4 of 4"]);
  });

  it("renumbers when slides are prepended, removed, and conditionally rendered", () => {
    const { container, rerender } = render(<Deck names={["A", "B", "C"]} value={1} />);
    expect(currentText(container)).toEqual(["B"]);

    rerender(<Deck names={["Z", "A", "B", "C"]} value={1} />);
    expect(labels(container)).toEqual(["1 of 4", "2 of 4", "3 of 4", "4 of 4"]);
    expect(observedState(container)).toEqual(expectedState(4, 1, false, []));

    rerender(<Deck names={["Z", "C"]} value={1} />);
    expect(observedState(container)).toEqual(expectedState(2, 1, false, []));
    expect(currentText(container)).toEqual(["C"]);

    rerender(<Deck names={[]} value={1} />);
    expect(observedState(container)).toEqual(expectedState(0, 1, false, []));
  });

  it("keeps the value an index when the current slide is removed", () => {
    const { container, rerender } = render(<Deck names={["A", "B", "C"]} value={1} />);

    // The value is the public slide index, so the slide that moves into it becomes current.
    rerender(<Deck names={["A", "C"]} value={1} />);
    expect(currentText(container)).toEqual(["C"]);
    expect(observedState(container)).toEqual(expectedState(2, 1, false, []));

    // Removing the last slide while it is current leaves the index out of range, as before.
    rerender(<Deck names={["A"]} value={1} />);
    expect(observedState(container)).toEqual(expectedState(1, 1, false, []));
  });

  it("lets a consumer aria-label win before and after the slides change", () => {
    const deck = (names: string[]) => (
      <Carousel aria-label="Deck">
        <CarouselViewport>
          {names.map((name) => (
            <CarouselSlide key={name} aria-label={name === "B" ? "Named B" : undefined}>
              {name}
            </CarouselSlide>
          ))}
        </CarouselViewport>
      </Carousel>
    );
    const { container, rerender } = render(deck(["A", "B", "C"]));
    expect(labels(container)).toEqual(["1 of 3", "Named B", "3 of 3"]);

    rerender(deck(["B", "C"]));
    expect(labels(container)).toEqual(["Named B", "2 of 2"]);
  });

  describe("with autoplay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("keeps cycling through every slide after the current one is removed", () => {
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const onChange = vi.fn();
      const { container, rerender } = render(
        <Deck names={["A", "B", "C"]} autoplay={100} onChange={onChange} />,
      );
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(currentText(container)).toEqual(["C"]);

      rerender(<Deck names={["A", "B"]} autoplay={100} onChange={onChange} />);
      expect(observedState(container)).toEqual(expectedState(2, 2, false, []));

      const seen: string[] = [];
      for (let tick = 0; tick < 4; tick += 1) {
        act(() => {
          vi.advanceTimersByTime(100);
        });
        seen.push(...currentText(container));
      }
      expect(seen).toEqual(["B", "A", "B", "A"]);
      expect(errors).not.toHaveBeenCalled();
    });
  });
});

describe("carousel commits", () => {
  function profiled(ui: ReactElement) {
    let commits = 0;
    const onRender = () => {
      commits += 1;
    };
    const profile = (next: ReactElement) => (
      <Profiler id="carousel" onRender={onRender}>
        {next}
      </Profiler>
    );
    const view = render(profile(ui));
    return {
      ...view,
      update: (next: ReactElement) => view.rerender(profile(next)),
      commits: () => commits,
      reset: () => {
        commits = 0;
      },
    };
  }

  it("mounts in at most two commits", () => {
    const view = profiled(<Deck names={["A", "B", "C", "D"]} />);
    expect(labels(view.container)).toEqual(["1 of 4", "2 of 4", "3 of 4", "4 of 4"]);
    expect(view.commits()).toBeLessThanOrEqual(2);
  });

  it("re-renders under a parent with an inline slide ref in one commit", () => {
    const deck = (tick: number) => (
      <Carousel aria-label="Deck" data-tick={tick}>
        <CarouselViewport>
          {["A", "B", "C"].map((name) => (
            <CarouselSlide key={name} ref={(element) => void element}>
              {name}
            </CarouselSlide>
          ))}
        </CarouselViewport>
      </Carousel>
    );
    const view = profiled(deck(0));
    view.reset();
    view.update(deck(1));
    expect(labels(view.container)).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
    expect(view.commits()).toBe(1);
  });

  it("moves to the next slide in one commit without re-registering every slide", () => {
    const view = profiled(<Deck names={["A", "B", "C", "D"]} />);
    view.reset();
    // oxlint-disable-next-line comp0/no-synthetic-events -- counts the commits of exactly one click
    fireClick(buttons(view.container).next);
    expect(currentText(view.container)).toEqual(["B"]);
    expect(view.commits()).toBe(1);
  });
});

/** A seeded PRNG, so a failing case can be replayed from the printed input. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Wrap = "plain" | "fragment" | "component";
type GeneratedSlide = { name: string; label: string | undefined; wrap: Wrap };
type GeneratedCase = { slides: GeneratedSlide[]; value: number; loop: boolean; nested: boolean };

function generateCase(random: () => number): GeneratedCase {
  const pick = (count: number) => Math.floor(random() * count);
  const wraps = ["plain", "fragment", "component"] as const;
  // A name keeps its wrap across runs, so successive runs move kept slides instead of remounting.
  const pool = ["a", "b", "c", "d", "e", "f", "g"];
  const names = pool.filter(() => random() < 0.7);
  for (let index = names.length - 1; index > 0; index -= 1) {
    const other = pick(index + 1);
    [names[index], names[other]] = [names[other]!, names[index]!];
  }
  const slides = names.map((name) => ({
    name,
    label: random() < 0.2 ? `Own ${name}` : undefined,
    wrap: wraps[pool.indexOf(name) % wraps.length]!,
  }));
  return {
    slides,
    value: pick(slides.length + 3) - 1,
    loop: random() < 0.5,
    nested: random() < 0.3,
  };
}

function generatedCarousel({ slides, value, loop, nested }: GeneratedCase) {
  return (
    <Carousel aria-label="Generated" value={value} onChange={() => {}} loop={loop}>
      <CarouselPrevious />
      <CarouselNext />
      <CarouselViewport>
        {slides.map(({ name, label, wrap }, index) => {
          let content: ReactNode = name;
          // Inner slides must never count toward the outer carousel.
          if (nested && index === 0) {
            content = (
              <Carousel aria-label="Inner">
                <CarouselViewport>
                  <CarouselSlide data-inner="">x</CarouselSlide>
                  <CarouselSlide data-inner="">y</CarouselSlide>
                </CarouselViewport>
              </Carousel>
            );
          }
          if (wrap === "component") {
            return (
              <Card key={name} aria-label={label} data-outer="" data-name={name}>
                {content}
              </Card>
            );
          }
          if (wrap === "fragment") {
            return (
              <Fragment key={name}>
                <CarouselSlide aria-label={label} data-outer="" data-name={name}>
                  {content}
                </CarouselSlide>
              </Fragment>
            );
          }
          return (
            <CarouselSlide key={name} aria-label={label} data-outer="" data-name={name}>
              {content}
            </CarouselSlide>
          );
        })}
      </CarouselViewport>
    </Carousel>
  );
}

function generatedState(container: Element) {
  const { previous, next } = buttons(container);
  return {
    slides: slideStates(container.querySelectorAll("[data-outer]")),
    text: [...container.querySelectorAll("[data-outer]")].map((slide) =>
      slide.getAttribute("data-name"),
    ),
    previousDisabled: previous.disabled,
    nextDisabled: next.disabled,
  };
}

describe("carousel slide invariants over generated slide lists", () => {
  it("matches the model on the client across 1000 successive reorders, removals, and additions, and on the server", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const random = mulberry32(20261121);
    const { container, rerender } = render(<Deck names={[]} />);
    const server = document.createElement("div");
    for (let run = 0; run < 1000; run += 1) {
      const generated = generateCase(random);
      const expected = expectedState(
        generated.slides.length,
        generated.value,
        generated.loop,
        generated.slides.map((slide) => slide.label),
      );
      const ui = generatedCarousel(generated);
      try {
        rerender(ui);
        const names = generated.slides.map((slide) => slide.name);
        expect(generatedState(container)).toEqual({ ...expected, text: names });
        server.innerHTML = renderToString(ui);
        expect(generatedState(server)).toEqual({ ...expected, text: names });
        if (generated.nested && generated.slides.length > 0) {
          const inner = slideStates(container.querySelectorAll("[data-inner]"));
          expect(inner).toEqual(expectedState(2, 0, false, []).slides);
        }
      } catch (error) {
        throw new Error(`run ${run} failed for ${JSON.stringify(generated)}`, { cause: error });
      }
    }
    expect(errors).not.toHaveBeenCalled();
  }, 120_000);
});
