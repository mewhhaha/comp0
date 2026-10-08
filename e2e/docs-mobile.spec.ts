import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 320, height: 844 },
  isMobile: true,
  hasTouch: true,
  permissions: ["clipboard-read", "clipboard-write"],
});

test("mobile docs: every route fits 320, 390, and 768px; touch navigation, search, and copy feedback", async ({
  context,
  page,
  baseURL,
}) => {
  test.setTimeout(300_000);
  const errors: string[] = [];
  context.on("page", (opened) => {
    opened.on("pageerror", (error) => errors.push(`${opened.url()}: ${error.message}`));
  });

  await page.goto("/components");
  const routes = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) =>
      [...new Set(links.map((link) => new URL((link as HTMLAnchorElement).href).pathname))].sort(),
    );
  expect(routes, "The audit must discover component routes").toContain("/components/connect");

  const failures: unknown[] = [];
  const pending = routes.flatMap((route) => [320, 390, 768].map((width) => ({ route, width })));
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      const audit = await context.newPage();
      for (let next = pending.pop(); next; next = pending.pop()) {
        await audit.setViewportSize({ width: next.width, height: 844 });
        const response = await audit.goto(`${baseURL}${next.route}`);
        expect(response?.ok(), `${next.route}: HTTP ${response?.status()}`).toBe(true);
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
  expect(
    failures,
    "Docs must fit the configured viewport, with local scrolling for wide content",
  ).toEqual([]);

  await page.getByRole("button", { name: "Open documentation navigation" }).tap();
  await page.getByRole("dialog").getByRole("link", { name: "Connect", exact: true }).tap();
  await page.waitForURL("**/components/connect");
  await expect(page.getByRole("dialog"), "Navigation must close after choosing a page").toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Search docs", exact: true }).tap();
  await page.getByRole("button", { name: "Close search" }).tap();
  await expect(
    page.getByRole("dialog"),
    "Search must be dismissible without a keyboard",
  ).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 450 });
  await page.getByRole("button", { name: "Search docs", exact: true }).tap();
  await page.getByRole("combobox", { name: "Search docs" }).fill("Calendar");
  const bounds = await page.getByRole("listbox", { name: "Search results" }).boundingBox();
  expect(
    bounds && bounds.x >= 0 && bounds.x + bounds.width <= 320 && bounds.y + bounds.height <= 450,
    "Search results must fit a short phone viewport",
  ).toBe(true);
  await page.getByRole("option", { name: /^Calendar(?: |$)/ }).tap();
  await page.waitForURL("**/components/calendar");

  await page.setViewportSize({ width: 320, height: 844 });
  await page.getByRole("button", { name: "Copy code", exact: true }).first().tap();
  const toast = page.getByText("Copied to clipboard", { exact: true });
  await toast.waitFor();
  const toastBounds = await toast.boundingBox();
  expect(
    toastBounds && toastBounds.x >= 0 && toastBounds.x + toastBounds.width <= 320,
    "Copy feedback must fit the phone viewport",
  ).toBe(true);
  expect(errors, "Mobile docs logged browser errors").toEqual([]);
});
