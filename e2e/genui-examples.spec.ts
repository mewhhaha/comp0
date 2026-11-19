import { expect, test, type Locator, type Page } from "@playwright/test";
import { examples } from "../apps/docs/src/examples/genui/gallery/examples.js";
import { axeViolations } from "./axe.js";

test.use({
  viewport: { width: 390, height: 844 },
  permissions: ["clipboard-read", "clipboard-write"],
});

const interactions: Record<string, (view: Locator, page: Page) => Promise<void>> = {
  async "print-proof"(view, page) {
    await view.getByRole("button", { name: /Second ink/ }).click();
    await page.getByRole("option", { name: "Cobalt" }).click();
    await view.getByRole("slider").press("ArrowRight");
    await expect(view.getByRole("figure")).toHaveAccessibleName("Black + Cobalt · 4 mm offset");
  },
  async "listening-room"(view) {
    await view.getByText("Leave a two-chair centre aisle", { exact: true }).click();
    await expect(view.getByRole("switch")).not.toBeChecked();
    await view.getByRole("slider").press("ArrowRight");
    await expect(view.getByRole("status", { name: "Chairs to set out" })).toHaveText("30");
    await expect(view.getByRole("figure")).toHaveAccessibleName(/5 rows/);
  },
  async soundcheck(view) {
    await view.getByRole("tab", { name: "After adjustment" }).click();
    await expect(
      view
        .getByRole("table", { name: "Second take: vocal level" })
        .getByRole("row", { name: "Back 76 dB" }),
    ).toBeVisible();
  },
  async encore(view) {
    const note = view.getByRole("textbox", { name: "Stage note" });
    await note.fill("Guitar at stage left");
    await view.getByRole("button", { name: "Add the encore" }).click();
    await expect(view.getByRole("heading", { name: "Opening set + encore" })).toBeVisible();
    await expect(view.getByRole("listitem").last()).toContainText("Borrowed Light");
    await expect(note).toHaveValue("Guitar at stage left");
    await expect(view.getByRole("article", { name: "You" })).toHaveCount(2);
    const followUp = examples.find((example) => example.slug === "encore")!.followUp!;
    await expect(view.getByRole("article", { name: "You" }).last()).toContainText(followUp.prompt);
    await expect(view.getByRole("article", { name: "Assistant" }).last()).toContainText(
      followUp.reply,
    );
  },
  async "night-train"(view, page) {
    await view.getByRole("button", { name: /Rail line/ }).click();
    await page.getByRole("option", { name: "Forest" }).click();
    await expect(
      view.getByRole("table", { name: "Forest line departures" }).getByText("Pine Ridge"),
    ).toBeVisible();
  },
  async backpack(view) {
    await view.getByText("Tripod · 1.2 kg", { exact: true }).click();
    await expect(view.getByText("0.2 kg remaining of the 7 kg allowance.")).toBeVisible();
    await view.getByText("Field recorder · 0.6 kg", { exact: true }).click();
    await expect(view.getByText("0.4 kg over the 7 kg allowance.")).toBeVisible();
  },
  async "pour-over"(view) {
    await view.getByRole("slider", { name: "Coffee (g)" }).press("ArrowRight");
    await expect(view.getByRole("status", { name: "Total water" })).toHaveText("336 g");
    await expect(view.getByRole("listitem").first()).toContainText("63 g");
  },
  async "field-notes"(view, page) {
    await view.getByRole("link", { name: /Source 2/ }).click();
    await expect(page).toHaveURL(/#.*source-1$/);
    await view.getByRole("button", { name: "Copy observation report" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain("six terns on posts");
  },
  async "museum-label"(view) {
    await expect(view.getByRole("heading", { name: "Pocket field recorder" })).toBeVisible();
    await view.getByText("Inspect the handwritten tape log").click();
    await expect(view.getByText(/a second hand crossed it out/i)).toBeVisible();
  },
  async "repair-desk"(view) {
    const ticket = view.getByRole("textbox", { name: "Ticket number" });
    await ticket.fill("R-117");
    await view.getByRole("button", { name: "Look up ticket" }).click();
    await expect(view.getByText(/Waiting for a replacement stylus/)).toBeVisible();
    await ticket.fill("X-0");
    await view.getByRole("button", { name: "Look up ticket" }).click();
    await expect(view.getByText("No repair found for that ticket.")).toBeVisible();
  },
  async "record-crates"(view, page) {
    await expect(view.getByRole("rowheader", { name: "Soft Index" })).toBeVisible();
    await view.getByRole("button", { name: /Record crate/ }).click();
    await page.getByRole("option", { name: "Dub" }).click();
    await expect(view.getByRole("rowheader", { name: "Delay Atlas" })).toBeVisible();
    await expect(view.getByRole("rowheader", { name: "Soft Index" })).toHaveCount(0);
  },
  async "screening-ballot"(view) {
    await view.getByText("Paper City", { exact: true }).click();
    await view.getByRole("textbox").fill("For the paper sets");
    await view.getByRole("button", { name: "Send ballot" }).click();
    await expect(view.getByRole("heading", { name: "Ballot received" })).toBeVisible();
    await expect(view.locator("pre")).toContainText('"film": "Paper City"');
    await expect(view.locator("pre")).toContainText('"reason": "For the paper sets"');
  },
};

for (const example of examples) {
  test(example.title, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/genui/examples/" + example.slug, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(example.title);
    const view = page.getByRole("region", { name: "Mock conversation" });
    const log = view.getByRole("log", { name: "Conversation" });
    const assistant = log.getByRole("article", { name: "Assistant" });
    await expect(log.getByRole("article", { name: "You" })).toContainText(example.prompt);
    await expect(assistant).toHaveCount(0);
    const request = page.waitForRequest((req) => req.url().endsWith("/" + example.slug + "/reply"));
    await view.getByRole("button", { name: "Send prompt" }).click();
    expect((await request).postData()).toBe(example.prompt);
    await expect(assistant).toContainText(example.reply);
    await expect(view.getByRole("button", { name: "Replay conversation" })).toBeEnabled();
    await interactions[example.slug]!(view, page);
    await page.getByText("Response source", { exact: true }).click();
    await expect(page.locator("article pre code").first()).toHaveText(example.source);
    expect(await axeViolations(page, "article")).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    expect(errors).toEqual([]);
    if (process.env.UPDATE_GENUI_PREVIEWS === "1") {
      await page.setViewportSize({ width: 520, height: 1000 });
      await view
        .locator("[data-genui]")
        .first()
        .screenshot({
          path: "apps/docs/public/genui-previews/" + example.slug + ".jpg",
          quality: 76,
          animations: "disabled",
        });
    }
  });
}

test("a failed reply can be retried and replay starts a fresh conversation", async ({ page }) => {
  await page.route(
    "**/genui/examples/screening-ballot/reply",
    (route) => route.fulfill({ status: 503 }),
    { times: 1 },
  );
  await page.goto("/genui/examples/screening-ballot", { waitUntil: "networkidle" });
  const view = page.getByRole("region", { name: "Mock conversation" });
  const log = view.getByRole("log", { name: "Conversation" });
  await view.getByRole("button", { name: "Send prompt" }).click();
  await expect(log).toContainText("The recorded reply couldn’t be loaded.");
  await view.getByRole("button", { name: "Retry reply" }).click();
  const ballot = log.getByRole("button", { name: "Send ballot" });
  await expect(ballot).toBeVisible();
  await expect(ballot).toBeDisabled();
  await expect(log).toHaveAttribute("aria-busy", "true");
  await expect(ballot).toBeEnabled();
  await log.getByRole("textbox").fill("Loved the sets");
  await view.getByRole("button", { name: "Replay conversation" }).click();
  await expect(view.getByRole("button", { name: "Replay conversation" })).toBeEnabled();
  await expect(log.getByRole("textbox")).toHaveValue("");
  await expect(log.getByRole("article", { name: "Assistant" })).toHaveCount(1);
});

test("leaving a streaming JSX reply opens the next example with its own prompt", async ({
  page,
}) => {
  await page.goto("/genui/examples/soundcheck", { waitUntil: "networkidle" });
  const view = page.getByRole("region", { name: "Mock conversation" });
  const log = view.getByRole("log", { name: "Conversation" });
  await view.getByRole("button", { name: "Send prompt" }).click();
  await expect(log.getByRole("tab", { name: "First take" })).toBeVisible();
  await expect(log).toHaveAttribute("aria-busy", "true");
  await page.getByRole("link", { name: /The encore revision/ }).click();
  await expect(page).toHaveURL(/genui\/examples\/encore$/);
  await expect(view.getByRole("button", { name: "Send prompt" })).toBeEnabled();
  await expect(log.getByRole("article", { name: "Assistant" })).toHaveCount(0);
  await view.getByRole("button", { name: "Send prompt" }).click();
  await expect(log.getByRole("textbox", { name: "Stage note" })).toBeVisible();
  await expect(log.getByRole("tab")).toHaveCount(0);
});

test("the gallery lists every example with its preview and preserves navigation", async ({
  page,
  request,
}) => {
  await page.goto("/genui/examples");
  const cards = page.locator("article a:has(img)");
  await expect(cards).toHaveCount(examples.length);
  for (const example of examples) {
    const link = cards.filter({ hasText: example.title });
    await expect(link).toHaveAttribute("href", "/genui/examples/" + example.slug);
    const image = link.locator("img");
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await cards.first().click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(examples[0]!.title);
  await page.locator("article").getByRole("link", { name: "GenUI examples" }).click();
  await expect(cards).toHaveCount(examples.length);
  expect((await request.get("/genui/examples/unknown-print")).status()).toBe(404);
  expect((await request.post("/genui/examples/unknown-print/reply")).status()).toBe(404);
  expect(
    (await request.post("/genui/examples/encore/reply", { data: "Unknown prompt" })).status(),
  ).toBe(400);
  expect((await request.get("/genui/examples/night-train/departures?line=Missing")).status()).toBe(
    400,
  );
});
