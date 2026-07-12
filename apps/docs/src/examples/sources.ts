// Example source is loaded only by server route modules. The matching live
// components remain in the client registry so displayed code cannot drift.
const sources = import.meta.glob<string>("./cases/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});

const slugOf = (path: string) => path.replace("./cases/", "").replace(".tsx", "");

const exampleSources: Record<string, string> = Object.fromEntries(
  Object.entries(sources).map(([path, source]) => [slugOf(path), source.trimEnd()]),
);

export function getExampleSource(slug: string): string | undefined {
  return exampleSources[slug];
}
