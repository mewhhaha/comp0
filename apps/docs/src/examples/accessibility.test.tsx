import axe from "axe-core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "../../../../packages/react/test/render.js";
import { components } from "../content/catalog.js";
import { getExample } from "./registry.js";

const examples = await Promise.all(
  components.map(async ({ slug }) => ({ slug, Example: await getExample(slug) })),
);

describe("component examples", () => {
  // jsdom has no layout engine; wire geometry is exercised in Connect's browser tests.
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Object.defineProperty(SVGElement.prototype, "getScreenCTM", {
      configurable: true,
      value: () => null,
    });
  });
  afterAll(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(SVGElement.prototype, "getScreenCTM");
  });
  it.each(examples)(
    "$slug has no automated accessibility violations",
    async ({ slug, Example }) => {
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
    },
  );
});
