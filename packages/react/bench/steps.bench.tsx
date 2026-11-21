import { useState, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { Steps, StepsItem, StepsList, StepsPanel, StepsTrigger } from "../src/index.js";
import { median, mountMeasured, report, type Row, type Sample } from "./measure.js";

// Steps positions (data-step, data-completed) through the public API only: check out another
// commit and run `pnpm bench` again to compare.

const SIZES = [10, 100, 1000];
const REPEATS = 5;
const PRESSES = 10;

const names = (size: number) => Array.from({ length: size }, (_, index) => `step-${index}`);

type StepsState = {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
};

const middle = (size: number) => `step-${Math.floor(size / 2)}`;

// The current step starts in the middle, so half the items are completed.
const steps = (size: number, state: StepsState = { defaultValue: middle(size) }) => (
  <Steps {...state}>
    <StepsList>
      {names(size).map((name) => (
        <StepsItem key={name} value={name}>
          <StepsTrigger>{name}</StepsTrigger>
        </StepsItem>
      ))}
    </StepsList>
    {names(size).map((name) => (
      <StepsPanel key={name} value={name}>
        {name}
      </StepsPanel>
    ))}
  </Steps>
);

function expectNumbered(container: HTMLElement, size: number, current: number) {
  const items = container.querySelectorAll("li");
  expect(items[size - 1]?.getAttribute("data-step")).toBe(`${size}`);
  expect(container.querySelectorAll("li[data-current]")).toHaveLength(1);
  expect(items[current]?.hasAttribute("data-current")).toBe(true);
  expect(container.querySelectorAll("li[data-completed]")).toHaveLength(current);
}

function mountSample(size: number) {
  const view = mountMeasured();
  const sample = view.render(steps(size));
  expectNumbered(view.container, size, Math.floor(size / 2));
  view.unmount();
  return sample;
}

/** An owner that controls the value and applies every change. */
function Controlled({ size }: { size: number }) {
  const [value, setValue] = useState(middle(size));
  return steps(size, { value, onChange: setValue });
}

/** Cost per click on the next step's trigger (wrapping to the first), averaged over PRESSES clicks. */
function nextSample(size: number, ui: ReactElement) {
  const view = mountMeasured();
  view.render(ui);
  const start = Math.floor(size / 2);
  const triggers = view.container.querySelectorAll<HTMLButtonElement>("li > button");
  const total: Sample = { commits: 0, renderMs: 0, wallMs: 0 };
  let current = start;
  for (let press = 0; press < PRESSES; press += 1) {
    current = (current + 1) % size;
    const trigger = triggers[current]!;
    const sample = view.measure(() => trigger.click());
    total.commits += sample.commits;
    total.renderMs += sample.renderMs;
    total.wallMs += sample.wallMs;
  }
  expectNumbered(view.container, size, current);
  view.unmount();
  return {
    commits: total.commits / PRESSES,
    renderMs: total.renderMs / PRESSES,
    wallMs: total.wallMs / PRESSES,
  };
}

const scenarios: Array<{ name: string; run: (size: number) => Sample }> = [
  { name: "mount", run: mountSample },
  { name: "next step", run: (size) => nextSample(size, steps(size)) },
  { name: "next step, controlled", run: (size) => nextSample(size, <Controlled size={size} />) },
];

describe("steps positions", () => {
  it("measures Steps mount and moving to the next step", () => {
    const rows: Row[] = [];
    for (const scenario of scenarios) {
      for (const size of SIZES) {
        scenario.run(size); // warm up the JIT for this shape
        const samples = Array.from({ length: REPEATS }, () => scenario.run(size));
        rows.push({ scenario: scenario.name, size, ...median(samples) });
      }
    }
    report("Steps positions (median per mount, mean per click)", rows);
  }, 600_000);
});
