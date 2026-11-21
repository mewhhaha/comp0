import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  clippedTextFindings,
  collectPageErrors,
  diffBaseline,
  enlargeText,
  orientationLocks,
  spaceText,
  writeFindings,
} from "./text-presentation.js";

// Regression tests for the text presentation helpers in e2e/text-presentation.ts. Each case is a
// page built with setContent, so the detector sees exactly the markup it describes; the sweep
// itself is e2e/text-presentation.spec.ts.

const liveExample = (content: string) =>
  `<main><section role="region" aria-label="Live example">${content}</section></main>`;

async function findingsFor(page: Page, content: string) {
  await page.setContent(liveExample(content));
  return clippedTextFindings(
    page,
    page.getByRole("region", { name: "Live example", exact: true }),
    "1.4.4",
  );
}

const fixedBox = "width:80px;height:20px;overflow:hidden;font:16px/20px sans-serif";
const srOnly =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";

test.describe("clipped text detector", () => {
  test("flags a span clipped by a fixed-size overflow:hidden box", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="${fixedBox}"><span>Shipping address and billing details</span></div>`,
      ),
    ).toEqual(['1.4.4 text-clipped: span "Shipping address and billing details"']);
  });

  test("flags text truncated with an ellipsis, keyed by its control", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<button style="width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span>Save all changes</span></button>`,
      ),
    ).toEqual(['1.4.4 text-clipped: button "Save all changes"']);
  });

  test("flags ellipsis truncation on overflow:clip", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<p style="width:70px;white-space:nowrap;overflow:clip;text-overflow:ellipsis">Quarterly revenue report</p>`,
      ),
    ).toEqual(['1.4.4 text-clipped: p "Quarterly revenue report"']);
  });

  test("ignores visually hidden text: an icon-only button with an sr-only label", async ({
    page,
  }) => {
    expect(
      await findingsFor(
        page,
        `<button style="width:24px;height:24px;overflow:hidden"><svg aria-hidden="true" width="16" height="16"></svg><span style="${srOnly}">Delete file permanently</span></button>`,
      ),
    ).toEqual([]);
  });

  test("ignores text hidden with clip-path: inset(50%)", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="${fixedBox};position:relative"><span style="clip-path:inset(50%);position:absolute;white-space:nowrap">Hidden label text here</span></div>`,
      ),
    ).toEqual([]);
  });

  test("ignores text hidden with clip: rect(0 0 0 0)", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="${fixedBox};position:relative"><span style="clip:rect(0 0 0 0);position:absolute;white-space:nowrap">Hidden label text here</span></div>`,
      ),
    ).toEqual([]);
  });

  test("a rounded clip-path card still reports the clipped box inside it", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="clip-path:inset(0 round 8px);padding:8px"><div style="${fixedBox}"><span>Shipping address and billing details</span></div></div>`,
      ),
    ).toEqual(['1.4.4 text-clipped: span "Shipping address and billing details"']);
  });

  test("ignores a horizontally scrolling code block", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<pre style="width:120px;overflow:auto"><code>const veryLongIdentifierName = computeSomethingLong(argumentOne);</code></pre>`,
      ),
    ).toEqual([]);
  });

  test("ignores aria-hidden, [hidden], display:none, and visibility:hidden text", async ({
    page,
  }) => {
    expect(
      await findingsFor(
        page,
        [
          `<div style="${fixedBox}" aria-hidden="true"><span>Decorative long caption text</span></div>`,
          // A display utility on a [hidden] element overrides the browser's display: none.
          `<div style="${fixedBox}"><span hidden style="display:inline">Hidden long caption text here</span></div>`,
          `<div style="${fixedBox};display:none"><span>Undisplayed long caption text</span></div>`,
          `<div style="${fixedBox}"><span style="visibility:hidden">Invisible long caption text</span></div>`,
        ].join(""),
      ),
    ).toEqual([]);
  });

  test("ignores text in a closed accordion panel (grid-rows 0fr, overflow hidden)", async ({
    page,
  }) => {
    expect(
      await findingsFor(
        page,
        `<div style="display:grid;grid-template-rows:0fr;overflow:hidden"><div style="min-height:0;overflow:hidden"><p>Returns are accepted within 30 days.</p></div></div>`,
      ),
    ).toEqual([]);
  });

  test("ignores text that fits", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="width:300px;height:40px;overflow:hidden;font:16px/20px sans-serif"><button>Save</button></div>`,
      ),
    ).toEqual([]);
  });

  test("an empty example has no findings", async ({ page }) => {
    expect(await findingsFor(page, "")).toEqual([]);
  });

  test("ignores clipped text outside the live example", async ({ page }) => {
    await page.setContent(
      `<div style="${fixedBox}">Navigation text that overflows</div>${liveExample("<p>Fits</p>")}`,
    );
    expect(
      await clippedTextFindings(
        page,
        page.getByRole("region", { name: "Live example", exact: true }),
        "1.4.4",
      ),
    ).toEqual([]);
  });

  test("ignores text clipped by an ancestor above the live example", async ({ page }) => {
    // The docs chrome around the example is out of scope, even when it clips the example.
    await page.setContent(
      `<div style="${fixedBox}">${liveExample('<p style="margin:0;white-space:nowrap">Caption wider than the docs column</p>')}</div>`,
    );
    expect(
      await clippedTextFindings(
        page,
        page.getByRole("region", { name: "Live example", exact: true }),
        "1.4.4",
      ),
    ).toEqual([]);
  });

  test("keys findings by role and name, not generated ids", async ({ page }) => {
    const keyWithId = (id: string) =>
      findingsFor(
        page,
        `<div style="${fixedBox}"><span role="status" id="${id}" aria-label="Upload progress">Uploading forty files now</span></div>`,
      );
    const first = await keyWithId("_r_1_");
    expect(first).toEqual(['1.4.4 text-clipped: status "Upload progress"']);
    expect(await keyWithId("_r_9_")).toEqual(first);
  });

  test("texts sharing a long prefix get distinct keys", async ({ page }) => {
    const box = (text: string) => `<div style="${fixedBox}"><span>${text}</span></div>`;
    expect(
      await findingsFor(
        page,
        box("Shipping address and billing details for the first order") +
          box("Shipping address and billing details for the second order"),
      ),
    ).toEqual([
      '1.4.4 text-clipped: span "Shipping address and billing details for the first order"',
      '1.4.4 text-clipped: span "Shipping address and billing details for the second order"',
    ]);
  });

  test("reports each clipped text once", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<button style="width:60px;height:20px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">Archive <b>every</b> message</button>`,
      ),
    ).toEqual(['1.4.4 text-clipped: button "Archive every message"']);
  });
});

test.describe("clipped text detector, nested", () => {
  test("a clipped box inside a fitting clipped box flags only the inner text", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="width:400px;height:80px;overflow:hidden;font:16px/20px sans-serif"><p>Outer caption</p><div style="${fixedBox}"><span>Inner caption that overflows</span></div></div>`,
      ),
    ).toEqual(['1.4.4 text-clipped: span "Inner caption that overflows"']);
  });

  test("a clipped box inside a scroller is still flagged", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="width:300px;height:60px;overflow:auto"><div style="${fixedBox}"><span>Inner caption that overflows</span></div></div>`,
      ),
    ).toEqual(['1.4.4 text-clipped: span "Inner caption that overflows"']);
  });

  test("a scroller inside a clipped box is not flagged", async ({ page }) => {
    expect(
      await findingsFor(
        page,
        `<div style="width:200px;height:60px;overflow:hidden"><pre style="width:120px;height:40px;margin:0;overflow:auto">const veryLongIdentifierName = 1;</pre></div>`,
      ),
    ).toEqual([]);
  });

  test("a scroller inside a clipping card is not flagged; the card's own overflow is", async ({
    page,
  }) => {
    // The card clips the scroller's later items too, but they stay reachable by scrolling the
    // list; only the footer the list pushes out is lost.
    expect(
      await findingsFor(
        page,
        `<div style="width:200px;height:50px;overflow:hidden;font:16px/20px sans-serif"><ul style="height:40px;margin:0;padding:0;list-style:none;overflow:auto"><li>One scrolled item</li><li>Two scrolled item</li><li>Three scrolled item</li><li>Four scrolled item</li></ul><p style="margin:0">Card footer pushed out</p></div>`,
      ),
    ).toEqual(['1.4.4 text-clipped: p "Card footer pushed out"']);
  });

  test("text clipped inside a shadow root is flagged; sr-only text there is not", async ({
    page,
  }) => {
    await page.setContent(liveExample('<div id="host"></div>'));
    await page.evaluate(
      ({ box, hidden }) => {
        const root = document.getElementById("host")!.attachShadow({ mode: "open" });
        root.innerHTML = `<div style="${box}"><span>Shadow caption that overflows</span></div><button><span style="${hidden}">Close dialog window</span></button>`;
      },
      { box: fixedBox, hidden: srOnly },
    );
    expect(
      await clippedTextFindings(
        page,
        page.getByRole("region", { name: "Live example", exact: true }),
        "1.4.4",
      ),
    ).toEqual(['1.4.4 text-clipped: span "Shadow caption that overflows"']);
  });
});

const enlargeTextSkip =
  "enlargeText sets the default font size through the Chromium DevTools protocol";

test.describe("text adaptations", () => {
  test("enlargeText doubles rem-sized text, which a fixed-height box then clips (1.4.4)", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", enlargeTextSkip);
    await page.setContent(
      liveExample(
        '<div style="width:300px;height:24px;overflow:hidden;font-size:1rem;line-height:1.25">Due today</div>',
      ),
    );
    const region = page.getByRole("region", { name: "Live example", exact: true });
    expect(await clippedTextFindings(page, region, "1.4.4")).toEqual([]);
    await enlargeText(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(
      "32px",
    );
    expect(await clippedTextFindings(page, region, "1.4.4")).toEqual([
      '1.4.4 text-clipped: div "Due today"',
    ]);
  });

  test("enlargeText scales rem in media queries too, like the browser setting", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", enlargeTextSkip);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(
      '<style>#rail { display: none } @media (min-width: 64rem) { #rail { display: block } }</style><div id="rail">Rail</div>',
    );
    await expect(page.locator("#rail")).toBeVisible();
    await enlargeText(page);
    await expect(page.locator("#rail")).toBeHidden();
  });

  test("spaceText applies the WCAG overrides over inline styles (1.4.12)", async ({ page }) => {
    await page.setContent(
      liveExample(
        '<div style="width:300px;height:30px;overflow:hidden;font:16px/14px sans-serif">Due today<br> and tomorrow</div><p id="para" style="margin:0">Paragraph</p>',
      ),
    );
    const region = page.getByRole("region", { name: "Live example", exact: true });
    expect(await clippedTextFindings(page, region, "1.4.12")).toEqual([]);
    await spaceText(page);
    expect(
      await page.locator("#para").evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.lineHeight, style.letterSpacing, style.wordSpacing, style.marginBottom];
      }),
    ).toEqual(["24px", "1.92px", "2.56px", "32px"]);
    expect(await clippedTextFindings(page, region, "1.4.12")).toEqual([
      '1.4.12 text-clipped: div "Due today and tomorrow"',
    ]);
  });
});

test("a page error during load is collected, so the page's test fails", async ({ page }) => {
  await page.route("**/components/throws", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `${liveExample("<p>Example</p>")}<script>throw new Error("example crashed")</script>`,
    }),
  );
  const errors = collectPageErrors(page);
  await page.goto("/components/throws");
  await expect.poll(() => errors).toEqual(["example crashed"]);
});

test.describe("text presentation baseline", () => {
  test("new findings are added and missing ones are fixed; duplicates count once", () => {
    expect(diffBaseline(["a", "b"], ["b", "c", "c"])).toEqual({ added: ["c"], fixed: ["a"] });
    expect(diffBaseline([], [])).toEqual({ added: [], fixed: [] });
  });

  test("writing findings sorts them, formats the file, and deletes it when empty", () => {
    const dir = mkdtempSync(join(tmpdir(), "text-baseline-"));
    const file = join(dir, "nested", "page.json");
    try {
      writeFindings(file, ["b", "a", "b"]);
      expect(readFileSync(file, "utf8")).toBe('["a", "b"]\n');
      writeFindings(file, []);
      expect(existsSync(file)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

test.describe("orientation lock matcher", () => {
  for (const source of [
    'screen.orientation.lock("portrait");',
    'screen.orientation?.lock("portrait");',
    "@media (orientation: portrait) { .a { display: none } }",
    "@media screen and (orientation:landscape) { .a { rotate: 90deg } }",
    'window.matchMedia("(orientation: portrait)")',
    'className="landscape:hidden"',
    'className="flex portrait:rotate-90"',
    'className="md:portrait:hidden"',
    'className="dark:landscape:flex"',
  ]) {
    test(`flags ${JSON.stringify(source)}`, () => {
      expect(orientationLocks(source)).toHaveLength(1);
    });
  }

  for (const source of [
    'orientation: "horizontal",',
    "function move({\n  orientation: direction,\n}) {}",
    "useRoving(\n  orientation: Orientation,\n)",
    '<div aria-orientation="vertical" />',
    'className="data-[orientation=vertical]:flex-col"',
    "Shown in landscape: wide charts fit.",
  ]) {
    test(`does not flag ${JSON.stringify(source)}`, () => {
      expect(orientationLocks(source)).toEqual([]);
    });
  }
});
