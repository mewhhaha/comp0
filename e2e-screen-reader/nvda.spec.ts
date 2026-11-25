import { nvdaTest as test } from "@guidepup/playwright";
import { runScenario, scenarios } from "./scenarios.js";
import { nvdaPhrases } from "./spoken.js";

// NVDA on Windows with Chromium. The fixture starts NVDA for each test and stops it in
// teardown, so a failed attempt never leaves it running into the next test.

// Capture everything said, not only the first phrase after each key.
test.use({ nvdaStartOptions: { capture: true } });

for (const scenario of scenarios) {
  test(`NVDA: ${scenario.slug}`, ({ page, nvda }) =>
    runScenario(scenario, { page, reader: nvda, phrases: nvdaPhrases, tabKey: "Tab" }));
}
