import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.DOCS_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 320, height: 844 },
    isMobile: true,
    hasTouch: true,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const errors = [];
  context.on("page", (page) => {
    page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
  });
  const page = await context.newPage();
  await page.goto(`${base}/components`);
  const routes = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => [...new Set(links.map((link) => new URL(link.href).pathname))].sort());
  assert(routes.includes("/components/connect"), "The audit must discover component routes");
  const failures = [];
  const pending = routes.flatMap((route) => [320, 390, 768].map((width) => ({ route, width })));
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const audit = await context.newPage();
      for (let next = pending.pop(); next; next = pending.pop()) {
        await audit.setViewportSize({ width: next.width, height: 844 });
        const response = await audit.goto(`${base}${next.route}`);
        assert(response?.ok(), `${next.route}: HTTP ${response?.status()}`);
        await audit.waitForLoadState("networkidle");
        const width = await audit.evaluate(() => document.documentElement.scrollWidth);
        // Mobile browsers can expand innerWidth to fit overflowing content.
        if (width > next.width) failures.push({ ...next, documentWidth: width });
        const clipped = await audit
          .getByRole("button", { name: "Copy code", exact: true })
          .evaluateAll((buttons) =>
            buttons.some((button) => {
              const bounds = button.getBoundingClientRect();
              const caption = button.closest("figcaption")?.getBoundingClientRect();
              return caption && (bounds.left < caption.left || bounds.right > caption.right);
            }),
          );
        if (clipped) failures.push({ ...next, clippedCopyButton: true });
      }
      await audit.close();
    }),
  );
  assert.deepEqual(
    failures,
    [],
    "Docs must fit the configured viewport, with local scrolling for wide content",
  );

  await page.getByRole("button", { name: "Open documentation navigation" }).tap();
  const navigation = page.getByRole("dialog");
  await navigation.getByRole("link", { name: "Connect", exact: true }).tap();
  await page.waitForURL("**/components/connect");
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "Navigation must close after choosing a page",
  );
  await page.getByRole("button", { name: "Search docs", exact: true }).tap();
  await page.getByRole("button", { name: "Close search" }).tap();
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "Search must be dismissible without a keyboard",
  );
  await page.setViewportSize({ width: 320, height: 450 });
  await page.getByRole("button", { name: "Search docs", exact: true }).tap();
  await page.getByRole("combobox", { name: "Search docs" }).fill("Calendar");
  const results = page.getByRole("listbox", { name: "Search results" });
  const bounds = await results.boundingBox();
  assert(
    bounds && bounds.x >= 0 && bounds.x + bounds.width <= 320 && bounds.y + bounds.height <= 450,
    "Search results must fit a short phone viewport",
  );
  await page.getByRole("option", { name: /^Calendar(?: |$)/ }).tap();
  await page.waitForURL("**/components/calendar");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole("button", { name: "Copy code", exact: true }).first().tap();
  const toast = page.getByText("Copied to clipboard", { exact: true });
  await toast.waitFor();
  const toastBounds = await toast.boundingBox();
  assert(
    toastBounds && toastBounds.x >= 0 && toastBounds.x + toastBounds.width <= 320,
    "Copy feedback must fit the phone viewport",
  );
  assert.deepEqual(errors, [], "Mobile docs logged browser errors");
  console.log(
    `Mobile docs verified: ${routes.length} routes at 320, 390, and 768px; touch navigation, search, dismissal, and copy feedback.`,
  );
} finally {
  await browser.close();
}
