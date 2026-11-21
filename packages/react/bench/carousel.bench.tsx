import { describe, expect, it } from "vitest";
import {
  Carousel,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
  CarouselViewport,
} from "../src/index.js";
import { median, mountMeasured, report, type Row, type Sample } from "./measure.js";

// Carousel slide positions ("N of M", data-current) through the public API only: check out
// another commit and run `pnpm bench` again to compare.

const SIZES = [10, 100, 1000];
const REPEATS = 5;
const PRESSES = 10;

const slides = (size: number) => Array.from({ length: size }, (_, index) => `slide-${index}`);

const carousel = (size: number) => (
  <Carousel aria-label="Bench">
    <CarouselPrevious />
    <CarouselNext />
    <CarouselViewport>
      {slides(size).map((slide) => (
        <CarouselSlide key={slide}>{slide}</CarouselSlide>
      ))}
    </CarouselViewport>
  </Carousel>
);

function expectLabelled(container: HTMLElement, size: number, current: number) {
  const rendered = container.querySelectorAll("[aria-roledescription='slide']");
  expect(rendered[size - 1]?.getAttribute("aria-label")).toBe(`${size} of ${size}`);
  expect(container.querySelectorAll("[data-current]")).toHaveLength(1);
  expect(rendered[current]?.hasAttribute("data-current")).toBe(true);
}

function mountSample(size: number) {
  const view = mountMeasured();
  const sample = view.render(carousel(size));
  expectLabelled(view.container, size, 0);
  view.unmount();
  return sample;
}

/** Cost per Next click, averaged over PRESSES clicks. */
function nextSample(size: number) {
  const view = mountMeasured();
  view.render(carousel(size));
  const next = view.container.querySelector<HTMLButtonElement>("[aria-label='Next slide']")!;
  const total: Sample = { commits: 0, renderMs: 0, wallMs: 0 };
  for (let press = 0; press < PRESSES; press += 1) {
    const sample = view.measure(() => next.click());
    total.commits += sample.commits;
    total.renderMs += sample.renderMs;
    total.wallMs += sample.wallMs;
  }
  expectLabelled(view.container, size, Math.min(PRESSES, size - 1));
  view.unmount();
  return {
    commits: total.commits / PRESSES,
    renderMs: total.renderMs / PRESSES,
    wallMs: total.wallMs / PRESSES,
  };
}

const scenarios: Array<{ name: string; run: (size: number) => Sample }> = [
  { name: "mount", run: mountSample },
  { name: "Next", run: nextSample },
];

describe("carousel slide positions", () => {
  it("measures Carousel mount and Next", () => {
    const rows: Row[] = [];
    for (const scenario of scenarios) {
      for (const size of SIZES) {
        scenario.run(size); // warm up the JIT for this shape
        const samples = Array.from({ length: REPEATS }, () => scenario.run(size));
        rows.push({ scenario: scenario.name, size, ...median(samples) });
      }
    }
    report("Carousel slide positions (median per mount, mean per click)", rows);
  }, 600_000);
});
