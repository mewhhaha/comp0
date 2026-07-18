import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { render } from "../../../../packages/react/test/render.js";
import { components } from "../content/catalog.js";
import { getExample } from "./registry.js";

describe("component examples", () => {
  it.each(components)("$slug has no automated accessibility violations", async ({ slug }) => {
    const Example = getExample(slug);
    if (!Example) throw new Error(`Component example "${slug}" is not registered.`);
    const { baseElement } = render(<Example />);

    const result = await axe.run(baseElement, {
      rules: {
        "color-contrast": { enabled: false },
        region: { enabled: false },
        "target-size": { enabled: false },
      },
    });

    expect(result.violations, slug).toEqual([]);
  });
});
