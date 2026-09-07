import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.DOCS_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  const errors = [];
  const requestedExamples = new Set();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.includes("/examples/cases/") && path.endsWith(".tsx")) requestedExamples.add(path);
  });
  const response = await page.goto(`${base}/components/select`);
  assert(response?.ok(), `Select page failed: ${response?.status()}`);
  await page.waitForLoadState("networkidle");
  const example = page.getByRole("region", { name: "Live example", exact: true });
  const trigger = example.getByRole("button", { name: "Size Medium", exact: true });
  await trigger.click();
  await page.getByRole("option", { name: "Large", exact: true }).click();
  assert.equal(await example.getByRole("button").innerText(), "Large");
  await page.waitForLoadState("networkidle");
  assert(
    (await page.locator("code[data-highlighted]").count()) > 0,
    "Server highlighting is missing",
  );
  assert(
    ![...requestedExamples].some((path) => !/\/select(?:\.[^/]+)?\.tsx$/.test(path)),
    `Select loaded unrelated examples: ${[...requestedExamples].join(", ")}`,
  );
  assert.deepEqual(errors, [], "Docs hydration or interaction logged browser errors");
  console.log(
    `Docs runtime verified at ${base}: server highlighting, hydration, lazy Select example, and selection.`,
  );
} finally {
  await browser.close();
}
