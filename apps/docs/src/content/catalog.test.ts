import * as api from "@comp0/react";
import { describe, expect, it } from "vitest";
import {
  componentBySlug,
  componentEntries,
  componentGroups,
  components,
  groupOrder,
} from "./catalog.js";
import { learnDocs } from "./learn.js";
import { getExample, exampleRegistry } from "../examples/registry.js";
import { getExampleSource } from "../examples/sources.js";

const publicComponents = Object.keys(api).sort();

describe("docs content catalog", () => {
  it("pairs every unique component slug with exactly one primary example", () => {
    const slugs = components.map((component) => component.slug);
    const primaryExamples = Object.keys(exampleRegistry).filter((key) => !key.includes("."));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect([...slugs].sort()).toEqual(primaryExamples.sort());
  });

  it("lists every entry file in exactly one group, under the group it declares", () => {
    const listed = Object.entries(groupOrder).flatMap(([group, slugs]) =>
      slugs.map((slug) => ({ group, slug })),
    );
    expect(new Set(listed.map(({ slug }) => slug)).size).toBe(listed.length);
    expect(listed.map(({ slug }) => slug).sort()).toEqual([...componentEntries.keys()].sort());
    for (const { group, slug } of listed) {
      expect(componentEntries.get(slug)?.group, slug).toBe(group);
    }
  });

  it("names each entry file after its slug", () => {
    for (const [fileSlug, entry] of componentEntries) {
      expect(entry.slug, `components/${fileSlug}.ts`).toBe(fileSlug);
    }
  });

  it("resolves every related component link", () => {
    for (const component of components) {
      for (const related of component.related) {
        expect(componentBySlug.has(related), `${component.slug} -> ${related}`).toBe(true);
      }
    }
  });

  it("keeps data visualization in its own Charts section", () => {
    const charts = componentGroups.find((group) => group.id === "charts");
    expect(charts?.components.map((component) => component.slug)).toEqual([
      "bar-chart",
      "column-chart",
      "line-chart",
      "area-chart",
      "pie-chart",
      "candlestick-chart",
      "scatter-chart",
      "dumbbell-chart",
      "boxplot-chart",
      "open-to-close-chart",
      "lollipop-chart",
      "stacked-bar-chart",
      "stacked-column-chart",
      "histogram-chart",
      "heatmap-chart",
      "sankey-chart",
      "map-chart",
    ]);
  });

  it("teaches Checkbox and CheckboxGroup on one Checkbox page", () => {
    const checkbox = componentBySlug.get("checkbox");
    expect(checkbox?.title).toBe("Checkbox");
    expect(checkbox?.parts.map((part) => part.name)).toEqual(["CheckboxGroup", "Checkbox"]);
    expect(componentBySlug.has("checkbox-group")).toBe(false);
  });

  it.each(components)("gives $slug three lesson steps and an example", async (component) => {
    expect(component.steps, component.slug).toHaveLength(3);
    const example = await getExample(component.slug);
    expect(example, component.slug).toBeDefined();
    expect(exampleRegistry[component.slug], component.slug).toBeDefined();
    for (const variant of component.moreExamples ?? []) {
      const key = `${component.slug}.${variant.id}`;
      expect(await getExample(key), key).toBeDefined();
    }
  });

  it("assigns every style hook to a documented component part", () => {
    for (const component of components) {
      const partNames = component.parts.flatMap((part) => part.name.split(" / "));
      for (const hook of component.stateHooks) {
        const hookOwnerNames = hook.on.split(/[^A-Za-z0-9]+/);
        expect(
          partNames.some((partName) => hookOwnerNames.includes(partName)),
          `${component.slug}: ${hook.attribute} on ${hook.on}`,
        ).toBe(true);
      }
    }
  });

  it("documents one visible trigger for custom date and time pickers", () => {
    for (const slug of ["date-picker", "time-picker", "date-range-picker"]) {
      const component = componentBySlug.get(slug)!;
      expect(getExampleSource(slug), slug).toContain(
        "[&::-webkit-calendar-picker-indicator]:hidden",
      );
      expect(
        component.accessibility.some((note) => note.includes("must hide")),
        slug,
      ).toBe(true);
    }
  });

  it("contains learn docs with unique slugs, consecutive orders, and valid section IDs", () => {
    expect(learnDocs.length).toBeGreaterThan(0);
    expect(new Set(learnDocs.map((doc) => doc.slug)).size).toBe(learnDocs.length);
    expect(learnDocs.map((doc) => doc.order)).toEqual(learnDocs.map((_, index) => index + 1));
    for (const doc of learnDocs) {
      const ids = doc.sections.map((section) => section.id);
      expect(ids.length, doc.slug).toBeGreaterThan(0);
      expect(new Set(ids).size, doc.slug).toBe(ids.length);
      for (const id of ids) expect(id, doc.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      for (const section of doc.sections) {
        if (!section.code) continue;
        expect(section.language, `${doc.slug}/${section.id}`).toBeDefined();
        expect(["bash", "css", "json", "tsx"], `${doc.slug}/${section.id}`).toContain(
          section.language,
        );
      }
    }
  });

  it("documents each public React component in the catalog examples", () => {
    const imported = new Set(
      components.flatMap((component) => {
        const match = component.exampleSource.match(/^import \{ ([^}]+) \}/m);
        if (!match) throw new Error(`Missing import in ${component.slug} example`);
        const importedNames = match[1];
        if (!importedNames) throw new Error(`Missing import names in ${component.slug} example`);
        return importedNames.split(", ");
      }),
    );
    expect([...imported].sort()).toEqual(publicComponents);
  });
});
