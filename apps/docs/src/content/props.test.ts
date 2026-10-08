import { describe, expect, it } from "vitest";
import { components } from "./catalog.js";
import { checkDocsProps, documentedNames, formatPropFailures } from "./prop-guard.js";

// Limit the check to some pages while fixing them: DOCS_PROPS_SLUGS=select,menu pnpm exec vitest run --project unit apps/docs/src/content/props.test.ts
const slugs = process.env.DOCS_PROPS_SLUGS?.split(",").filter(Boolean);

describe("docs prop tables", () => {
  it("splits combined row names", () => {
    expect(documentedNames("value / defaultValue")).toEqual(["value", "defaultValue"]);
    expect(documentedNames("dismiss(id)")).toEqual(["dismiss"]);
  });

  it("documents exactly the props each part really has", { timeout: 300_000 }, () => {
    const failures = checkDocsProps(components, slugs ? { slugs } : {});
    expect(failures.length, `\n${formatPropFailures(failures)}\n`).toBe(0);
  });
});
