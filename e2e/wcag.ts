import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import axe from "axe-core";
import { expect, type Locator, type Page } from "@playwright/test";

/** The WCAG 2.2 Level A and AA rule sets. */
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

/**
 * comp0 is headless: the consumer owns color and size, so contrast (1.4.3) and target size
 * (2.5.8) judge the docs example styling, not the library. They stay out of this sweep and out
 * of the e2e axe helper (`e2e/axe.ts`).
 */
export const consumerOwnedRules = {
  "color-contrast": { enabled: false },
  "target-size": { enabled: false },
};

/** What the sweep keeps on `window` between steps on one page. */
type SweepWindow = Window & {
  axe: typeof axe;
  /** Every element that received focus during the Tab walk, segments of a field included. */
  __wcagFocused?: Set<Element>;
  /** Elements the Tab walk found describing themselves with a tooltip while focused. */
  __wcagTooltipTriggers?: Set<Element>;
  /** Violations (rule id, element) of the closed state, so opened states only add new ones. */
  __wcagInitial?: [string, Element | undefined][];
  /** The opener being checked: whether it is open and which surfaces it opened. */
  __wcagOpener?: { isOpen: () => boolean; surfaces: () => Element[] };
  __wcagLastFocus?: Element | null;
  /** Interactive elements the last reachability check found unreachable. */
  __wcagUnreachable?: Element[];
  /** Focused roving stops to press arrow keys from, each with the group the arrows move in. */
  __wcagProbes?: {
    group: Element;
    /** Elements the arrows reached that are still to be probed, and every one reached. */
    queue: Element[];
    seen: Set<Element>;
    current?: Element | undefined;
  }[];
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
  // The docs stream an example's server HTML inside React's Suspense markers (`<!--$-->`), and
  // the client then renders that boundary again, showing "Loading example…" for a moment, which
  // can come after the check above and after the network is idle (more often in a slower engine).
  // Server HTML counts as visited only once React owns it: its elements carry React's fiber key.
  await expect
    .poll(() => region.evaluate(renderedByClient), {
      message: `${slug}: example never rendered by the client`,
    })
    .toBe(true);
  await page.waitForLoadState("networkidle");
  return region;
}

/** The example is not React's server HTML still waiting for the client. Runs in the page. */
function renderedByClient(region: Element) {
  if (region.textContent?.includes("Loading example…")) return false;
  const streamed = [...region.childNodes].some(
    (node) => node.nodeType === Node.COMMENT_NODE && (node as Comment).data.startsWith("$"),
  );
  const content = region.firstElementChild;
  return (
    !streamed ||
    Boolean(content && Object.keys(content).some((key) => key.startsWith("__reactFiber$")))
  );
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

async function ensureAxe(page: Page) {
  if (!(await page.evaluate(() => "axe" in window))) {
    await page.addScriptTag({ content: axe.source });
  }
}

/** Runs the WCAG 2.2 A/AA axe rules inside `scope` and returns one key per failing node. */
export async function wcagAxeFindings(page: Page, scope: Locator) {
  await ensureAxe(page);
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
 *   the focused element (a sticky header, for instance),
 * - `keyboard-unreachable` (2.1.1) for interactive elements of the example's initial render
 *   that the walk never focused (checked only when the walk left the example normally).
 * Tooltip triggers it meets are remembered for `openedStateFindings`.
 */
export async function keyboardFindings(page: Page, region: Locator) {
  // Smooth scrolling would leave the focused element mid-scroll when it is measured.
  await page.addStyleTag({ content: "html, * { scroll-behavior: auto !important; }" });
  await region.evaluate((element) => {
    const memory = window as unknown as SweepWindow;
    // Tab past the last stop of the document (or of an open modal dialog) moves focus to the
    // browser's own UI in Chromium and WebKit, while Playwright's Firefox has none and keeps
    // focus where it was, which would read as a trap. A stop after everything else, inside the
    // modal when one is open, gives every engine the same place to leave to; reaching it is
    // leaving the example. `keyboardFindings` removes it when it returns.
    // A modal that keeps Tab inside itself (natively, as Firefox does, or by script) is what a
    // modal is for, not a 2.1.2 trap, as long as the walk can still leave the example: the stop
    // is one more stop of the modal, so Tab reaches it before any wrap back to the first one.
    const exit = document.createElement("span");
    exit.tabIndex = 0;
    exit.setAttribute("data-wcag-exit", "");
    const modals = [...document.querySelectorAll("dialog:modal")];
    if (modals.length < 2) (modals[0] ?? document.body).append(exit);
    else {
      // Only the modal on top takes focus; the others (an outer dialog under a nested one, an
      // earlier sibling) are inert. The top layer's order is not exposed, so each modal, the
      // last in the document first, is tried until the stop can take focus there.
      const previous = document.activeElement as HTMLElement | null;
      for (const modal of modals.reverse()) {
        modal.append(exit);
        exit.focus({ preventScroll: true });
        if (document.activeElement === exit) break;
      }
      previous?.focus({ preventScroll: true });
    }
    memory.__wcagFocused = new Set();
    memory.__wcagTooltipTriggers = new Set();
    // focusin also sees the segments of date and time fields, which Tab visits one by one.
    // WebKit fires only focus, not focusin, when Tab enters a native date or time input, so
    // both are recorded.
    for (const type of ["focusin", "focus"]) {
      document.addEventListener(
        type,
        (event) => memory.__wcagFocused?.add(event.target as Element),
        true,
      );
    }
    element.setAttribute("tabindex", "-1");
    (element as HTMLElement).focus();
  });
  try {
    return await tabWalk(page, region);
  } finally {
    await page.evaluate(() => document.querySelector("[data-wcag-exit]")?.remove());
  }
}

/** The Tab walk of `keyboardFindings`, from focus on the region. */
async function tabWalk(page: Page, region: Locator) {
  const maxStops = 60;
  const findings: string[] = [];
  let repeats = 0;
  let key = "(none)";
  for (let stop = 0; stop < maxStops; stop++) {
    await page.keyboard.press("Tab");
    const state = await focusState(page, region);
    if (!state.inside) {
      let unreachable = await unreachableFindings(region);
      // Arrow keys may reach what Tab did not; whatever they focus is recorded like a Tab stop.
      if (unreachable.length > 0 && (await probeRovingStops(page, region))) {
        unreachable = await unreachableFindings(region);
      }
      findings.push(...unreachable);
      return findings;
    }
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
    async ({ region: element, describe }) => {
      // WebKit scrolls a newly focused element into view in a task it queues on focus, not
      // during focus as Chromium and Firefox do, and this evaluation can run before that task.
      // A task queued now runs after it, so the element is measured where the user sees it.
      await new Promise((resolve) => setTimeout(resolve));
      const scope = element as Element;
      const active = document.activeElement;
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      const memory = window as unknown as SweepWindow;
      const references = (node: Element, attributes: string[]) =>
        attributes
          .flatMap((attribute) => (node.getAttribute(attribute) ?? "").split(/\s+/))
          .map((id) => (id ? document.getElementById(id) : null))
          .filter((target): target is HTMLElement => target !== null);
      // A trigger the walk focused that now describes itself with a tooltip opens one on focus.
      if (
        active &&
        scope.contains(active) &&
        references(active, ["aria-describedby"]).some(
          (target) => target.getAttribute("role") === "tooltip",
        )
      ) {
        memory.__wcagTooltipTriggers?.add(active);
      }
      // The example owns the region and every top-layer surface (popover, modal dialog) its
      // elements point at with aria-controls, aria-describedby or aria-owns, or that holds such a
      // target, and, in turn, what those surfaces point at. A target outside the region that is
      // not in the top layer (a docs-shell header) is not the example's, and neither is a
      // docs-shell popover or dialog the example did not open.
      const ownedRoots: Element[] = [scope];
      const referencing = ["aria-controls", "aria-describedby", "aria-owns"];
      for (let index = 0; index < ownedRoots.length; index++) {
        const root = ownedRoots[index]!;
        const sources = [
          root,
          ...root.querySelectorAll("[aria-controls], [aria-describedby], [aria-owns]"),
        ];
        for (const target of sources.flatMap((source) => references(source, referencing))) {
          const top = target.closest(":popover-open, dialog:modal");
          if (top && !top.contains(scope) && !ownedRoots.includes(top)) ownedRoots.push(top);
        }
      }
      const owned = (node: Element | null) =>
        Boolean(node && ownedRoots.some((root) => root.contains(node)));
      // Tab moved focus to a different element; segments of one field share a key, not an element.
      const moved = memory.__wcagLastFocus !== active;
      memory.__wcagLastFocus = active;
      const left =
        !active ||
        active === document.body ||
        active === scope ||
        active.hasAttribute("data-wcag-exit") ||
        !owned(active);
      if (left) {
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
      // Hit-testing skips pointer-events:none, but a sticky header that ignores the pointer still
      // hides focus. Outside the example everything takes pointer events while measuring; inside
      // it, a decorative pointer-events:none layer keeps falling through as it does for users.
      scope.setAttribute("data-wcag-region", "");
      const hitAll = document.createElement("style");
      hitAll.textContent =
        ":not([data-wcag-region], [data-wcag-region] *) { pointer-events: auto !important; }";
      document.head.append(hitAll);
      // An overlay that paints nothing hides nothing: hit-testing looks through it when it, or an
      // ancestor, has opacity 0, it is visibility:hidden, or its own box is bare (transparent
      // background, no image, border, shadow or text of its own; its children are hit separately).
      const paints = (node: Element) => {
        for (let level: Element | null = node; level; level = level.parentElement) {
          if (getComputedStyle(level).opacity === "0") return false;
        }
        const style = getComputedStyle(node);
        if (style.visibility === "hidden") return false;
        const text = [...node.childNodes].some(
          (child) => child.nodeType === Node.TEXT_NODE && child.textContent?.trim(),
        );
        return (
          text ||
          style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
          style.backgroundImage !== "none" ||
          style.boxShadow !== "none" ||
          ["top", "right", "bottom", "left"].some(
            (side) => style.getPropertyValue(`border-${side}-style`) !== "none",
          )
        );
      };
      // Hits inside the example or a surface it opened (a label over a visually hidden input,
      // the element's own children) and the element's own ancestors do not obscure it.
      const visible =
        onscreen.length === 0 ||
        onscreen.some(([x, y]) => {
          const hit = document
            .elementsFromPoint(x, y)
            .find((node) => owned(node) || node.contains(active) || paints(node));
          return Boolean(hit && (owned(hit) || hit.contains(active)));
        });
      hitAll.remove();
      scope.removeAttribute("data-wcag-region");
      return { key: toKey(active), inside: true, moved, obscured: !visible };
    },
    { region: handle, describe: describeSource },
  );
}

/**
 * 2.1.1: interactive elements of the example that the Tab walk never focused. Interactive means
 * a native control, an interactive ARIA role, or a pointer cursor on an element with no
 * interactive ancestor. Not reported: disabled, unrendered (closed surfaces), inert or
 * aria-hidden elements; members of a roving composite (by role: listbox, grid, tree, menu,
 * tablist, radiogroup, toolbar, ...) where the composite or one member was focused; the other
 * radios of a focused native radio group; items of a focused combobox, aria-activedescendant or
 * aria-autocomplete widget; buttons that control a focused element (spinbutton steppers); labels
 * and wrappers of a focused or focusable control; and descendants of a focused or interactive
 * element. Elements arrow keys focused (`probeRovingStops`) count as focused. The unreachable
 * elements are kept on `window` for `probeRovingStops`.
 */
async function unreachableFindings(region: Locator) {
  return region.evaluate((scope, describe) => {
    const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
    const memory = window as unknown as SweepWindow;
    const focused = memory.__wcagFocused ?? new Set<Element>();
    const native =
      'button, a[href], input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"])';
    const roles = new Set([
      "button",
      "link",
      "checkbox",
      "radio",
      "switch",
      "tab",
      "menuitem",
      "menuitemcheckbox",
      "menuitemradio",
      "option",
      "treeitem",
      "gridcell",
      "slider",
      "spinbutton",
      "textbox",
      "combobox",
      "searchbox",
    ]);
    const composites =
      '[role="listbox"], [role="grid"], [role="treegrid"], [role="tree"], [role="menu"], [role="menubar"], [role="tablist"], [role="radiogroup"], [role="toolbar"]';
    const semantic = (node: Element) => {
      const role = node.getAttribute("role") ?? "";
      if (role === "row") return Boolean(node.closest('[role="grid"], [role="treegrid"]'));
      return roles.has(role) || node.matches(native);
    };
    const pointer = (node: Element) => getComputedStyle(node).cursor === "pointer";
    const ancestors = (node: Element) => {
      const list: Element[] = [];
      for (
        let parent = node.parentElement;
        parent && parent !== scope;
        parent = parent.parentElement
      ) {
        list.push(parent);
      }
      return list;
    };
    const focusedWithin = (node: Element) => [...focused].some((entry) => node.contains(entry));
    const focusable = (node: Element) =>
      focused.has(node) || ((node as HTMLElement).tabIndex >= 0 && !node.matches(":disabled"));
    const modal = document.querySelector("dialog:modal");
    const skipped = (node: Element) =>
      node.matches(":disabled") ||
      Boolean(node.closest('[aria-disabled="true"], [inert], [aria-hidden="true"]')) ||
      Boolean(modal && !modal.contains(node)) ||
      !node.checkVisibility({ visibilityProperty: true });
    const inRovingComposite = (node: Element) => {
      const composite = node.closest(composites);
      return Boolean(composite && focusedWithin(composite));
    };
    const inActiveDescendantWidget = (node: Element) =>
      [...focused].some((entry) => {
        const widget =
          entry.getAttribute("role") === "combobox" ||
          entry.hasAttribute("aria-activedescendant") ||
          entry.hasAttribute("aria-autocomplete");
        if (!widget) return false;
        const owned = ["aria-controls", "aria-owns"]
          .flatMap((attribute) => (entry.getAttribute(attribute) ?? "").split(/\s+/))
          .map((id) => (id ? document.getElementById(id) : null));
        return [entry, ...owned].some((target) => target?.contains(node));
      });
    // Arrow keys move between the radios of a native group; Tab stops on one.
    const inFocusedRadioGroup = (node: Element) =>
      node instanceof HTMLInputElement &&
      node.type === "radio" &&
      [...focused].some(
        (entry) =>
          entry instanceof HTMLInputElement &&
          entry.type === "radio" &&
          entry.name === node.name &&
          entry.form === node.form,
      );
    // Stepper buttons beside a spinbutton: the focused field they control does what they do.
    const controlsFocused = (node: Element) =>
      (node.getAttribute("aria-controls") ?? "")
        .split(/\s+/)
        .some((id) => id && [...focused].some((entry) => entry.id === id));
    const labelsReachableControl = (node: Element) => {
      const controls: Element[] = [...node.querySelectorAll(`${native}, [tabindex]`)];
      const control = (node as HTMLLabelElement).control;
      if (node.localName === "label" && control) controls.push(control);
      return controls.some(focusable);
    };
    const unreachable = [...scope.querySelectorAll("*")].filter((node) => {
      if (focused.has(node) || skipped(node)) return false;
      if (!semantic(node) && !pointer(node)) return false;
      if (
        ancestors(node).some((parent) => focused.has(parent) || semantic(parent) || pointer(parent))
      ) {
        return false;
      }
      return ![
        inRovingComposite,
        inActiveDescendantWidget,
        inFocusedRadioGroup,
        controlsFocused,
        labelsReachableControl,
      ].some((exempt) => exempt(node));
    });
    memory.__wcagUnreachable = unreachable;
    return unreachable.map((node) => `keyboard-unreachable: ${toKey(node)}`);
  }, describeSource);
}

/**
 * A roving tab stop with no composite role (a split button's segments, inventory cards) is
 * reached with arrow keys from the stop Tab focused. For each unreachable element that is, or
 * sits in, a tabindex=-1 element beside a tabindex sibling the walk focused, this focuses that
 * sibling's stop and presses each arrow key once, then does the same from every element of the
 * group those presses focused, breadth first, so a two-dimensional layout (inventory cards) is
 * covered too. What the arrows focus is recorded by the walk's focusin listener. A surface an
 * arrow key opened (a menu button's ArrowDown) is closed with Escape. False when there was
 * nothing to probe.
 */
async function probeRovingStops(page: Page, region: Locator) {
  const count = await region.evaluate((scope) => {
    const memory = window as unknown as SweepWindow;
    const focused = memory.__wcagFocused ?? new Set<Element>();
    const probes = new Map<Element, Element>();
    for (const node of memory.__wcagUnreachable ?? []) {
      for (let stop: Element | null = node; stop && stop !== scope; stop = stop.parentElement) {
        const group: Element | null = stop.parentElement;
        if (!group || stop.getAttribute("tabindex") !== "-1") continue;
        for (const sibling of group.children) {
          if (sibling === stop || !sibling.hasAttribute("tabindex")) continue;
          const origin = focused.has(sibling)
            ? sibling
            : [...focused].find((entry) => sibling.contains(entry));
          if (origin) probes.set(origin, group);
        }
      }
    }
    memory.__wcagProbes = [...probes].map(([origin, group]) => ({
      group,
      queue: [origin],
      seen: new Set([origin]),
    }));
    return probes.size;
  });
  // Each returns how many surfaces are open, so a press that opened one can be undone.
  const takeNext = (probe: number) => {
    const state = (window as unknown as SweepWindow).__wcagProbes![probe]!;
    state.current = state.queue.shift();
    return state.current !== undefined;
  };
  const focusCurrent = (probe: number) => {
    const state = (window as unknown as SweepWindow).__wcagProbes![probe]!;
    (state.current as HTMLElement).focus();
    if (document.activeElement !== state.current) return -1;
    return document.querySelectorAll('[aria-expanded="true"], :popover-open, dialog[open]').length;
  };
  const recordArrival = (probe: number) => {
    const state = (window as unknown as SweepWindow).__wcagProbes![probe]!;
    const active = document.activeElement;
    if (active && state.group.contains(active) && !state.seen.has(active)) {
      state.seen.add(active);
      state.queue.push(active);
    }
    return document.querySelectorAll('[aria-expanded="true"], :popover-open, dialog[open]').length;
  };
  for (let index = 0; index < count; index++) {
    while (await page.evaluate(takeNext, index)) {
      for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
        const before = await page.evaluate(focusCurrent, index);
        if (before < 0) break;
        await page.keyboard.press(key);
        if ((await page.evaluate(recordArrival, index)) > before) {
          await page.keyboard.press("Escape");
        }
      }
    }
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  return count > 0;
}

type Opener = {
  /** Position among the region's descendants, the same after a reload of the same build. */
  index: number;
  key: string;
  /** The key that opens it; null for a tooltip, which opens on focus alone. */
  press: string | null;
};

/**
 * Openers in the example's current render: elements with aria-expanded="false", aria-haspopup,
 * a closed `<summary>`, and tooltip triggers (aria-describedby pointing at a role=tooltip, or
 * found by `keyboardFindings`). Disabled and hidden openers are skipped, and so is
 * anything that would leave the page or open a native chooser: submit buttons, links with href,
 * file inputs and their labels.
 */
async function findOpeners(region: Locator): Promise<Opener[]> {
  return region.evaluate((scope, describe) => {
    const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
    const tooltipTriggers =
      (window as unknown as SweepWindow).__wcagTooltipTriggers ?? new Set<Element>();
    const opens = '[aria-expanded="false"], [aria-haspopup]:not([aria-haspopup="false"]), summary';
    const describesWithTooltip = (node: Element) =>
      (node.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .some((id) => id && document.getElementById(id)?.getAttribute("role") === "tooltip");
    const hazard = (node: Element) =>
      Boolean(node.closest("a[href]")) ||
      // A button outside a form submits by default but has nothing to submit, so only an
      // explicit type="submit" or a form's implicit submit button is never activated.
      (node instanceof HTMLButtonElement &&
        (node.getAttribute("type")?.toLowerCase() === "submit" ||
          (node.type === "submit" && node.form !== null))) ||
      (node instanceof HTMLInputElement && ["submit", "image", "file"].includes(node.type)) ||
      (node instanceof HTMLLabelElement && node.control?.getAttribute("type") === "file");
    const unavailable = (node: Element) =>
      node.matches(":disabled") ||
      Boolean(node.closest('[aria-disabled="true"], [inert], [aria-hidden="true"]')) ||
      !node.checkVisibility({ visibilityProperty: true });
    const alreadyOpen = (node: Element) =>
      node.getAttribute("aria-expanded") === "true" ||
      (node.localName === "summary" && Boolean(node.parentElement?.matches("details[open]")));
    const pressFor = (node: Element) => {
      const tree = node.closest('[role="tree"], [role="treegrid"]');
      if (
        node.getAttribute("role") === "treeitem" ||
        (tree && node.hasAttribute("aria-expanded"))
      ) {
        return "ArrowRight";
      }
      // Enter in a text field submits its form; ArrowDown opens a combobox's list.
      if (node.matches("input, textarea")) return "ArrowDown";
      return "Enter";
    };
    const openers: Opener[] = [];
    [...scope.querySelectorAll("*")].forEach((node, index) => {
      const tooltip = tooltipTriggers.has(node) || describesWithTooltip(node);
      const opener = node.matches(opens);
      if (!tooltip && !opener) return;
      if (hazard(node) || unavailable(node) || alreadyOpen(node)) return;
      openers.push({ index, key: toKey(node), press: opener ? pressFor(node) : null });
    });
    return openers;
  }, describeSource);
}

/** Records the closed state's violations so an opened state reports only what opening added. */
async function rememberClosedViolations(page: Page, region: Locator) {
  await ensureAxe(page);
  await region.evaluate(
    async (scope, { tags, rules }) => {
      const memory = window as unknown as SweepWindow;
      const result = await memory.axe.run(scope, {
        runOnly: { type: "tag", values: tags },
        rules,
        elementRef: true,
      });
      memory.__wcagInitial = result.violations.flatMap(({ id, nodes }) =>
        nodes.map(({ element }): [string, Element | undefined] => [id, element]),
      );
    },
    { tags: wcagTags, rules: consumerOwnedRules },
  );
}

/**
 * Focuses the opener at `index` and remembers how to tell it is open and what it opened: the
 * targets of its aria-controls, aria-owns and aria-describedby (the whole top-layer surface
 * holding them, even when portalled to body), plus anything that entered the top layer since,
 * for surfaces with no id to point at. False when the element there is no longer that opener
 * or does not take focus.
 */
async function focusOpener(region: Locator, opener: Opener) {
  return region.evaluate(
    (scope, { index, key, describe }) => {
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      const element = scope.querySelectorAll("*")[index];
      if (!element || toKey(element) !== key) return false;
      const topLayer = () => [...document.querySelectorAll(":popover-open, dialog[open]")];
      const before = new Set(topLayer());
      const referenced = () =>
        ["aria-controls", "aria-owns", "aria-describedby"]
          .flatMap((attribute) => (element.getAttribute(attribute) ?? "").split(/\s+/))
          .map((id) => (id ? document.getElementById(id) : null))
          .filter((target): target is HTMLElement => target !== null);
      const added = () => topLayer().filter((node) => !before.has(node));
      const shown = (node: Element) =>
        node.matches(":popover-open, dialog[open]") ||
        (node.getAttribute("role") === "tooltip" && node.checkVisibility());
      const isOpen = () =>
        !element.isConnected ||
        element.getAttribute("aria-expanded") === "true" ||
        (element.localName === "summary" &&
          Boolean(element.parentElement?.matches("details[open]"))) ||
        referenced().some(shown) ||
        added().length > 0;
      const surfaces = () => {
        const found = [...referenced(), ...added()]
          .map((node) => node.closest(":popover-open, dialog[open]") ?? node)
          .filter((node) => !node.contains(scope) && !scope.contains(node));
        const unique = [...new Set(found)];
        return unique.filter(
          (node) => !unique.some((other) => other !== node && other.contains(node)),
        );
      };
      (window as unknown as SweepWindow).__wcagOpener = { isOpen, surfaces };
      (element as HTMLElement).focus();
      return document.activeElement === element;
    },
    { index: opener.index, key: opener.key, describe: describeSource },
  );
}

/** Axe over the region plus the surfaces the current opener opened, minus closed-state violations. */
async function openedAxeFindings(page: Page, region: Locator) {
  await ensureAxe(page);
  return region.evaluate(
    async (scope, { tags, rules, describe }) => {
      const memory = window as unknown as SweepWindow;
      const toKey = new Function(`return ${describe}`)() as (node: Element | null) => string;
      const result = await memory.axe.run(
        { include: [scope, ...(memory.__wcagOpener?.surfaces() ?? [])] },
        { runOnly: { type: "tag", values: tags }, rules, elementRef: true },
      );
      const closed = memory.__wcagInitial ?? [];
      return result.violations.flatMap(({ id, nodes }) =>
        nodes
          .filter(({ element }) => !closed.some(([rule, node]) => rule === id && node === element))
          .map(({ element }) => `axe:${id}: ${toKey(element ?? null)}`),
      );
    },
    { tags: wcagTags, rules: consumerOwnedRules, describe: describeSource },
  );
}

/**
 * Opened states: opens each opener in the example with the keyboard, one at a time (focus then
 * Enter; ArrowRight for tree items and expandable tree rows, which expands one level; ArrowDown
 * for text fields; focus alone for tooltips), waits for it to open, and runs the WCAG axe rules
 * over the region plus what it opened. Findings read `open(<opener>) axe:<rule>: <node>`. Escape
 * closes it; when that does not restore the closed state (or the URL changed), the page is
 * reloaded. Call after `keyboardFindings` on the same page so tooltip triggers are known.
 */
export async function openedStateFindings(page: Page, slug: string, region: Locator) {
  // Each opener costs an open, an axe run and sometimes a reload; twelve keep a page's check
  // within seconds and cover every distinct surface the docs examples have.
  const maxOpeners = 12;
  const openWait = { timeout: 2_000 };
  // Exit transitions and a tooltip's close delay finish well within this.
  const closeWait = { timeout: 1_000 };
  const findings: string[] = [];
  const url = page.url();
  const isOpen = () => (window as unknown as SweepWindow).__wcagOpener?.isOpen() ?? false;
  const isClosed = () => {
    const state = (window as unknown as SweepWindow).__wcagOpener;
    return state !== undefined && !state.isOpen();
  };
  const openers = (await findOpeners(region)).slice(0, maxOpeners);
  if (openers.length === 0) return findings;
  await rememberClosedViolations(page, region);
  for (const opener of openers) {
    if (!(await focusOpener(region, opener))) continue;
    if (opener.press) await page.keyboard.press(opener.press);
    const opened = await page.waitForFunction(isOpen, undefined, openWait).then(
      () => true,
      () => false,
    );
    if (opened) {
      const axeFindings = await openedAxeFindings(page, region);
      findings.push(...axeFindings.map((finding) => `open(${opener.key}) ${finding}`));
      await page.keyboard.press("Escape");
    }
    const closed = await page.waitForFunction(isClosed, undefined, closeWait).then(
      () => true,
      () => false,
    );
    if (!closed || page.url() !== url) {
      await visitExample(page, slug);
      await rememberClosedViolations(page, region);
    }
  }
  return findings;
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
 * that no longer occurs, so the backlog only shrinks. Chromium's findings are the shared file;
 * a browser that legitimately finds something else (an engine's own keyboard behavior) has
 * `<slug>.<browser>.json` beside it, which replaces the shared file for that browser only.
 * `pnpm test:wcag:baseline` rewrites them through `writeBaseline` and `writeBrowserBaseline`.
 */
export function compareWithBaseline(slug: string, browser: string, findings: string[]) {
  const own = `${baselineDir}${slug}.${browser}.json`;
  const known = readBaseline(existsSync(own) ? own : `${baselineDir}${slug}.json`);
  const actual = [...new Set(findings)].sort();
  return {
    added: actual.filter((finding) => !known.includes(finding)),
    fixed: known.filter((finding) => !actual.includes(finding)),
  };
}

/** Writes findings as a sorted JSON array, formatted the way `pnpm format:check` expects. */
function writeFindings(file: string, findings: string[]) {
  mkdirSync(baselineDir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(findings, null, 2)}\n`);
  execFileSync("pnpm", ["exec", "oxfmt", "--write", file]);
}

/**
 * Replaces a page's shared baseline (Chromium's findings) with its findings, sorted and unique;
 * no findings deletes the file.
 */
export function writeBaseline(slug: string, findings: string[]) {
  const file = `${baselineDir}${slug}.json`;
  const actual = [...new Set(findings)].sort();
  if (actual.length === 0) rmSync(file, { force: true });
  else writeFindings(file, actual);
}

/**
 * Keeps `<slug>.<browser>.json` only while the browser's findings differ from the shared
 * baseline: written (an empty list included) when they differ, deleted when they match. Run it
 * after the shared file is current, which `pnpm test:wcag:baseline` does by updating Chromium
 * first.
 */
export function writeBrowserBaseline(slug: string, browser: string, findings: string[]) {
  const file = `${baselineDir}${slug}.${browser}.json`;
  const actual = [...new Set(findings)].sort();
  const shared = readBaseline(`${baselineDir}${slug}.json`);
  const same =
    actual.length === shared.length && actual.every((finding) => shared.includes(finding));
  if (same) rmSync(file, { force: true });
  else writeFindings(file, actual);
}
