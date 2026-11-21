import { describe, it } from "vitest";
import { Inventory, InventoryItem } from "../src/index.js";
import { GenUI } from "../../genui/src/index.js";
import { median, mountMeasured, report, type Row, type Sample } from "./measure.js";

// Uses only the public Inventory and GenUI APIs, so the same file measures an older commit:
// check it out and run `pnpm bench packages/react/bench/inventory-and-genui.bench.tsx` again.
// "remove focused item" is where Inventory's render-time focus reset saves a commit.

const SIZES = [10, 100, 400];
const REPEATS = 7;
const RERENDERS = 10;

type Entry = { value: string; column: number; row: number; columnSpan: number; rowSpan: number };

function layoutOf(size: number, skip = -1): Entry[] {
  const entries: Entry[] = [];
  for (let index = 0; index < size; index += 1) {
    if (index === skip) continue;
    entries.push({
      value: `item-${index}`,
      column: (index % 20) + 1,
      row: Math.floor(index / 20) + 1,
      columnSpan: 1,
      rowSpan: 1,
    });
  }
  return entries;
}

function inventoryUi(size: number, layout: Entry[]) {
  return (
    <Inventory aria-label="Bench" columns={20} rows={Math.ceil(size / 20)} value={layout}>
      {layout.map((entry) => (
        <InventoryItem key={entry.value} value={entry.value}>
          {entry.value}
        </InventoryItem>
      ))}
    </Inventory>
  );
}

function inventoryMount(size: number): Sample {
  const view = mountMeasured();
  const sample = view.render(inventoryUi(size, layoutOf(size)));
  view.unmount();
  return sample;
}

/** The focused item (the first, which holds the tab stop) leaves the controlled layout. */
function inventoryRemoveFocused(size: number): Sample {
  const view = mountMeasured();
  view.render(inventoryUi(size, layoutOf(size)));
  const sample = view.render(inventoryUi(size, layoutOf(size, 0)));
  const stops = view.container.querySelectorAll("li[tabindex='0']").length;
  if (stops !== 1) throw new Error(`expected one stop, saw ${stops}`);
  view.unmount();
  return sample;
}

function responseOf(size: number) {
  return JSON.stringify({
    type: "Stack",
    children: [
      {
        type: "Form",
        name: "bench",
        title: "Bench",
        submitLabel: "Send",
        children: Array.from({ length: size }, (_, index) => ({
          type: "TextField",
          label: `Field ${index}`,
          name: `field${index}`,
        })),
      },
    ],
  });
}

function genuiUi(response: string) {
  // New inline callbacks every render, as a typical host passes them.
  return (
    <GenUI response={response} onAction={() => {}} onStateChange={() => {}} onError={() => {}} />
  );
}

function genuiMount(size: number): Sample {
  const view = mountMeasured();
  const sample = view.render(genuiUi(responseOf(size)));
  view.unmount();
  return sample;
}

/** Host re-renders with the same response and new callback identities, per re-render. */
function genuiHostRerender(size: number): Sample {
  const view = mountMeasured();
  const response = responseOf(size);
  view.render(genuiUi(response));
  const total: Sample = { commits: 0, renderMs: 0, wallMs: 0 };
  for (let index = 0; index < RERENDERS; index += 1) {
    const sample = view.render(genuiUi(response));
    total.commits += sample.commits;
    total.renderMs += sample.renderMs;
    total.wallMs += sample.wallMs;
  }
  view.unmount();
  return {
    commits: total.commits / RERENDERS,
    renderMs: total.renderMs / RERENDERS,
    wallMs: total.wallMs / RERENDERS,
  };
}

function run(scenario: string, sizes: number[], sample: (size: number) => Sample): Row[] {
  return sizes.map((size) => {
    sample(size);
    const samples = Array.from({ length: REPEATS }, () => sample(size));
    return { scenario, size, ...median(samples) };
  });
}

describe("Inventory and GenUI", () => {
  it("measures Inventory and GenUI", { timeout: 300_000 }, () => {
    report("Inventory and GenUI", [
      ...run("inventory mount", SIZES, inventoryMount),
      ...run("inventory remove focused item", SIZES, inventoryRemoveFocused),
      ...run("genui mount", [10, 50], genuiMount),
      ...run("genui host re-render (per render)", [10, 50], genuiHostRerender),
    ]);
  });
});
