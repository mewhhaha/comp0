import axe from "axe-core";
import { expect } from "vitest";

/**
 * The axe rules the docs examples test also disables: jsdom and the isolated
 * test pages have no real layout, theme, or page landmarks, so these three
 * produce noise rather than component findings.
 */
export const axeRules = {
  "color-contrast": { enabled: false },
  region: { enabled: false },
  "target-size": { enabled: false },
} as const;

/**
 * Asserts that axe-core finds no violations inside `container`. Call it after
 * driving the component into the state under test (overlay open, item
 * expanded, error shown), in a vitest browser-mode test so top-layer popovers
 * and real focus behave. Pass the document body or the overlay surface itself
 * when the state renders outside the render container.
 */
export async function expectNoAxeViolations(container: Element, label?: string) {
  const result = await axe.run(container, { rules: axeRules });
  expect(result.violations, label).toEqual([]);
}
