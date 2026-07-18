import * as api from "@comp0/react";
import { describe, expect, it } from "vitest";
import { componentBySlug, components } from "./catalog.js";
import { learnDocs } from "./learn.js";
import { getExample, exampleRegistry } from "../examples/registry.js";
import { getExampleSource } from "../examples/sources.js";

const publicComponents = Object.keys(api).sort();

describe("docs content catalog", () => {
  it("contains 73 unique component slugs", () => {
    expect(components).toHaveLength(73);
    expect(new Set(components.map((component) => component.slug)).size).toBe(73);
  });

  it("resolves every related component link", () => {
    for (const component of components) {
      for (const related of component.related) {
        expect(componentBySlug.has(related), `${component.slug} -> ${related}`).toBe(true);
      }
    }
  });

  it("teaches Checkbox and CheckboxGroup on one Checkbox page", () => {
    const checkbox = componentBySlug.get("checkbox");
    expect(checkbox?.title).toBe("Checkbox");
    expect(checkbox?.parts.map((part) => part.name)).toEqual(["CheckboxGroup", "Checkbox"]);
    expect(componentBySlug.has("checkbox-group")).toBe(false);
  });

  it("gives every component three lesson steps and an example", () => {
    for (const component of components) {
      expect(component.steps, component.slug).toHaveLength(3);
      const example = getExample(component.slug);
      expect(example, component.slug).toBeDefined();
      expect(example, component.slug).toBe(exampleRegistry[component.slug]);
      for (const variant of component.moreExamples ?? []) {
        const key = `${component.slug}.${variant.id}`;
        expect(getExample(key), key).toBeDefined();
      }
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

  it("contains six learn docs with unique, valid section IDs", () => {
    expect(learnDocs).toHaveLength(6);
    expect(new Set(learnDocs.map((doc) => doc.slug)).size).toBe(6);
    for (const doc of learnDocs) {
      const ids = doc.sections.map((section) => section.id);
      expect(ids.length, doc.slug).toBeGreaterThan(0);
      expect(new Set(ids).size, doc.slug).toBe(ids.length);
      for (const id of ids) expect(id, doc.slug).toMatch(/^[a-z][a-z0-9-]*$/);
      for (const section of doc.sections) {
        if (!section.code) continue;
        expect(section.language, `${doc.slug}/${section.id}`).toBeDefined();
        expect(["bash", "css", "tsx"], `${doc.slug}/${section.id}`).toContain(section.language);
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
