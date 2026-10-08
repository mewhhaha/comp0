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
