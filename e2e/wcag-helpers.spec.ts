import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  compareWithBaseline,
  entrySlugs,
  keyboardFindings,
  readBaseline,
  visitExample,
  wcagAxeFindings,
  writeBaseline,
} from "./wcag.js";

// Regression tests for the WCAG sweep helpers in e2e/wcag.ts. Each hostile input gets a page
// built with setContent (or a route fulfilled by the docs server) so the helpers see exactly the
// markup the criterion describes; the sweep itself is e2e/wcag.spec.ts.

const liveExample = (content: string) =>
  `<main><section role="region" aria-label="Live example">${content}</section></main>`;

const region = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Live example", exact: true });

test("only component entry files become sweep pages", () => {
  expect(
    entrySlugs(["tabs.ts", "tabs.test.ts", "catalog.test.ts", "README.md", "alert.ts"]),
  ).toEqual(["alert", "tabs"]);
});

test("a page that answers 404 fails by its slug", async ({ page }) => {
  await page.route("**/components/missing-page", (route) =>
    route.fulfill({ status: 404, contentType: "text/plain", body: "Not found" }),
  );
  await expect(visitExample(page, "missing-page")).rejects.toThrow("missing-page: HTTP 404");
});

test("an example still on Loading fails by its slug", async ({ page }) => {
  await page.route("**/components/stuck-example", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: liveExample("<p>Loading example…</p>"),
    }),
  );
  await expect(visitExample(page, "stuck-example")).rejects.toThrow(
    'stuck-example: example stayed on "Loading example…"',
  );
});

test("a page without a Live example region fails by its slug", async ({ page }) => {
  await page.route("**/components/no-example", (route) =>
    route.fulfill({ contentType: "text/html", body: "<main><p>Plain page</p></main>" }),
  );
  await expect(visitExample(page, "no-example")).rejects.toThrow(
    "no-example: no Live example region",
  );
});

test("unreadable text is left to the consumer: no color-contrast finding", async ({ page }) => {
  await page.setContent(liveExample('<p style="color:#ccc;background:#fff">Faint text</p>'));
  expect(await wcagAxeFindings(page, region(page))).toEqual([]);
});

test("a button with no accessible name is an axe:button-name finding", async ({ page }) => {
  await page.setContent(liveExample("<button></button>"));
  expect(await wcagAxeFindings(page, region(page))).toEqual(['axe:button-name: button ""']);
});

test("finding keys ignore generated ids", async ({ page }) => {
  const findingsWithId = async (id: string) => {
    await page.setContent(liveExample(`<input id="${id}">`));
    return wcagAxeFindings(page, region(page));
  };
  const first = await findingsWithId("_r_1_");
  expect(first).toEqual(['axe:label: input ""']);
  expect(await findingsWithId("_r_9_")).toEqual(first);
});

test("duplicate findings on one page are stored once", async ({ page }) => {
  await page.setContent(liveExample("<button></button><button></button>"));
  const findings = await wcagAxeFindings(page, region(page));
  expect(findings).toEqual(['axe:button-name: button ""', 'axe:button-name: button ""']);
  expect(compareWithBaseline("no-such-page", findings).added).toEqual([
    'axe:button-name: button ""',
  ]);
});

test("content outside the example covering the focused control is focus-obscured", async ({
  page,
}) => {
  await page.setContent(
    `${liveExample("<button>Open</button><button>Save</button>")}<div style="position:fixed;inset:0;background:#fff"></div>`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'focus-obscured: button "Open"',
    'focus-obscured: button "Save"',
  ]);
});

test("a Tab keydown that is prevented is a keyboard-trap", async ({ page }) => {
  await page.setContent(
    liveExample('<div role="button" tabindex="0">Trap</div><button>After</button>'),
  );
  await page.evaluate(() => {
    document.querySelector<HTMLElement>("[role='button']")!.addEventListener("keydown", (event) => {
      if (event.key === "Tab") event.preventDefault();
    });
  });
  expect(await keyboardFindings(page, region(page))).toEqual(['keyboard-trap: button "Trap"']);
});

test("Tab that never leaves the example within 60 stops is a keyboard-trap on the last stop", async ({
  page,
}) => {
  const buttons = Array.from({ length: 70 }, (_, index) => `<button>Button ${index + 1}</button>`);
  await page.setContent(liveExample(buttons.join("")));
  expect(await keyboardFindings(page, region(page))).toEqual(['keyboard-trap: button "Button 60"']);
});

test("a visually hidden checkbox inside its label is not focus-obscured", async ({ page }) => {
  // A badge outside the example covers the label's corner, where the 1px input sits; the rest
  // of the label (what a sighted user sees as the checkbox) stays visible, so it is not obscured.
  await page.setContent(
    `<style>body { margin: 0 }</style>${liveExample(
      '<label style="position:relative;display:block;width:160px;height:40px"><input type="checkbox" style="position:absolute;top:0;left:0;opacity:0;width:1px;height:1px;margin:0"><span>Accept terms</span></label>',
    )}<div style="position:fixed;top:0;left:0;width:24px;height:24px;background:#fff"></div>`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("the focused element's own ancestors outside the example do not obscure it", async ({
  page,
}) => {
  // The button ignores pointer events and is painted below the region's box, so hit-testing
  // falls through to the page's body: an ancestor, not content covering it.
  await page.setContent(
    liveExample(
      '<div style="position:relative;height:20px"><button style="position:absolute;top:200px;pointer-events:none">Floating</button></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("smooth scrolling does not hide a control from the focus-obscured check", async ({ page }) => {
  // Mid-scroll, Step 1 is still off screen and would not be judged; at rest the fixed header
  // covers it, which is a real finding.
  await page.setContent(
    `<style>html { scroll-behavior: smooth } body { margin: 0 }</style><header style="position:fixed;top:0;left:0;right:0;height:120px;background:#fff;z-index:1"></header>${liveExample(
      '<button style="display:block;height:40px">Step 1</button><div style="height:3000px"></div>',
    )}`,
  );
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  expect(await keyboardFindings(page, region(page))).toEqual(['focus-obscured: button "Step 1"']);
});

test("smooth scrolling does not create false focus-obscured findings", async ({ page }) => {
  // scroll-padding-top keeps a focused control clear of the fixed header at rest. Step 1 starts
  // half under the header, so mid-scroll it would still be covered.
  await page.setContent(
    `<style>html { scroll-behavior: smooth; scroll-padding-top: 140px } body { margin: 0 }</style><header style="position:fixed;top:0;left:0;right:0;height:120px;background:#fff;z-index:1"></header>${liveExample(
      '<div style="height:140px"></div><button style="display:block;height:100px">Step 1</button><div style="height:3000px"></div>',
    )}`,
  );
  await page.evaluate(() => window.scrollTo({ top: 190, behavior: "instant" }));
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a surface the example opened is not counted as covering its trigger", async ({ page }) => {
  // The popover lives in body, outside the region, as portalled overlays do.
  await page.setContent(
    `${liveExample("<button>Open</button>")}<div id="sheet" popover="manual" style="inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;background:#fff"><button>Inside</button></div>`,
  );
  await page.evaluate(() => document.getElementById("sheet")!.showPopover());
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a baseline file that is not valid JSON fails naming the file", () => {
  const dir = mkdtempSync(join(tmpdir(), "wcag-baseline-"));
  const file = join(dir, "broken.json");
  try {
    writeFileSync(file, '["axe:button-name: button \\"\\""');
    expect(() => readBaseline(file)).toThrow(file);
    writeFileSync(file, '{"not": "an array"}');
    expect(() => readBaseline(file)).toThrow(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a listed finding that no longer occurs is reported as fixed", () => {
  expect(compareWithBaseline("color-picker", [])).toEqual({
    added: [],
    fixed: ['axe:label-content-name-mismatch: button "Choose accent color"'],
  });
});

test("a finding missing from the baseline is reported as added", () => {
  expect(
    compareWithBaseline("color-picker", [
      'axe:label-content-name-mismatch: button "Choose accent color"',
      'axe:button-name: button ""',
    ]),
  ).toEqual({ added: ['axe:button-name: button ""'], fixed: [] });
});

test("writeBaseline writes sorted unique findings and deletes an empty file", () => {
  const slug = "zz-wcag-helper-fixture";
  const file = fileURLToPath(new URL(`./wcag-baseline/${slug}.json`, import.meta.url));
  try {
    writeBaseline(slug, ["b", "a", "b"]);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(["a", "b"]);
    writeBaseline(slug, []);
    expect(existsSync(file)).toBe(false);
  } finally {
    rmSync(file, { force: true });
  }
});
