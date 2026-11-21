import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { componentSlugs, readBaseline, visitExample } from "./wcag.js";
import {
  clippedTextFindings,
  collectPageErrors,
  diffBaseline,
  enlargeText,
  orientationLocks,
  spaceText,
  textBaselineFile,
  writeFindings,
} from "./text-presentation.js";

// Text presentation sweep over every component page of the production docs build:
// - 1.3.4 Orientation: the page works in landscape and portrait phone viewports without
//   horizontal overflow, and no source locks or restyles by orientation;
// - 1.4.4 Resize Text: with the root font size at 200% (rem-based text scales, the viewport does
//   not), no text in the live example is clipped or truncated;
// - 1.4.12 Text Spacing: the same after the WCAG text-spacing overrides.
// Known clipped-text findings are listed in e2e/text-presentation-baseline/<slug>.json, with the
// same contract as the WCAG sweep: new findings fail, and so do listed ones that no longer occur
// until `pnpm test:text:baseline` rewrites the file.

test.describe.configure({ mode: "parallel" });

const packagesDir = fileURLToPath(new URL("../packages/", import.meta.url));
const sourceRoots = readdirSync(packagesDir)
  .map((name) => `${packagesDir}${name}/src/`)
  .filter((root) => existsSync(root))
  .concat(fileURLToPath(new URL("../apps/docs/src/", import.meta.url)));

test("1.3.4: no source locks the orientation or styles by it", () => {
  const sources = sourceRoots.flatMap((root) =>
    readdirSync(root, { recursive: true, encoding: "utf8" })
      .filter((file) => /\.(?:tsx?|css|m?js|html)$/.test(file) && !file.includes(".test."))
      .map((file) => `${root}${file}`),
  );
  expect(sources.length, "The scan must find the source files").toBeGreaterThan(100);
  const locks = sources.flatMap((file) =>
    orientationLocks(readFileSync(file, "utf8")).map((match) => `${file}: ${match}`),
  );
  expect(locks).toEqual([]);
});

test.describe("1.3.4 orientation", () => {
  // A plain viewport with touch, not `isMobile`: Firefox has no mobile emulation, and the check
  // only needs the page laid out at phone sizes in both orientations.
  test.use({ hasTouch: true });

  const orientations = [
    { name: "landscape", width: 844, height: 390 },
    { name: "portrait", width: 390, height: 844 },
  ];

  for (const slug of componentSlugs) {
    test(`1.3.4 orientation: ${slug}`, async ({ page }) => {
      const errors = collectPageErrors(page);
      for (const { name, width, height } of orientations) {
        await page.setViewportSize({ width, height });
        await visitExample(page, slug);
        const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(
          documentWidth,
          `${slug} overflows horizontally in ${name} (${width}x${height})`,
        ).toBeLessThanOrEqual(width);
      }
      expect(errors, `${slug} logged page errors`).toEqual([]);
    });
  }
});

test.describe("1.4.4 and 1.4.12 text", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const slug of componentSlugs) {
    test(`1.4.4 and 1.4.12 text: ${slug}`, async ({ page, browserName }) => {
      // enlargeText changes the browser's default font size through the Chromium DevTools
      // protocol; other engines have no equivalent Playwright API.
      test.skip(browserName !== "chromium", "enlargeText needs the Chromium DevTools protocol");
      const errors = collectPageErrors(page);

      const resized = await visitExample(page, slug);
      await enlargeText(page);
      const findings = await clippedTextFindings(page, resized, "1.4.4");

      const spaced = await visitExample(page, slug);
      await spaceText(page);
      findings.push(...(await clippedTextFindings(page, spaced, "1.4.12")));

      const file = textBaselineFile(slug);
      if (process.env.TEXT_BASELINE === "update") {
        writeFindings(file, findings);
      } else {
        const { added, fixed } = diffBaseline(readBaseline(file), findings);
        expect(added, `New clipped text on ${slug}`).toEqual([]);
        expect(
          fixed,
          `Fixed findings still listed in e2e/text-presentation-baseline/${slug}.json; run pnpm test:text:baseline`,
        ).toEqual([]);
      }
      expect(errors, `${slug} logged page errors`).toEqual([]);
    });
  }
});
