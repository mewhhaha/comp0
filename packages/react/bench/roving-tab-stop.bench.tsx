import { describe, expect, it } from "vitest";
import { Tab, TabList, Tabs } from "../src/index.js";
import { keyDown, median, mountMeasured, report, type Row, type Sample } from "./measure.js";

// Uses only the public Tabs API, so the same file measures any implementation of the roving
// tab stop: check out another commit and run `pnpm bench` again to compare.

const SIZES = [10, 100, 1000];
const REPEATS = 5;
const PRESSES = 10;

function tabsUi(size: number, props: { value?: string; defaultValue?: string }) {
  const values = Array.from({ length: size }, (_, index) => `tab-${index}`);
  return (
    <Tabs {...props}>
      <TabList aria-label="Bench">
        {values.map((value) => (
          <Tab key={value} value={value}>
            {value}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}

function expectOneStop(container: HTMLElement) {
  const stops = container.querySelectorAll("[role='tab'][tabindex='0']");
  expect(stops).toHaveLength(1);
}

/** Mount cost, including the extra render a fallback stop may need after tabs register. */
function mountSample(size: number, props: { value?: string; defaultValue?: string }) {
  const view = mountMeasured();
  const sample = view.render(tabsUi(size, props));
  expectOneStop(view.container);
  view.unmount();
  return sample;
}

/** Cost per ArrowRight press, averaged over PRESSES presses. */
function arrowSample(size: number, props: { value?: string; defaultValue?: string }) {
  const view = mountMeasured();
  view.render(tabsUi(size, props));
  const list = view.container.querySelector<HTMLElement>("[role='tablist']")!;
  const first = view.container.querySelector<HTMLElement>("[role='tab']")!;
  view.measure(() => first.focus());
  const total: Sample = { commits: 0, renderMs: 0, wallMs: 0 };
  for (let press = 0; press < PRESSES; press += 1) {
    const focused = document.activeElement ?? list;
    const sample = view.measure(() => keyDown(focused, "ArrowRight"));
    total.commits += sample.commits;
    total.renderMs += sample.renderMs;
    total.wallMs += sample.wallMs;
  }
  expectOneStop(view.container);
  view.unmount();
  return {
    commits: total.commits / PRESSES,
    renderMs: total.renderMs / PRESSES,
    wallMs: total.wallMs / PRESSES,
  };
}

const scenarios: Array<{ name: string; run: (size: number) => Sample }> = [
  {
    name: "mount, first tab selected",
    run: (size) => mountSample(size, { defaultValue: "tab-0" }),
  },
  { name: "mount, no tab selected", run: (size) => mountSample(size, {}) },
  { name: "ArrowRight, selection follows", run: (size) => arrowSample(size, {}) },
  {
    name: "ArrowRight, controlled rejects",
    run: (size) => arrowSample(size, { value: "tab-0" }),
  },
];

describe("roving tab stop", () => {
  it("measures Tabs mount and keyboard movement", () => {
    const rows: Row[] = [];
    for (const scenario of scenarios) {
      for (const size of SIZES) {
        scenario.run(size); // warm up the JIT for this shape
        const samples = Array.from({ length: REPEATS }, () => scenario.run(size));
        rows.push({ scenario: scenario.name, size, ...median(samples) });
      }
    }
    report("Tabs roving tab stop (median per mount, mean per key press)", rows);
  }, 300_000);
});
