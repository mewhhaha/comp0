import type { ComponentType } from "react";

// Each case file is both the rendered example and the source shown next to
// it, so the docs never drift from the code that produced them.
const modules = import.meta.glob<{ Example: ComponentType }>("./cases/*.tsx", { eager: true });
const sources = import.meta.glob<string>("./cases/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

const slugOf = (path: string) => path.replace("./cases/", "").replace(".tsx", "");

export const exampleRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [slugOf(path), module.Example]),
);

const exampleSources: Record<string, string> = Object.fromEntries(
  Object.entries(sources).map(([path, source]) => [slugOf(path), source.trimEnd()]),
);

export function getExample(slug: string): ComponentType | undefined {
  return exampleRegistry[slug];
}

export function getExampleSource(slug: string): string | undefined {
  return exampleSources[slug];
}
