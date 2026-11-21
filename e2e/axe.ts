import axe from "axe-core";
import type { Page } from "@playwright/test";
import { consumerOwnedRules } from "./wcag.js";

type AxeWindow = Window & { axe: typeof axe };

/**
 * Runs axe-core on the element matching `selector`; the page-level region rule is skipped for
 * fragments, and the visual rules the consumer owns (contrast, target size) are off.
 */
export async function axeViolations(page: Page, selector: string) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(
    async ({ target, consumerRules }) => {
      const scope = document.querySelector(target);
      if (!scope) throw new Error(`No element matches ${target}`);
      const result = await (window as unknown as AxeWindow).axe.run(scope, {
        rules: { region: { enabled: false }, ...consumerRules },
      });
      return result.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map(({ target: nodeTarget }) => nodeTarget),
      }));
    },
    { target: selector, consumerRules: consumerOwnedRules },
  );
}
