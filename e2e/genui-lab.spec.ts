import { expect, test, type Locator, type Page } from "@playwright/test";
import { axeViolations } from "./axe.js";

const toolPath = "/labs/genui-rsc/tools";
// The server replays five recorded responses for about 20 seconds; a loaded machine stretches it.
const streamTimeout = 90_000;

/** The values column of a chart's data table, once every row holds a number. */
async function chartValues(table: Locator) {
  const cells = table.locator("tbody td");
  await expect(cells, "The forecast table must list a week").toHaveCount(7);
  await expect(cells, "The forecast table must show numbers").toHaveText(
    Array.from({ length: 7 }, () => /^-?\d+(?:\.\d+)?$/),
  );
  return cells.allTextContents();
}

function liveValue(page: Page, term: string) {
  return page
    .getByRole("region", { name: "Live values", exact: true })
    .locator(`dt:text-is("${term}") + dd`);
}

test("genui lab: server-streamed views finish, Query calls the tool once per city, sliders drive the host shader locally, streamed tabs and sections work, a form action calls its tool, accessible, and fits phones", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  const toolCalls: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    requests.push(`${request.method()} ${request.url()}`);
    if (request.method() === "POST" && new URL(request.url()).pathname === toolPath) {
      toolCalls.push(request.postData() ?? "");
    }
  });

  // The document streams until every view has finished, so wait on the views, not the load event.
  const response = await page.goto("/labs/genui-rsc", { waitUntil: "commit" });
  expect(response?.ok(), `Lab page failed: ${response?.status()}`).toBe(true);

  const shader = page.getByRole("region", { name: "Shader explorer", exact: true });
  const forecast = page.getByRole("region", { name: "Forecast", exact: true });
  const views = page.locator('[data-slot="genui-view"]');
  await expect(views, "The lab streams five views").toHaveCount(5, { timeout: streamTimeout });
  for (const [name, view] of [
    ["Shader explorer", shader],
    ["Forecast", forecast],
  ] as const) {
    await expect(
      view.locator('[data-slot="genui-view"]'),
      `${name} must finish streaming`,
    ).not.toHaveAttribute("aria-busy", { timeout: streamTimeout });
  }
  await expect(views.and(page.locator("[aria-busy]")), "Every view must settle").toHaveCount(0, {
    timeout: streamTimeout,
  });

  const table = forecast.getByRole("table", { name: "Daily high", exact: true });
  const oslo = await chartValues(table);
  await page.waitForLoadState("networkidle");
  expect(toolCalls, "The forecast Query must call its tool exactly once").toEqual([
    JSON.stringify({ name: "forecast", args: { city: "Oslo" } }),
  ]);

  await test.step("choosing another city calls the tool once more", async () => {
    const city = forecast.getByRole("button", { name: /^City\b/ });
    await expect(city).toHaveText("Oslo");
    await city.click();
    await page.getByRole("option", { name: "Tokyo", exact: true }).click();
    await expect(city).toHaveText("Tokyo");
    await expect(liveValue(page, "City"), "Host components read the shared store").toHaveText(
      "Tokyo",
    );
    await expect.poll(() => toolCalls.length, "Changing the city must rerun the Query").toBe(2);
    await expect
      .poll(
        () => table.locator("tbody td").allTextContents(),
        "The chart must show the new city's forecast",
      )
      .not.toEqual(oslo);
    await chartValues(table);
    await page.waitForLoadState("networkidle");
    expect(toolCalls[1], "The Query must ask for the chosen city").toBe(
      JSON.stringify({ name: "forecast", args: { city: "Tokyo" } }),
    );
    expect(toolCalls, "One city change must make exactly one call").toHaveLength(2);
  });

  await test.step("sliders drive the shader and live values without the network", async () => {
    requests.length = 0;
    const caption = shader.locator("figcaption", { hasText: "Plasma shader" });
    await expect(caption).toHaveText("Plasma shader: speed 1, scale 4, hue 200 degrees");
    const speed = shader.getByRole("slider", { name: "Speed", exact: true });
    const hue = shader.getByRole("slider", { name: "Hue", exact: true });
    await speed.focus();
    for (let step = 0; step < 3; step++) await page.keyboard.press("ArrowRight");
    await hue.focus();
    for (let step = 0; step < 5; step++) await page.keyboard.press("ArrowLeft");
    await expect(speed).toHaveValue("1.3");
    await expect(hue).toHaveValue("195");
    await expect(caption, "The host shader must follow the sliders").toHaveText(
      "Plasma shader: speed 1.3, scale 4, hue 195 degrees",
    );
    await expect(liveValue(page, "Speed")).toHaveText("1.3");
    await expect(liveValue(page, "Hue")).toHaveText("195");
    expect(requests, "Moving a slider must stay on the client").toEqual([]);
    expect(toolCalls, "Sliders must not call tools").toHaveLength(2);
  });

  await test.step("streamed tabs switch, and the form's action calls its tool", async () => {
    const notes = page.getByRole("region", { name: "Release notes", exact: true });
    const tabs = notes
      .getByRole("tablist", { name: "Release notes", exact: true })
      .getByRole("tab");
    await expect(tabs, "Every streamed tab must arrive").toHaveText([
      "Highlights",
      "Breaking changes",
      "Get updates",
    ]);
    await expect(notes.getByRole("tabpanel")).toContainText("Layout streams from the server");
    await tabs.filter({ hasText: "Get updates" }).click();
    await expect(tabs.filter({ hasText: "Get updates" })).toHaveAttribute("aria-selected", "true");
    const panel = notes.getByRole("tabpanel");
    const email = panel.getByRole("textbox", { name: "Email" });
    const subscribe = panel.getByRole("button", { name: "Subscribe", exact: true });

    // Valid for the browser, refused by the tool's schema on the server.
    await email.fill("ada@example");
    await subscribe.click();
    await expect(panel.getByRole("alert"), "A refused call must say why").toContainText(/email/i);
    expect(toolCalls.at(-1)).toBe(
      JSON.stringify({ name: "subscribe", args: { email: "ada@example" } }),
    );

    await email.fill("ada@example.com");
    await subscribe.click();
    await expect(panel, "The stored result must show where the model bound it").toContainText(
      "Subscribed ada@example.com to release updates.",
    );
    await expect(panel.getByRole("alert")).toHaveCount(0);
    expect(toolCalls.at(-1)).toBe(
      JSON.stringify({ name: "subscribe", args: { email: "ada@example.com" } }),
    );
    expect(toolCalls, "Each submit must make exactly one call").toHaveLength(4);
  });

  await test.step("streamed accordion sections open and close", async () => {
    const explainer = page.getByRole("region", { name: "Explain how OAuth works.", exact: true });
    const scope = explainer.getByRole("button", { name: "What is a scope?", exact: true });
    await expect(scope).toHaveAttribute("aria-expanded", "false");
    await scope.click();
    await expect(scope).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`#${await scope.getAttribute("aria-controls")}`)).toBeVisible();
    await scope.click();
    await expect(scope).toHaveAttribute("aria-expanded", "false");
    // Leave one open, so the accessibility check below sees an expanded section. Content entering
    // view plays its pop-in again, so let it finish before checking contrast.
    await explainer.getByRole("button", { name: "What if I change my mind?", exact: true }).click();
    await page.waitForFunction(() =>
      document.getAnimations().every((animation) => animation.playState !== "running"),
    );
  });

  expect(
    await axeViolations(page, "main"),
    "The lab has automated accessibility violations",
  ).toEqual([]);

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await expect
      .poll(
        () => page.evaluate(() => document.documentElement.scrollWidth),
        `The lab must fit ${width}px without horizontal scrolling`,
      )
      .toBeLessThanOrEqual(width);
  }

  expect(errors, "The lab logged browser errors").toEqual([]);
});

test("genui lab ask page: says what it needs without a model key, accessible", async ({ page }) => {
  const response = await page.goto("/labs/genui-rsc/ask");
  expect(response?.ok(), `Ask page failed: ${response?.status()}`).toBe(true);
  const prompt = page.getByRole("textbox", { name: "What should the interface help with?" });
  await expect(prompt).toBeVisible();
  // A preview with ANTHROPIC_API_KEY set offers the form instead.
  if (await prompt.isDisabled()) {
    await expect(prompt).toHaveAccessibleDescription(/ANTHROPIC_API_KEY/);
    await expect(page.getByRole("button", { name: "Ask", exact: true })).toBeDisabled();
  }
  expect(await axeViolations(page, "main"), "The ask page has accessibility violations").toEqual(
    [],
  );
});
