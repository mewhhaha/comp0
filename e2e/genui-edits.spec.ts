import { expect, test } from "@playwright/test";
import { axeViolations } from "./axe.js";

test("recorded revisions update and append without replacing the person's work", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/labs/genui-edits/turn")
      requests.push(request.postData() ?? "");
  });
  const response = await page.goto("/labs/genui-edits", { waitUntil: "commit" });
  expect(response?.ok()).toBe(true);
  const answer = page.getByRole("region", { name: "Trip answer", exact: true });
  const originalView = answer.locator('[data-slot="genui-view"]').first();
  await expect(originalView).not.toHaveAttribute("aria-busy");
  const note = answer.getByRole("textbox", { name: "Travel note" });
  await note.fill("Keep the window seat");
  const originalNote = await note.elementHandle();
  const travellers = answer.getByRole("slider", { name: "Travellers" });
  await travellers.focus();
  await page.keyboard.press("ArrowRight");
  await expect(travellers).toHaveValue("3");
  const details = answer.locator("summary").filter({ hasText: "Trip details" });
  await details.click();
  await expect(details).toHaveAttribute("aria-expanded", "true");
  const originalDetails = await details.elementHandle();

  await page.getByRole("button", { name: "Revise the answer", exact: true }).click();
  await note.focus();
  await expect(answer.getByRole("heading", { name: "Ready itinerary", exact: true })).toBeVisible();
  await expect(answer.getByRole("listitem")).toHaveText(["Book the flight", "Book the ferry"]);
  await expect(note).toHaveValue("Keep the window seat");
  await expect(note).toBeFocused();
  await expect(travellers).toHaveValue("3");
  await expect(details).toHaveAttribute("aria-expanded", "true");
  expect(await originalNote?.evaluate((element) => element.isConnected)).toBe(true);
  expect(await originalDetails?.evaluate((element) => element.isConnected)).toBe(true);
  await expect(answer.locator("#summary, #checklist, #note, #seats, #flight, #ferry")).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Replay the revision", exact: true }).click();
  await expect(answer.locator('[data-slot="genui-view"]')).toHaveCount(3);
  await expect(answer.locator('[data-slot="genui-view"][aria-busy]')).toHaveCount(0);
  await expect(answer.getByRole("listitem")).toHaveText(["Book the flight", "Book the ferry"]);
  await expect(note).toHaveValue("Keep the window seat");

  await page.getByRole("button", { name: "Try an invalid revision", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/missing|unknown|target/i);
  await expect(answer.getByRole("heading", { name: "Ready itinerary", exact: true })).toBeVisible();
  await expect(answer.getByText("This turn must be rejected")).toHaveCount(0);
  await expect(answer.getByText("Do not add this")).toHaveCount(0);
  await expect(answer.getByRole("listitem")).toHaveCount(2);
  await expect(note).toHaveValue("Keep the window seat");
  await expect(details).toHaveAttribute("aria-expanded", "true");
  expect(requests).toHaveLength(3);
  expect(await axeViolations(page, "main")).toEqual([]);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(browserErrors).toEqual([]);
});
