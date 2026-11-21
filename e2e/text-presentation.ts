import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";

const baselineDir = fileURLToPath(new URL("./text-presentation-baseline/", import.meta.url));

/** Where a page's known clipped-text findings live. */
export function textBaselineFile(slug: string) {
  return `${baselineDir}${slug}.json`;
}

/** Records the page's uncaught errors from now on, so a page that throws while loading fails. */
export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function settle(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * 1.4.4: doubles the root font size through the browser's default font size, the setting a
 * person changes, so text sized in rem scales while the viewport stays the same. A stylesheet
 * rule would scale the text too, but not the rem in media queries, which would keep a desktop
 * layout's rem-sized rails while squeezing its content column.
 *
 * Chromium only: the setting is reached through a DevTools protocol session, which Firefox and
 * WebKit do not offer, so callers skip on other browsers.
 */
export async function enlargeText(page: Page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  await session.detach();
  await settle(page);
}

/** 1.4.12: the text spacing a person may set, from the success criterion. */
export async function spaceText(page: Page) {
  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p { margin-bottom: 2em !important; }
    `,
  });
  await settle(page);
}

/**
 * Finds text inside `scope` that its layout cuts off: text reaching past an ancestor with
 * `overflow: hidden | clip` whose content overflows by more than 1px, which includes text
 * truncated with an ellipsis. Skipped as not meant to be seen: `[hidden]`, `aria-hidden`,
 * `display: none`, `visibility: hidden`, and visually hidden text: the sr-only pattern of a `clip`
 * rect or `clip-path: inset(50%)` that leaves at most 1px, or a clipping box of at most 1px, which
 * also covers a collapsed accordion panel. A decorative `clip-path` (rounded corners) does not
 * hide what it wraps. An ancestor that scrolls
 * (`overflow: auto | scroll`) ends the search: its content is reachable by scrolling.
 * Ancestors are walked in the flat tree, so text in open shadow roots counts and clipping stops
 * at `scope`. Findings are keyed by role and name, prefixed with the success criterion.
 */
export async function clippedTextFindings(page: Page, scope: Locator, criterion: string) {
  const handle = await scope.elementHandle();
  return page.evaluate(
    ({ region, criterion }) => {
      const scopeElement = region as Element;
      const semantic =
        "[role],a[href],button,input,select,textarea,label,summary,option,li,td,th,h1,h2,h3,h4,h5,h6,p,dt,dd,legend,caption,figcaption";

      const parentOf = (node: Node): Element | null => {
        const slot = (node as Element | Text).assignedSlot;
        if (slot) return slot;
        if (node.parentElement) return node.parentElement;
        const parent = node.parentNode;
        return parent instanceof ShadowRoot ? parent.host : null;
      };
      /** Ancestors from the text's parent up to and including `scope`. */
      const ancestorsOf = (node: Node) => {
        const chain: Element[] = [];
        for (let element = parentOf(node); element; element = parentOf(element)) {
          chain.push(element);
          if (element === scopeElement) break;
        }
        return chain;
      };
      const textNodes = (node: Node): Text[] => {
        if (node instanceof Text) return node.data.trim() ? [node] : [];
        const children: Node[] = [...node.childNodes];
        if (node instanceof Element && node.shadowRoot) children.push(node.shadowRoot);
        return children.flatMap(textNodes);
      };

      const clipsAxis = (value: string) => value === "hidden" || value === "clip";
      const scrollsAxis = (value: string) => value === "auto" || value === "scroll";
      const unseen = (chain: Element[]) =>
        !chain[0]!.checkVisibility({ visibilityProperty: true } as CheckVisibilityOptions) ||
        chain.some(
          (element) =>
            element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true",
        );
      /** A `clip` rect or `clip-path` that leaves at most 1px of the box, as sr-only does. */
      const clipsToNothing = (style: CSSStyleDeclaration) => {
        if (style.clipPath === "inset(50%)") return true;
        const rect = /^rect\(([^)]*)\)$/.exec(style.clip);
        if (!rect) return false;
        // An `auto` edge parses to NaN and keeps that side unclipped.
        const [top, right, bottom, left] = rect[1]!.split(/[\s,]+/).map(parseFloat);
        return right! - left! <= 1 || bottom! - top! <= 1;
      };
      const visuallyHidden = (chain: Element[]) =>
        chain.some((element) => {
          const style = getComputedStyle(element);
          if (clipsToNothing(style)) return true;
          if (!clipsAxis(style.overflowX) && !clipsAxis(style.overflowY)) return false;
          const box = element.getBoundingClientRect();
          return box.width <= 1 || box.height <= 1;
        });

      const clipped = (text: Text, chain: Element[]) => {
        const range = document.createRange();
        range.selectNodeContents(text);
        const rects = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
        if (rects.length === 0) return false;
        const left = Math.min(...rects.map((rect) => rect.left));
        const right = Math.max(...rects.map((rect) => rect.right));
        const top = Math.min(...rects.map((rect) => rect.top));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        for (const element of chain) {
          const style = getComputedStyle(element);
          const clipsX = clipsAxis(style.overflowX);
          const clipsY = clipsAxis(style.overflowY);
          const overflowsX = element.scrollWidth > element.clientWidth + 1;
          const overflowsY = element.scrollHeight > element.clientHeight + 1;
          const outer = element.getBoundingClientRect();
          const boxLeft = outer.left + element.clientLeft;
          const boxTop = outer.top + element.clientTop;
          if (
            clipsX &&
            overflowsX &&
            (left < boxLeft - 1 || right > boxLeft + element.clientWidth + 1)
          ) {
            return true;
          }
          if (
            clipsY &&
            overflowsY &&
            (top < boxTop - 1 || bottom > boxTop + element.clientHeight + 1)
          ) {
            return true;
          }
          if (scrollsAxis(style.overflowX) || scrollsAxis(style.overflowY)) return false;
        }
        return false;
      };

      // Role and name, never generated ids, so the same build gives the same keys.
      const describe = (element: Element) => {
        const root = element.getRootNode() as Document | ShadowRoot;
        const labelled = element.getAttribute("aria-labelledby");
        const name =
          element.getAttribute("aria-label") ||
          (labelled &&
            labelled
              .split(/\s+/)
              .map((id) => root.getElementById(id)?.textContent ?? "")
              .join(" ")) ||
          element.getAttribute("title") ||
          element.textContent ||
          "";
        const role = element.getAttribute("role") || element.localName;
        return `${role} "${name.replace(/\s+/g, " ").trim().slice(0, 80)}"`;
      };

      const findings = new Set<string>();
      for (const text of textNodes(scopeElement)) {
        const chain = ancestorsOf(text);
        if (chain.length === 0 || unseen(chain) || visuallyHidden(chain)) continue;
        if (!clipped(text, chain)) continue;
        const inside = chain.slice(0, chain.indexOf(scopeElement));
        const target = inside.find((element) => element.matches(semantic)) ?? chain[0]!;
        findings.add(`${criterion} text-clipped: ${describe(target)}`);
      }
      return [...findings].sort();
    },
    { region: handle, criterion },
  );
}

/** Compares findings with a page's known ones; duplicates count once. */
export function diffBaseline(known: string[], findings: string[]) {
  const actual = [...new Set(findings)].sort();
  return {
    added: actual.filter((finding) => !known.includes(finding)),
    fixed: [...new Set(known)].filter((finding) => !actual.includes(finding)),
  };
}

/** Replaces a baseline file with the findings, sorted and unique; no findings deletes the file. */
export function writeFindings(file: string, findings: string[]) {
  const actual = [...new Set(findings)].sort();
  if (actual.length === 0) {
    rmSync(file, { force: true });
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(actual, null, 2)}\n`);
  // Leave the file as `pnpm format:check` expects it.
  execFileSync("pnpm", ["exec", "oxfmt", "--write", file]);
}

const orientationPatterns = [
  /screen\.orientation\??\.lock\s*(?:\?\.)?\(/g,
  // A media feature, in CSS `@media` or `matchMedia`.
  /\(\s*orientation\s*:\s*(?:portrait|landscape)\b/g,
  // Tailwind's orientation variants in a class list, alone or stacked after others.
  /(?:^|[\s"'`:])(?:portrait|landscape):[\w[-]/g,
];

/** What in `source` locks the screen orientation or styles by it (1.3.4). */
export function orientationLocks(source: string) {
  return orientationPatterns.flatMap((pattern) =>
    [...source.matchAll(pattern)].map(([match]) => match.trim()),
  );
}
