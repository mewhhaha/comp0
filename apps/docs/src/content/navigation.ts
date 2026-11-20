import { examples } from "../examples/genui/gallery/examples.js";
import type { DocsNavigationData, PaletteEntry } from "../components/shell/types.js";
import { componentGroups } from "./catalog.js";
import { genuiDocs } from "./genui.js";
import { learnDocs } from "./learn.js";

export const docsNavigation: DocsNavigationData = {
  lessons: learnDocs.map(({ slug, title }) => ({ slug, title })),
  genui: genuiDocs.map(({ slug, title }) => ({ slug, title })),
  componentGroups: componentGroups.map(({ id, title, components }) => ({
    id,
    title,
    components: components.map(({ slug, title: componentTitle }) => ({
      slug,
      title: componentTitle,
    })),
  })),
};

export const exampleEntries: PaletteEntry[] = examples.map((example) => ({
  route: "/genui/examples/" + example.slug,
  title: example.title,
  group: "GenUI examples",
}));
