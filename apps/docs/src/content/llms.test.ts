import { describe, expect, it } from "vitest";
import { componentGroups, components } from "./catalog.js";
import { learnDocs } from "./learn.js";
import { getExampleSource } from "../examples/sources.js";
import { docsOrigin, promptFile, renderLlmsFullTxt, renderLlmsTxt } from "./llms.js";

const input = { groups: componentGroups, learn: learnDocs, exampleSource: getExampleSource };

describe("llms.txt", () => {
  const index = renderLlmsTxt(input);
  const full = renderLlmsFullTxt(input);

  it("follows the convention: H1, summary blockquote, then sections of links", () => {
    expect(index).toMatch(/^# comp0\n\n> .+/);
    expect(index).toContain("\n## Learn\n");
    expect(index).toContain("\n## Optional\n");
  });

  it("links every component and learn doc from the index", () => {
    for (const item of components) {
      expect(index, item.slug).toContain(`[${item.title}](${docsOrigin}/components/${item.slug})`);
    }
    for (const doc of learnDocs) {
      expect(index, doc.slug).toContain(`(${docsOrigin}/learn/${doc.slug})`);
    }
  });

  it("inlines every component with its parts, props, and example in the full file", () => {
    for (const item of components) {
      expect(full, item.slug).toContain(
        `### ${item.title}\n\nURL: ${docsOrigin}/components/${item.slug}`,
      );
      for (const part of item.parts)
        expect(full, `${item.slug}/${part.name}`).toContain(`\`${part.name}\``);
      const source = getExampleSource(item.slug);
      expect(source, item.slug).toBeDefined();
      expect(full, item.slug).toContain(source!.split("\n")[0]!);
    }
    for (const doc of learnDocs) expect(full, doc.slug).toContain(`### ${doc.title}`);
  });

  it("links the shipped @comp0/genui prompt", () => {
    expect(index).toContain(`${docsOrigin}/${promptFile}`);
    expect(full).toContain(`${docsOrigin}/${promptFile}`);
  });

  it("is deterministic", () => {
    expect(renderLlmsTxt(input)).toBe(index);
    expect(renderLlmsFullTxt(input)).toBe(full);
  });
});
