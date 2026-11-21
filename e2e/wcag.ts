import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import axe from "axe-core";
import { expect, type Locator, type Page } from "@playwright/test";

/** The WCAG 2.2 Level A and AA rule sets. */
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

/**
 * comp0 is headless: the consumer owns color and size, so contrast (1.4.3) and target size
 * (2.5.8) judge the docs example styling, not the library. They stay out of this sweep.
 */
const consumerOwnedRules = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
};

const componentsDir = fileURLToPath(
  new URL("../apps/docs/src/content/components/", import.meta.url),
);
const baselineDir = fileURLToPath(new URL("./wcag-baseline/", import.meta.url));

/** One `/components/<slug>` page per docs entry file; tests and other files are not pages. */
export function entrySlugs(files: string[]) {
  return files
    .filter((file) => file.endsWith(".ts") && !file.includes(".test."))
    .map((file) => file.slice(0, -".ts".length))
    .sort();
}

export const componentSlugs = entrySlugs(readdirSync(componentsDir));

/**
 * Opens `/components/<slug>` and waits for its live example. A missing page, a page without the
 * example region, or an example still on "Loading example…" fails here, naming the slug.
 */
export async function visitExample(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`);
  expect(response?.ok(), `${slug}: HTTP ${response?.status()}`).toBe(true);
  const region = page.getByRole("region", { name: "Live example", exact: true });
  await expect(region, `${slug}: no Live example region`).toBeVisible();
  await expect(
    region.getByText("Loading example…"),
    `${slug}: example stayed on "Loading example…"`,
  ).toHaveCount(0);
  await page.waitForLoadState("networkidle");
  return region;
}

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
export async function wcagAxeFindings(page: Page, scope: Locator) {
  if (!(await page.evaluate(() => "axe" in window))) {
    await page.addScriptTag({ content: axe.source });
  }
  const handle = await scope.elementHandle();
  return page.evaluate(
    async ({ element, tags, rules, describe }) => {
      const run = (window as unknown as { axe: typeof axe }).axe.run;
      const result = await run(element as Element, {
        runOnly: { type: "tag", values: tags },
        rules,
      });
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      return result.violations.flatMap(({ id, nodes }) =>
        nodes.map(({ target }) => `axe:${id}: ${toKey(document.querySelector(String(target[0])))}`),
      );
    },
    { element: handle, tags: wcagTags, rules: consumerOwnedRules, describe: describeSource },
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
 * - `focus-obscured` (2.4.11) when content outside the example covers every sampled point of
 *   the focused element (a sticky header, for instance).
 */
export async function keyboardFindings(page: Page, region: Locator) {
  const maxStops = 60;
  const findings: string[] = [];
  // Smooth scrolling would leave the focused element mid-scroll when it is measured.
  await page.addStyleTag({ content: "html, * { scroll-behavior: auto !important; }" });
  await region.evaluate((element) => {
    element.setAttribute("tabindex", "-1");
    (element as HTMLElement).focus();
  });
  let repeats = 0;
  let key = "(none)";
  for (let stop = 0; stop < maxStops; stop++) {
    await page.keyboard.press("Tab");
    const state = await focusState(page, region);
    if (!state.inside) return findings;
    key = state.key;
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
  }
  // Tab never left the example: the last stop is the one to fix.
  findings.push(`keyboard-trap: ${key}`);
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
        Boolean(node && (scope.contains(node) || node.closest(":popover-open, dialog:modal")));
      // Tab moved focus to a different element; segments of one field share a key, not an element.
      const memory = window as unknown as { __wcagLastFocus?: Element | null };
      const moved = memory.__wcagLastFocus !== active;
      memory.__wcagLastFocus = active;
      if (!active || active === document.body || active === scope || !owned(active)) {
        return { key: toKey(active), inside: false, moved, obscured: false };
      }
      const area = (node: Element) => {
        const rect = node.getBoundingClientRect();
        return rect.width * rect.height;
      };
      let target: Element | null = active;
      while (target && area(target) < 4) target = target.parentElement;
      const box = (target ?? active).getBoundingClientRect();
      const points: [number, number][] = [
        [box.left + box.width / 2, box.top + box.height / 2],
        [box.left + 2, box.top + 2],
        [box.right - 2, box.top + 2],
        [box.left + 2, box.bottom - 2],
        [box.right - 2, box.bottom - 2],
      ];
      // A point off screen cannot be hit-tested; an element with no point on screen is not judged.
      const onscreen = points.filter(
        ([x, y]) => x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight,
      );
      // Hits inside the example (a label over a visually hidden input, the element's own
      // children) do not obscure it.
      const visible =
        onscreen.length === 0 ||
        onscreen.some(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return Boolean(hit && (owned(hit) || active.contains(hit) || hit.contains(active)));
        });
      return { key: toKey(active), inside: true, moved, obscured: !visible };
    },
    { region: handle, describe: describeSource },
  );
}

/** Reads a baseline file; a file that is not a JSON array of strings fails naming the file. */
export function readBaseline(file: string): string[] {
  if (!existsSync(file)) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${(error as Error).message}`);
  }
  if (!Array.isArray(parsed) || !parsed.every((finding) => typeof finding === "string")) {
    throw new Error(`${file} must hold a JSON array of finding strings`);
  }
  return parsed;
}

/**
 * Known findings per page live in `e2e/wcag-baseline/<slug>.json`: the remediation backlog.
 * A finding missing from it fails the suite (a regression), and so does a baseline entry
 * that no longer occurs, so the backlog only shrinks. `pnpm test:wcag:baseline` rewrites it
 * through `writeBaseline`.
 */
export function compareWithBaseline(slug: string, findings: string[]) {
  const known = readBaseline(`${baselineDir}${slug}.json`);
  const actual = [...new Set(findings)].sort();
  return {
    added: actual.filter((finding) => !known.includes(finding)),
    fixed: known.filter((finding) => !actual.includes(finding)),
  };
}

/** Replaces a page's baseline with its findings, sorted and unique; no findings deletes the file. */
export function writeBaseline(slug: string, findings: string[]) {
  const file = `${baselineDir}${slug}.json`;
  const actual = [...new Set(findings)].sort();
  if (actual.length === 0) rmSync(file, { force: true });
  else {
    mkdirSync(baselineDir, { recursive: true });
    writeFileSync(file, `${JSON.stringify(actual, null, 2)}\n`);
    // Leave the file as `pnpm format:check` expects it.
    execFileSync("pnpm", ["exec", "oxfmt", "--write", file]);
  }
}
