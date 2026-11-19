import { validateResponse } from "@comp0/genui";
import { validateEdits } from "@comp0/genui/vocabulary";
import { expect, it } from "vitest";
import { contracts, hasComposition } from "./contracts.js";
import { examples } from "./examples.js";

it("each example has a distinct permalink and its recorded response fits the host", () => {
  expect(new Set(examples.map((example) => example.slug)).size).toBe(examples.length);
  for (const example of examples) {
    if (example.format === "json") {
      expect(validateResponse(example.source).errors, example.slug).toEqual([]);
      continue;
    }
    if (!hasComposition(example.slug)) throw new Error("Missing composition: " + example.slug);
    const ui = contracts[example.slug];
    // Named holes validate their contents separately when the museum renders each panel.
    if (example.slug === "museum-label") continue;
    expect(ui.validate(example.source).errors, example.slug).toEqual([]);
    if (example.revision) {
      expect(validateEdits(example.revision, { ...ui, history: [example.source] }).errors).toEqual(
        [],
      );
    }
  }
});
