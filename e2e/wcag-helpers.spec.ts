import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { axeViolations } from "./axe.js";
import {
  compareWithBaseline,
  entrySlugs,
  keyboardFindings,
  openedStateFindings,
  readBaseline,
  visitExample,
  wcagAxeFindings,
  writeBaseline,
  writeBrowserBaseline,
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
      // WebKit decodes a fulfilled body as Latin-1 despite the header's charset.
      body: `<meta charset="utf-8">${liveExample("<p>Loading example…</p>")}`,
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

// The docs stream an example's server HTML inside React Suspense markers, then React renders
// that boundary again on the client, showing "Loading example…" for a moment. The fixture's
// script plays that part, tagging its elements with React's fiber key as React does.
const streamedExample = (rerender: string) =>
  `<meta charset="utf-8"><main><section role="region" aria-label="Live example"><!--$--><button>Server</button><!--/$--></section></main><script>${rerender}</script>`;
const clientRender = `
  const region = document.querySelector("section");
  setTimeout(() => {
    region.innerHTML = "<output>Loading example…</output>";
    setTimeout(() => {
      const button = Object.assign(document.createElement("button"), { textContent: "Client" });
      button.__reactFiber$fixture = {};
      region.replaceChildren(button);
    }, 300);
  }, 700);`;

test("an example streamed by the server is visited once the client has rendered it", async ({
  page,
}) => {
  await page.route("**/components/streamed-example", (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: streamedExample(clientRender) }),
  );
  const example = await visitExample(page, "streamed-example");
  // Read once, without auto-waiting: the helper itself must have waited for the client render.
  expect(await example.textContent()).toBe("Client");
});

test("an example whose server HTML is never rendered by the client fails by its slug", async ({
  page,
}) => {
  await page.route("**/components/dehydrated-example", (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: streamedExample("") }),
  );
  await expect(visitExample(page, "dehydrated-example")).rejects.toThrow(
    "dehydrated-example: example never rendered by the client",
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
  expect(compareWithBaseline("no-such-page", "chromium", findings).added).toEqual([
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

test("the last stop of the document leads out of the example in every engine, and the walk leaves no stop behind", async ({
  page,
}) => {
  // Nothing follows the example: Playwright's Firefox keeps focus on Save when Tab runs out.
  await page.setContent(liveExample("<button>Save</button>"));
  expect(await keyboardFindings(page, region(page))).toEqual([]);
  expect(await page.locator("[data-wcag-exit]").count()).toBe(0);
});

test("a prevented Tab inside a modal dialog the example opened is still a keyboard-trap", async ({
  page,
}) => {
  await page.setContent(
    `${liveExample('<button aria-controls="editor">Edit</button>')}<dialog id="editor" aria-label="Editor"><button>Stuck</button></dialog>`,
  );
  await page.evaluate(() => {
    const dialog = document.getElementById("editor") as HTMLDialogElement;
    dialog.querySelector("button")!.addEventListener("keydown", (event) => {
      if (event.key === "Tab") event.preventDefault();
    });
    dialog.showModal();
  });
  expect(await keyboardFindings(page, region(page))).toEqual(['keyboard-trap: button "Stuck"']);
});

test("a modal dialog nested in another modal leads out through the inner one, which is on top", async ({
  page,
}) => {
  // The outer dialog comes first in document order but is inert under the inner one, so a stop
  // placed in it could never take focus.
  await page.setContent(
    `${liveExample('<button aria-controls="outer">Edit</button>')}<dialog id="outer" aria-label="Outer"><button>Close</button><dialog id="inner" aria-label="Inner"><button>Confirm</button></dialog></dialog>`,
  );
  await page.evaluate(() => {
    (document.getElementById("outer") as HTMLDialogElement).showModal();
    (document.getElementById("inner") as HTMLDialogElement).showModal();
  });
  expect(await keyboardFindings(page, region(page))).toEqual([]);
  expect(await page.locator("[data-wcag-exit]").count()).toBe(0);
});

test("of two sibling modal dialogs the walk leaves through the one on top", async ({ page }) => {
  await page.setContent(
    `${liveExample('<button aria-controls="first">A</button><button aria-controls="second">B</button>')}<dialog id="first" aria-label="First"><button>A1</button></dialog><dialog id="second" aria-label="Second"><button>B1</button></dialog>`,
  );
  await page.evaluate(() => {
    (document.getElementById("first") as HTMLDialogElement).showModal();
    (document.getElementById("second") as HTMLDialogElement).showModal();
  });
  expect(await keyboardFindings(page, region(page))).toEqual([]);
  expect(await page.locator("[data-wcag-exit]").count()).toBe(0);
});

test("a modal dialog whose script wraps Tab from its last stop to its first is not a keyboard-trap", async ({
  page,
}) => {
  // Keeping Tab inside a modal is what a modal does (2.1.2 allows it: Escape or a button leaves
  // it); the walk still leaves the example through its own stop at the end of the modal.
  await page.setContent(
    `${liveExample('<button aria-controls="editor">Edit</button>')}<dialog id="editor" aria-label="Editor"><button>First</button><button>Last</button></dialog>`,
  );
  await page.evaluate(() => {
    const dialog = document.getElementById("editor") as HTMLDialogElement;
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const stops = [
        ...dialog.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'),
      ];
      const edge = event.shiftKey ? stops[0] : stops.at(-1);
      if (document.activeElement !== edge) return;
      event.preventDefault();
      (event.shiftKey ? stops.at(-1) : stops[0])!.focus();
    });
    dialog.showModal();
  });
  expect(await keyboardFindings(page, region(page))).toEqual([]);
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
    `${liveExample('<button aria-controls="sheet">Open</button>')}<div id="sheet" popover="manual" style="inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;background:#fff"><button>Inside</button></div>`,
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
  expect(compareWithBaseline("color-picker", "chromium", [])).toEqual({
    added: [],
    fixed: ['axe:label-content-name-mismatch: button "Choose accent color"'],
  });
});

test("a finding missing from the baseline is reported as added", () => {
  expect(
    compareWithBaseline("color-picker", "chromium", [
      'axe:label-content-name-mismatch: button "Choose accent color"',
      'axe:button-name: button ""',
    ]),
  ).toEqual({ added: ['axe:button-name: button ""'], fixed: [] });
});

/** A baseline fixture slug of the running project's own, so the browser projects never share a file. */
const fixtureSlug = (name: string) => `zz-wcag-${name}-${test.info().project.name}`;
const baselineFile = (name: string) =>
  fileURLToPath(new URL(`./wcag-baseline/${name}.json`, import.meta.url));

test("writeBaseline writes sorted unique findings and deletes an empty file", () => {
  const slug = fixtureSlug("helper-fixture");
  const file = baselineFile(slug);
  try {
    writeBaseline(slug, ["b", "a", "b"]);
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(["a", "b"]);
    writeBaseline(slug, []);
    expect(existsSync(file)).toBe(false);
  } finally {
    rmSync(file, { force: true });
  }
});

test("a browser's own baseline file replaces the shared one for that browser only", () => {
  const slug = fixtureSlug("browser-fixture");
  const files = [baselineFile(slug), baselineFile(`${slug}.webkit`)];
  try {
    writeFileSync(files[0]!, '["shared"]');
    writeFileSync(files[1]!, '["webkit only"]');
    expect(compareWithBaseline(slug, "webkit", ["webkit only"])).toEqual({ added: [], fixed: [] });
    expect(compareWithBaseline(slug, "chromium", ["webkit only"])).toEqual({
      added: ["webkit only"],
      fixed: ["shared"],
    });
    expect(compareWithBaseline(slug, "firefox", ["shared"])).toEqual({ added: [], fixed: [] });
  } finally {
    for (const file of files) rmSync(file, { force: true });
  }
});

test("writeBrowserBaseline keeps a browser file only while its findings differ from the shared one", () => {
  const slug = fixtureSlug("browser-write-fixture");
  const shared = baselineFile(slug);
  const own = baselineFile(`${slug}.firefox`);
  try {
    writeBaseline(slug, ["a"]);
    writeBrowserBaseline(slug, "firefox", ["b", "a", "b"]);
    expect(JSON.parse(readFileSync(own, "utf8"))).toEqual(["a", "b"]);
    // No findings where the shared file lists some is a difference too.
    writeBrowserBaseline(slug, "firefox", []);
    expect(JSON.parse(readFileSync(own, "utf8"))).toEqual([]);
    writeBrowserBaseline(slug, "firefox", ["a", "a"]);
    expect(existsSync(own)).toBe(false);
    expect(JSON.parse(readFileSync(shared, "utf8"))).toEqual(["a"]);
  } finally {
    rmSync(shared, { force: true });
    rmSync(own, { force: true });
  }
});

test("the e2e axe helper leaves contrast and target size to the consumer", async ({ page }) => {
  await page.setContent(
    liveExample(
      '<p style="color:#ccc;background:#fff">Faint text</p><button style="width:4px;height:4px;padding:0">x</button><button></button>',
    ),
  );
  const ids = (await axeViolations(page, "section")).map(({ id }) => id);
  expect(ids).not.toContain("color-contrast");
  expect(ids).not.toContain("target-size");
  // The other rules still run.
  expect(ids).toContain("button-name");
});

// 2.1.1: every interactive element in the example must be reachable with Tab.

test("a clickable div without tabindex is keyboard-unreachable", async ({ page }) => {
  await page.setContent(liveExample('<div style="cursor:pointer">Pick me</div>'));
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: div "Pick me"',
  ]);
});

test("an element with an interactive role and no tabindex is keyboard-unreachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample('<span role="switch" aria-checked="false" aria-label="Wi-Fi"></span>'),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: switch "Wi-Fi"',
  ]);
});

test("a clickable div with tabindex=0 is reachable", async ({ page }) => {
  await page.setContent(liveExample('<div style="cursor:pointer" tabindex="0">Pick me</div>'));
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("native date and time inputs Tab enters are reachable", async ({ page }) => {
  // WebKit fires focus but no focusin when Tab enters their segments.
  await page.setContent(
    liveExample('<input type="date" aria-label="Day"><input type="time" aria-label="At">'),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("tabindex=-1 options of a roving listbox are reachable through the listbox", async ({
  page,
}) => {
  // No arrow handler in the fixture, so only the composite role exempts Pear.
  await page.setContent(
    liveExample(
      '<div role="listbox" aria-label="Fruit"><div role="option" tabindex="0" aria-selected="true" style="cursor:pointer">Apple</div><div role="option" tabindex="-1" aria-selected="false" style="cursor:pointer">Pear</div></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("options under an aria-activedescendant combobox are reachable through it", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<input role="combobox" aria-label="Fruit" aria-expanded="true" aria-controls="fruits" aria-activedescendant="apple"><div role="listbox" id="fruits" aria-label="Fruit"><div role="option" id="apple" aria-selected="true">Apple</div><div role="option" aria-selected="false">Pear</div></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("options of a listbox an aria-autocomplete input controls are reachable through it", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<input type="search" aria-label="City" aria-autocomplete="list" aria-controls="cities"><div role="listbox" id="cities" aria-label="Cities"><div role="option" tabindex="-1" aria-selected="false">Lisbon</div></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("unchecked native radios of a group whose member was focused are reachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<fieldset><legend>Shipping</legend><label><input type="radio" name="shipping" checked> Standard</label><label><input type="radio" name="shipping"> Express</label></fieldset>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("stepper buttons that control the focused field are reachable through it", async ({
  page,
}) => {
  // The spinbutton pattern: ArrowUp and ArrowDown in the field do what the buttons do.
  await page.setContent(
    liveExample(
      '<input id="tickets" type="number" aria-label="Tickets" value="2"><button type="button" tabindex="-1" aria-controls="tickets" aria-label="Increase tickets">+</button>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a roving tab stop beside the focused one is reachable with arrow keys", async ({ page }) => {
  // Split-button shape: one tab stop for the group; ArrowLeft and ArrowRight move between the
  // segments. Only ArrowLeft reaches "More" from "Save", so every direction must be tried.
  await page.setContent(
    liveExample(
      `<div role="group" aria-label="Save" onkeydown="const [save, more] = this.children; if (event.key === 'ArrowLeft' && document.activeElement === save) more.focus(); if (event.key === 'ArrowRight' && document.activeElement === more) save.focus();"><button type="button" tabindex="0">Save</button><button type="button" tabindex="-1" aria-label="More save options">v</button></div>`,
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a roving stop reached by ArrowRight then ArrowDown is reachable", async ({ page }) => {
  // Two-dimensional, like inventory cards: no single key repeated from the Tab stop reaches D.
  await page.setContent(
    liveExample(
      `<div onkeydown="const [a, b, , d] = this.children; if (event.key === 'ArrowRight' && document.activeElement === a) b.focus(); if (event.key === 'ArrowDown' && document.activeElement === b) d.focus();"><button tabindex="0">A</button><button tabindex="-1">B</button><button tabindex="-1">C</button><button tabindex="-1">D</button></div>`,
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual(['keyboard-unreachable: button "C"']);
});

test("a tabindex=-1 role=button beside a focused button with no arrow handler is unreachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<div><button tabindex="0">Bold</button><div role="button" tabindex="-1" style="cursor:pointer">Italic</div></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: button "Italic"',
  ]);
});

test("a tabindex=-1 button beside a focused link is unreachable", async ({ page }) => {
  await page.setContent(
    liveExample('<p><a href="#x" tabindex="0">Link</a><button tabindex="-1">Delete</button></p>'),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: button "Delete"',
  ]);
});

test("a clickable span in a tabindex=-1 wrapper beside a focused button is unreachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<div><button tabindex="0">Save</button><div tabindex="-1"><span style="cursor:pointer">Clickable</span></div></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: span "Clickable"',
  ]);
});

test("a surface an arrow key opens while probing a roving stop is closed again", async ({
  page,
}) => {
  // ArrowDown on the stop opens a menu (as a split button's menu button does); Escape closes it.
  await page.setContent(
    `${liveExample(
      `<div><button tabindex="0" aria-controls="menu" onkeydown="const menu = document.getElementById('menu'); if (event.key === 'ArrowDown') menu.showPopover(); if (event.key === 'Escape' && menu.matches(':popover-open')) menu.hidePopover();">Save</button><button tabindex="-1">Hidden from Tab</button></div>`,
    )}<div id="menu" popover="manual" role="menu" aria-label="Save"><div role="menuitem">Save as</div></div>`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: button "Hidden from Tab"',
  ]);
  expect(await page.locator("#menu").evaluate((menu) => menu.matches(":popover-open"))).toBe(false);
});

test("a tabindex=-1 button with no focused roving sibling is keyboard-unreachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<button type="button">Save</button><div><button type="button" tabindex="-1">Hidden from Tab</button></div>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([
    'keyboard-unreachable: button "Hidden from Tab"',
  ]);
});

test("a disabled button is not keyboard-unreachable", async ({ page }) => {
  await page.setContent(liveExample("<button disabled>Save</button>"));
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a label wrapping a visually hidden checkbox is not keyboard-unreachable", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<label style="cursor:pointer;position:relative"><input type="checkbox" style="position:absolute;opacity:0;width:1px;height:1px;margin:0"><span>Accept terms</span></label>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

// 2.4.11: what covers the focused element, and which surfaces are the example's.

test("a pointer-events:none fixed header covering the focused button is focus-obscured", async ({
  page,
}) => {
  await page.setContent(
    `<style>body { margin: 0 }</style><header style="position:fixed;top:0;left:0;right:0;height:300px;background:#fff;pointer-events:none;z-index:1"></header>${liveExample(
      "<button>Save</button>",
    )}`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual(['focus-obscured: button "Save"']);
});

test("transparent, opacity:0 and visibility:hidden overlays outside the example hide nothing", async ({
  page,
}) => {
  const overlay = "position:fixed;inset:0;pointer-events:none;z-index:1";
  await page.setContent(
    `${liveExample("<button>Save</button>")}<div style="${overlay}"></div><div style="${overlay};opacity:0"><div style="background:#fff;height:100%"></div></div><div style="${overlay};visibility:hidden;background:#fff"></div>`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a docs-shell header a control points at is not the example's and still obscures", async ({
  page,
}) => {
  // aria-controls names the header, but it is neither inside the example nor in the top layer.
  await page.setContent(
    `<style>body { margin: 0 }</style><header id="shell" style="position:fixed;top:0;left:0;right:0;height:300px;background:#fff;z-index:1"></header>${liveExample(
      '<button aria-controls="shell">Save</button>',
    )}`,
  );
  expect(await keyboardFindings(page, region(page))).toEqual(['focus-obscured: button "Save"']);
});

test("a pointer-events:none decorative child of the focused button does not obscure it", async ({
  page,
}) => {
  await page.setContent(
    liveExample(
      '<button style="position:relative;width:120px;height:40px"><span style="position:absolute;inset:0;background:#fff;pointer-events:none"></span>Save</button>',
    ),
  );
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("a page-level popover the example did not open covers the focused button", async ({
  page,
}) => {
  // Like the docs CommandPalette: open in the top layer, but not controlled by the example.
  await page.setContent(
    `${liveExample("<button>Open</button>")}<div id="palette" popover="manual" style="inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;background:#fff"><input aria-label="Search"></div>`,
  );
  await page.evaluate(() => document.getElementById("palette")!.showPopover());
  expect(await keyboardFindings(page, region(page))).toEqual(['focus-obscured: button "Open"']);
});

test("a surface opened from a surface the example opened is the example's too", async ({
  page,
}) => {
  // Nested: the menu's own button controls the submenu that covers everything.
  const sheet =
    "inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;background:#fff";
  await page.setContent(
    `${liveExample('<button aria-controls="menu">Open</button>')}<div id="menu" popover="manual"><button aria-controls="submenu">More</button></div><div id="submenu" popover="manual" style="${sheet}"><button>Pick</button></div>`,
  );
  await page.evaluate(() => {
    document.getElementById("menu")!.showPopover();
    document.getElementById("submenu")!.showPopover();
  });
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

test("focus inside a modal dialog the example opened is still in the example", async ({ page }) => {
  // The dialog is portalled to body and covers the page; its button is focused and not obscured.
  await page.setContent(
    `${liveExample('<button aria-controls="editor">Edit</button>')}<dialog id="editor" aria-label="Editor" style="inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0"><button>Inside</button></dialog>`,
  );
  await page.evaluate(() => (document.getElementById("editor") as HTMLDialogElement).showModal());
  expect(await keyboardFindings(page, region(page))).toEqual([]);
});

// Opened states: every opener in the example is opened with the keyboard and axe-checked.

/** Serves `body` at /components/<slug> so the opener check can restore it by reloading. */
async function visitFixture(page: Page, slug: string, body: string) {
  await page.route(`**/components/${slug}`, (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body }),
  );
  return visitExample(page, slug);
}

const missingAlt = '<img src="data:,">';

test("a listbox popover opened from its button is axe-checked, prefixed with the opener", async ({
  page,
}) => {
  // The popover is portalled to body, outside the region; aria-controls resolves it.
  const scope = await visitFixture(
    page,
    "opener-listbox",
    `${liveExample(
      '<button aria-haspopup="listbox" aria-controls="fruits" popovertarget="fruits">Fruit</button>',
    )}<div id="fruits" popover="auto" role="listbox" aria-label="Fruit"><div>Apple</div></div>`,
  );
  expect(await openedStateFindings(page, "opener-listbox", scope)).toEqual([
    'open(button "Fruit") axe:aria-required-children: listbox "Fruit"',
  ]);
});

test("submit buttons, links and file inputs are never activated", async ({ page }) => {
  let navigated = false;
  await page.route("**/components/elsewhere", (route) => {
    navigated = true;
    return route.fulfill({ contentType: "text/html", body: "<p>Elsewhere</p>" });
  });
  const scope = await visitFixture(
    page,
    "opener-hazards",
    liveExample(
      `<form onsubmit="event.preventDefault(); sessionStorage.setItem('submitted', '1')"><button aria-haspopup="menu" aria-expanded="false">Send</button></form><a href="/components/elsewhere" aria-haspopup="true" aria-expanded="false">Away</a><label aria-haspopup="dialog" aria-expanded="false">Upload <input type="file" aria-expanded="false"></label>`,
    ),
  );
  let chooser = false;
  page.on("filechooser", () => {
    chooser = true;
  });
  expect(await openedStateFindings(page, "opener-hazards", scope)).toEqual([]);
  expect(navigated).toBe(false);
  expect(chooser).toBe(false);
  expect(page.url()).toMatch(/\/components\/opener-hazards$/);
  expect(await page.evaluate(() => sessionStorage.getItem("submitted"))).toBeNull();
});

test("a type=submit button outside a form is never activated; a plain button is", async ({
  page,
}) => {
  const scope = await visitFixture(
    page,
    "opener-formless-submit",
    `${liveExample(
      '<button type="submit" aria-haspopup="dialog" aria-controls="first" popovertarget="first">Send</button><button aria-haspopup="dialog" aria-controls="second" popovertarget="second">Show</button>',
    )}<div id="first" popover="auto">${missingAlt}</div><div id="second" popover="auto"><input></div>`,
  );
  expect(await openedStateFindings(page, "opener-formless-submit", scope)).toEqual([
    'open(button "Show") axe:label: input ""',
  ]);
});

test("violations already present while closed are not reported again as opened findings", async ({
  page,
}) => {
  const scope = await visitFixture(
    page,
    "opener-closed-dedupe",
    `${liveExample(
      `${missingAlt}<button aria-haspopup="dialog" aria-controls="sheet" popovertarget="sheet">Show</button>`,
    )}<div id="sheet" popover="auto"><p>Fine</p></div>`,
  );
  expect(await openedStateFindings(page, "opener-closed-dedupe", scope)).toEqual([]);
});

test("a page with no openers has no opened-state findings", async ({ page }) => {
  const scope = await visitFixture(page, "opener-none", liveExample("<p>Plain text</p>"));
  expect(await openedStateFindings(page, "opener-none", scope)).toEqual([]);
});

test("disabled and aria-disabled openers are skipped", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-disabled",
    `${liveExample(
      `<button disabled aria-haspopup="dialog" aria-controls="sheet" popovertarget="sheet">Off</button><button aria-disabled="true" aria-haspopup="dialog" aria-controls="sheet" onclick="document.getElementById('sheet').showPopover()">Dim</button>`,
    )}<div id="sheet" popover="manual">${missingAlt}</div>`,
  );
  expect(await openedStateFindings(page, "opener-disabled", scope)).toEqual([]);
});

test("an opener that removes itself does not stop the next opener", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-vanish",
    `${liveExample(
      '<button aria-haspopup="true" aria-expanded="false" onclick="this.remove()">Vanish</button><button aria-haspopup="dialog" aria-controls="sheet" popovertarget="sheet">Next</button>',
    )}<div id="sheet" popover="auto">${missingAlt}</div>`,
  );
  expect(await openedStateFindings(page, "opener-vanish", scope)).toEqual([
    'open(button "Next") axe:image-alt: img ""',
  ]);
});

test("a surface without id or aria-controls is found as the newly opened top layer", async ({
  page,
}) => {
  const scope = await visitFixture(
    page,
    "opener-anonymous",
    `${liveExample(
      `<button aria-haspopup="dialog" aria-expanded="false" onclick="document.querySelector('[data-sheet]').showPopover(); this.setAttribute('aria-expanded', 'true')">Show</button>`,
    )}<div data-sheet popover="manual">${missingAlt}</div>`,
  );
  expect(await openedStateFindings(page, "opener-anonymous", scope)).toEqual([
    'open(button "Show") axe:image-alt: img ""',
  ]);
});

test("a surface Escape does not close is restored before the next opener", async ({ page }) => {
  // Both surfaces sit inside the region: if First's stayed open, Second's check would see it.
  const scope = await visitFixture(
    page,
    "opener-sticky",
    liveExample(
      `<button aria-haspopup="dialog" aria-controls="first" onclick="document.getElementById('first').showPopover()">First</button><button aria-haspopup="dialog" aria-controls="second" popovertarget="second">Second</button><div id="first" popover="manual">${missingAlt}</div><div id="second" popover="auto"><p>Fine</p></div>`,
    ),
  );
  expect(await openedStateFindings(page, "opener-sticky", scope)).toEqual([
    'open(button "First") axe:image-alt: img ""',
  ]);
});

test("a modal dialog portalled to body is checked through aria-controls", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-modal",
    `${liveExample(
      `<button aria-haspopup="dialog" aria-controls="editor" onclick="document.getElementById('editor').showModal()">Edit</button>`,
    )}<dialog id="editor" aria-label="Editor">${missingAlt}<button>Close</button></dialog>`,
  );
  expect(await openedStateFindings(page, "opener-modal", scope)).toEqual([
    'open(button "Edit") axe:image-alt: img ""',
  ]);
});

test("only top-level openers are opened, not a submenu inside a closed menu", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-nested",
    liveExample(
      `<button aria-haspopup="menu" aria-expanded="false" aria-controls="actions" popovertarget="actions">Actions</button><div id="actions" popover="auto" role="menu" aria-label="Actions"><div role="menuitem" tabindex="-1" aria-haspopup="menu" aria-expanded="false" aria-controls="more" onclick="document.getElementById('more').showPopover()">More</div></div><div id="more" popover="manual" role="menu" aria-label="More">${missingAlt}</div>`,
    ),
  );
  expect(await openedStateFindings(page, "opener-nested", scope)).toEqual([]);
});

test("a tree item is expanded with ArrowRight", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-tree",
    liveExample(
      `<div role="tree" aria-label="Files"><div role="treeitem" tabindex="0" aria-selected="false" aria-expanded="false" onkeydown="if (event.key === 'ArrowRight') { this.setAttribute('aria-expanded', 'true'); this.querySelector('[role=group]').hidden = false; }">Docs<div role="group" hidden><div role="treeitem" aria-selected="false">${missingAlt}</div></div></div></div>`,
    ),
  );
  expect(await openedStateFindings(page, "opener-tree", scope)).toEqual([
    'open(treeitem "Docs") axe:image-alt: img ""',
  ]);
});

test("a details summary is opened and its content checked", async ({ page }) => {
  const scope = await visitFixture(
    page,
    "opener-details",
    liveExample(`<details><summary>More</summary>${missingAlt}</details>`),
  );
  expect(await openedStateFindings(page, "opener-details", scope)).toEqual([
    'open(summary "More") axe:image-alt: img ""',
  ]);
});

test("tooltips found by the Tab walk open on focus; a running close timer does not leak", async ({
  page,
}) => {
  // Each tooltip links itself only while open and closes 150ms after blur or Escape, so Alpha's
  // is still open when Beta is focused unless the check waits for it to close.
  const scope = await visitFixture(
    page,
    "opener-tooltip",
    `${liveExample(
      `<button id="alpha">Alpha</button><div id="alpha-tip" role="tooltip" popover="manual">Alpha tip ${missingAlt}</div><button id="beta">Beta</button><div id="beta-tip" role="tooltip" popover="manual">Beta tip</div>`,
    )}<script>
      for (const name of ["alpha", "beta"]) {
        const trigger = document.getElementById(name);
        const tip = document.getElementById(name + "-tip");
        let timer;
        const close = () => {
          timer = setTimeout(() => {
            if (tip.matches(":popover-open")) tip.hidePopover();
            trigger.removeAttribute("aria-describedby");
          }, 150);
        };
        trigger.addEventListener("focus", () => {
          clearTimeout(timer);
          if (!tip.matches(":popover-open")) tip.showPopover();
          trigger.setAttribute("aria-describedby", tip.id);
        });
        trigger.addEventListener("blur", close);
        trigger.addEventListener("keydown", (event) => {
          if (event.key === "Escape") close();
        });
      }
    </script>`,
  );
  expect(await keyboardFindings(page, scope)).toEqual([]);
  expect(await openedStateFindings(page, "opener-tooltip", scope)).toEqual([
    'open(button "Alpha") axe:image-alt: img ""',
  ]);
});

test("a tooltip trigger linked only while focused is found by the Tab walk", async ({ page }) => {
  // The trigger has no aria-describedby and no tooltip in the DOM until it is focused, and both
  // go away on blur, so only what the walk saw while focused can name it an opener.
  const scope = await visitFixture(
    page,
    "opener-tooltip-focus-only",
    `${liveExample('<button id="hint">Hint</button>')}<script>
      const trigger = document.getElementById("hint");
      trigger.addEventListener("focus", () => {
        const tip = document.createElement("div");
        tip.id = "hint-tip";
        tip.setAttribute("role", "tooltip");
        tip.innerHTML = 'Hint tip <img src="data:,">';
        document.body.append(tip);
        trigger.setAttribute("aria-describedby", tip.id);
      });
      trigger.addEventListener("blur", () => {
        document.getElementById("hint-tip")?.remove();
        trigger.removeAttribute("aria-describedby");
      });
    </script>`,
  );
  expect(await keyboardFindings(page, scope)).toEqual([]);
  expect(await openedStateFindings(page, "opener-tooltip-focus-only", scope)).toEqual([
    'open(button "Hint") axe:image-alt: img ""',
  ]);
});
