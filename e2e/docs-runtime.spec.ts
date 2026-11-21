import { expect, test } from "@playwright/test";

test("docs runtime: server highlighting, hydration, lazy Select example, and selection", async ({
  page,
}) => {
  const errors: string[] = [];
  const requestedExamples = new Set<string>();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.includes("/examples/cases/") && path.endsWith(".tsx")) requestedExamples.add(path);
  });

  const response = await page.goto("/components/select");
  expect(response?.ok(), `Select page failed: ${response?.status()}`).toBe(true);
  await page.waitForLoadState("networkidle");

  const example = page.getByRole("region", { name: "Live example", exact: true });
  await example.getByRole("button", { name: "Size Medium", exact: true }).click();
  await page.getByRole("option", { name: "Large", exact: true }).click();
  await expect(example.getByRole("button")).toHaveText("Large");
  await page.waitForLoadState("networkidle");

  expect(
    await page.locator("code[data-highlighted]").count(),
    "Server highlighting is missing",
  ).toBeGreaterThan(0);
  const unrelated = [...requestedExamples].filter(
    (path) => !/\/select(?:\.[^/]+)?\.tsx$/.test(path),
  );
  expect(unrelated, "Select loaded unrelated examples").toEqual([]);
  expect(errors, "Docs hydration or interaction logged browser errors").toEqual([]);
});

test("docs search: the palette opens with its results listed and closes back to its button", async ({
  page,
}) => {
  // The palette is a modal Dialog holding a Combobox whose popover is open from the first render.
  // WebKit's showModal() once hid that popover without telling the surface, leaving no results.
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/components/select");
  await page.waitForLoadState("networkidle");

  const opener = page.getByRole("button", { name: "Search docs", exact: true });
  await opener.click();
  const results = page.getByRole("listbox", { name: "Search results" });
  await expect(results).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Search docs" })).toBeFocused();
  await page.getByRole("combobox", { name: "Search docs" }).fill("Calendar");
  await expect(results.getByRole("option", { name: /^Calendar/ }).first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Search documentation" })).toBeHidden();
  await expect(opener).toBeFocused();
  expect(errors, "Docs search logged page errors").toEqual([]);
});
