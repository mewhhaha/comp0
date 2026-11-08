import { act, Profiler, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

/** One measured run: React commits, render time React reports, and wall time to settle. */
export type Sample = { commits: number; renderMs: number; wallMs: number };

export type Row = { scenario: string; size: number } & Sample;

/**
 * Mounts `ui` under a Profiler and returns helpers that measure work until React settles.
 * `renderMs` is the Profiler's actualDuration (component render work). `wallMs` also covers
 * commit, layout and passive effects, and any DOM writes they make, which is where imperative
 * DOM syncing spends its time.
 */
export function mountMeasured() {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);
  let commits = 0;
  let renderMs = 0;
  const onRender = (_id: string, _phase: string, actualDuration: number) => {
    commits += 1;
    renderMs += actualDuration;
  };

  const measure = (work: () => void): Sample => {
    commits = 0;
    renderMs = 0;
    const start = performance.now();
    act(work);
    return { commits, renderMs, wallMs: performance.now() - start };
  };

  return {
    container,
    render: (ui: ReactNode) =>
      measure(() =>
        root.render(
          <Profiler id="bench" onRender={onRender}>
            {ui}
          </Profiler>,
        ),
      ),
    measure,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** Dispatches a keydown on `target` the way a browser delivers one to React's root listener. */
export function keyDown(target: Element, key: string) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

/** Median of each field across repeated samples, which damps GC and JIT noise. */
export function median(samples: Sample[]): Sample {
  const pick = (field: keyof Sample) => {
    const sorted = samples.map((sample) => sample[field]).sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
  };
  return { commits: pick("commits"), renderMs: pick("renderMs"), wallMs: pick("wallMs") };
}

/** Prints rows as a fixed-width table; vitest forwards browser console output to the terminal. */
export function report(title: string, rows: Row[]) {
  const lines = rows.map(
    (row) =>
      `${row.scenario.padEnd(34)} ${String(row.size).padStart(5)}  ${String(row.commits).padStart(7)}  ${row.renderMs.toFixed(2).padStart(9)}  ${row.wallMs.toFixed(2).padStart(8)}`,
  );
  console.log(
    [
      `\n${title}`,
      `${"scenario".padEnd(34)} ${"size".padStart(5)}  ${"commits".padStart(7)}  ${"render ms".padStart(9)}  ${"wall ms".padStart(8)}`,
      ...lines,
    ].join("\n"),
  );
}
