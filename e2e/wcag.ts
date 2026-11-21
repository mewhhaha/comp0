import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import axe from "axe-core";
import type { Locator, Page } from "@playwright/test";

/**
 * The WCAG 2.2 Level A and AA rule sets. Unlike the jsdom suites, the docs pages have real
 * layout and theme, so `color-contrast` (1.4.3) and `target-size` (2.5.8) run here.
 */
export const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const componentsDir = fileURLToPath(
  new URL("../apps/docs/src/content/components/", import.meta.url),
);
const baselineDir = fileURLToPath(new URL("./wcag-baseline/", import.meta.url));

/** Every `/components/<slug>` page, read from the docs entry files (one file per page). */
export const componentSlugs = readdirSync(componentsDir)
  .filter((file) => file.endsWith(".ts") && !file.includes(".test."))
  .map((file) => file.slice(0, -".ts".length))
  .sort();

/**
 * Describes an element by what a person perceives (role, name), not by generated ids, so a
 * finding keeps the same key across builds. Runs in the page.
 */
const describeSource = `(element) => {
  if (!element) return "(missing)";
  const role = element.getAttribute("role") || element.localName;
  const labelled = element.getAttribute("aria-labelledby");
  const name =
    element.getAttribute("aria-label") ||
    (labelled && labelled.split(/\\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ")) ||
    (element.labels && element.labels[0] && element.labels[0].textContent) ||
    element.getAttribute("title") ||
    element.getAttribute("placeholder") ||
    element.textContent ||
    "";
  return role + ' "' + name.replace(/\\s+/g, " ").trim().slice(0, 40) + '"';
}`;

/** Runs the WCAG 2.2 A/AA axe rules inside `scope` and returns one key per failing node. */
export async function wcagAxeFindings(page: Page, scope: Locator, label: string) {
  if (!(await page.evaluate(() => "axe" in window))) {
    await page.addScriptTag({ content: axe.source });
  }
  const handle = await scope.elementHandle();
  return page.evaluate(
    async ({ element, tags, label: prefix, describe }) => {
      const run = (window as unknown as { axe: typeof axe }).axe.run;
      const result = await run(element as Element, { runOnly: { type: "tag", values: tags } });
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      return result.violations.flatMap(({ id, nodes }) =>
        nodes.map(
          ({ target }) =>
            `axe:${prefix}:${id}: ${toKey(document.querySelector(String(target[0])))}`,
        ),
      );
    },
    { element: handle, tags: wcagTags, label, describe: describeSource },
  );
}

type FocusStop = {
  key: string;
  /** Focus is still in the example (or a surface it opened). */
  inside: boolean;
  /** Tab moved focus to another element. */
  moved: boolean;
  /** Content outside the example covers every sampled point of the focused element (2.4.11). */
  obscured: boolean;
};

/**
 * Walks the example with the Tab key, the way a keyboard user meets it, and reports:
 * - `keyboard-trap` (2.1.2) when Tab stops moving focus or never leaves the example,
 * - `focus-not-visible` (2.4.7) when nothing in the example changes when a stop gains focus,
 * - `focus-obscured` (2.4.11) when content outside the example covers every sampled point of
 *   the focused element (a sticky header, for instance).
 */
export async function keyboardFindings(page: Page, region: Locator, maxStops = 60) {
  const findings: string[] = [];
  // Smooth scrolling would leave the focused element mid-scroll when it is measured.
  await page.addStyleTag({ content: "html, * { scroll-behavior: auto !important; }" });
  await region.evaluate((element) => {
    element.setAttribute("tabindex", "-1");
    (element as HTMLElement).focus();
  });
  let repeats = 0;
  for (let stop = 0; stop < maxStops; stop++) {
    await page.keyboard.press("Tab");
    const state = await focusState(page, region);
    if (!state.inside) return findings;
    if (!state.moved) {
      repeats += 1;
      // Segmented fields (date, time) move between segments on Tab before focus leaves them.
      if (repeats >= 10) {
        findings.push(`keyboard-trap: ${state.key}`);
        return findings;
      }
      continue;
    }
    repeats = 0;
    if (state.obscured) findings.push(`focus-obscured: ${state.key}`);
    if (!(await focusChangesPixels(page, region))) findings.push(`focus-not-visible: ${state.key}`);
  }
  findings.push(`keyboard-trap: Tab did not leave the example within ${maxStops} stops`);
  return findings;
}

async function focusState(page: Page, region: Locator): Promise<FocusStop> {
  const handle = await region.elementHandle();
  return page.evaluate(
    ({ region: element, describe }) => {
      const scope = element as Element;
      const active = document.activeElement;
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      // Focus may sit in a surface the example opened in the top layer; count it as the example's.
      const owned = (node: Element | null) =>
        Boolean(node && (scope.contains(node) || node.closest("[popover], dialog")));
      // Tab moved focus to a different element; segments of one field share a key, not an element.
      const memory = window as unknown as { __wcagLastFocus?: Element | null };
      const moved = memory.__wcagLastFocus !== active;
      memory.__wcagLastFocus = active;
      if (!active || active === document.body || active === scope || !owned(active)) {
        return { key: toKey(active), inside: false, moved, obscured: false };
      }
      let target: Element | null = active;
      while (
        target &&
        target.getBoundingClientRect().width * target.getBoundingClientRect().height < 4
      )
        target = target.parentElement;
      const box = (target ?? active).getBoundingClientRect();
      const points = [
        [box.left + box.width / 2, box.top + box.height / 2],
        [box.left + 2, box.top + 2],
        [box.right - 2, box.top + 2],
        [box.left + 2, box.bottom - 2],
        [box.right - 2, box.bottom - 2],
      ];
      // Hits inside the example (a label over a visually hidden input, the element's own
      // children) do not obscure it.
      const visible = points.some(([x, y]) => {
        const hit = document.elementFromPoint(x!, y!);
        return Boolean(hit && (owned(hit) || active.contains(hit) || hit.contains(active)));
      });
      return { key: toKey(active), inside: true, moved, obscured: !visible };
    },
    { region: handle, describe: describeSource },
  );
}

/** Compares the example focused and unfocused; the focused stop gets focus back afterwards. */
async function focusChangesPixels(page: Page, region: Locator) {
  const options = { animations: "disabled", caret: "hide", scale: "css" } as const;
  const focused = await region.screenshot(options);
  const restore = await page.evaluateHandle(() => {
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
    return active;
  });
  const blurred = await region.screenshot(options);
  await restore.evaluate((element) =>
    (element as HTMLElement | null)?.focus({ preventScroll: true }),
  );
  return !focused.equals(blurred);
}

/**
 * Known findings per page live in `e2e/wcag-baseline/<slug>.json`: the remediation backlog.
 * A finding missing from it fails the suite (a regression), and so does a baseline entry
 * that no longer occurs, so the backlog only shrinks. `WCAG_BASELINE=update` rewrites it.
 */
export function compareWithBaseline(slug: string, findings: string[]) {
  const file = `${baselineDir}${slug}.json`;
  const actual = [...new Set(findings)].sort();
  if (process.env.WCAG_BASELINE === "update") {
    if (actual.length === 0) rmSync(file, { force: true });
    else {
      mkdirSync(baselineDir, { recursive: true });
      writeFileSync(file, `${JSON.stringify(actual, null, 2)}\n`);
    }
    return { added: [], fixed: [] };
  }
  const known: string[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  return {
    added: actual.filter((finding) => !known.includes(finding)),
    fixed: known.filter((finding) => !actual.includes(finding)),
  };
}
