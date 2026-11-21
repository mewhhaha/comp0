import { expect, test } from "@playwright/test";
import { compareWithBaseline, componentSlugs, keyboardFindings, wcagAxeFindings } from "./wcag.js";

// WCAG 2.2 AA sweep over every component page of the production docs build, where the
// examples run in a real browser with real focus. Each page's live example is checked with axe
// (behavior and semantics rules; visual rules the consumer owns are off), then walked with Tab. Known findings are listed in
// e2e/wcag-baseline/<slug>.json; see e2e/wcag.ts for the rules and the baseline contract.

test.describe.configure({ mode: "parallel" });

for (const slug of componentSlugs) {
  test(`wcag 2.2 AA: ${slug}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(`/components/${slug}`);
    expect(response?.ok(), `/components/${slug}: HTTP ${response?.status()}`).toBe(true);
    const region = page.getByRole("region", { name: "Live example", exact: true });
    await expect(region.getByText("Loading example…")).toHaveCount(0);
    await page.waitForLoadState("networkidle");

    const findings: string[] = [];
    findings.push(...(await wcagAxeFindings(page, region)));
    findings.push(...(await keyboardFindings(page, region)));

    const { added, fixed } = compareWithBaseline(slug, findings);
    expect(added, `New WCAG 2.2 AA findings on ${slug}`).toEqual([]);
    expect(
      fixed,
      `Fixed findings still listed in e2e/wcag-baseline/${slug}.json; run pnpm test:wcag:baseline`,
    ).toEqual([]);
    expect(errors, `${slug} logged page errors`).toEqual([]);
  });
}
