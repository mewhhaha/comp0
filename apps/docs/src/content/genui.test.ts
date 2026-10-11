import * as genui from "@comp0/genui";
import { describe, expect, it } from "vitest";
import { genuiDocs } from "./genui.js";
import reference from "./genui-reference.json" with { type: "json" };
import type { GenUIReference } from "./types.js";

function currentReference(): GenUIReference {
  return {
    catalog: genui.describeCatalog(),
    expressionFunctions: genui.expressionFunctions.map(({ name, summary }) => ({ name, summary })),
    promptRules: [...genui.genuiPromptRules],
  };
}

function pageText(): string {
  return JSON.stringify(genuiDocs);
}

describe("GenUI reference pages", () => {
  it("show the catalog @comp0/genui ships (run `pnpm test -u` after catalog changes)", async () => {
    await expect(`${JSON.stringify(currentReference(), null, 2)}\n`).toMatchFileSnapshot(
      "./genui-reference.json",
    );
  });

  it("have unique slugs and section ids", () => {
    const slugs = genuiDocs.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const page of genuiDocs) {
      const ids = page.sections.map((section) => section.id);
      expect(new Set(ids).size, page.slug).toBe(ids.length);
    }
  });

  it("give every catalog group exactly one section", () => {
    const groups = [...new Set((reference as GenUIReference).catalog.map((entry) => entry.group))];
    const sections = genuiDocs.flatMap((page) =>
      page.sections.flatMap((section) => (section.catalogGroup ? [section.catalogGroup] : [])),
    );
    expect([...sections].sort()).toEqual([...groups].sort());
  });

  it("link only to pages that exist", () => {
    const routes = new Set(genuiDocs.map((page) => `/genui/${page.slug}`));
    for (const page of genuiDocs) {
      for (const section of page.sections) {
        for (const link of section.links ?? []) {
          if (link.to.startsWith("/genui/")) expect(routes, link.to).toContain(link.to);
        }
      }
    }
  });

  it("close every backtick code span", () => {
    for (const page of genuiDocs) {
      for (const section of page.sections) {
        const texts = [
          ...section.paragraphs,
          ...(section.list ?? []),
          ...(section.tables ?? []).flatMap((table) => table.rows.map((row) => row.description)),
        ];
        for (const text of texts) expect(text.split("`").length % 2, text).toBe(1);
      }
    }
  });

  it("mention every runtime export of @comp0/genui", () => {
    const text = pageText();
    const missing = Object.keys(genui).filter((name) => !text.includes(`\`${name}`));
    expect(missing).toEqual([]);
  });
});
