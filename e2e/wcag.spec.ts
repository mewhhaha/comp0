import { expect, test } from "@playwright/test";
import {
  compareWithBaseline,
  componentSlugs,
  keyboardFindings,
  openedStateFindings,
  visitExample,
  wcagAxeFindings,
  writeBaseline,
  writeBrowserBaseline,
} from "./wcag.js";

// WCAG 2.2 AA sweep over every component page of the production docs build, where the examples
// run in a real browser with real focus. Each page's live example is checked with axe (behavior
// and semantics rules; visual rules the consumer owns are off), walked with Tab (traps, obscured
// focus, unreachable controls), and then each opener in it is opened and axe-checked again. Known
// findings are listed in e2e/wcag-baseline/<slug>.json (and <slug>.<browser>.json where a browser
// differs); see e2e/wcag.ts for the rules and the baseline contract.

test.describe.configure({ mode: "parallel" });

for (const slug of componentSlugs) {
  test(`wcag 2.2 AA: ${slug}`, async ({ page, browserName }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const region = await visitExample(page, slug);

    const findings: string[] = [];
    findings.push(...(await wcagAxeFindings(page, region)));
    findings.push(...(await keyboardFindings(page, region)));
    findings.push(...(await openedStateFindings(page, slug, region)));

    // Chromium's findings are the shared baseline; another browser keeps a file of its own only
    // where it finds something else.
    if (process.env.WCAG_BASELINE === "update") {
      if (browserName === "chromium") writeBaseline(slug, findings);
      else writeBrowserBaseline(slug, browserName, findings);
    } else {
      const { added, fixed } = compareWithBaseline(slug, browserName, findings);
      expect(added, `New WCAG 2.2 AA findings on ${slug} in ${browserName}`).toEqual([]);
      expect(
        fixed,
        `Fixed findings still listed in the ${browserName} baseline of ${slug} in e2e/wcag-baseline/; run pnpm test:wcag:baseline`,
      ).toEqual([]);
    }
    expect(errors, `${slug} logged page errors`).toEqual([]);
  });
}
