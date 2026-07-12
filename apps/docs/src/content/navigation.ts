import type { DocsNavigationData, PaletteEntry } from "../components/shell/types.js";
import { componentGroups } from "./catalog.js";
import { learnDocs } from "./learn.js";

export const docsNavigation: DocsNavigationData = {
  lessons: learnDocs.map(({ slug, title }) => ({ slug, title })),
  componentGroups: componentGroups.map(({ id, title, components }) => ({
    id,
    title,
    components: components.map(({ slug, title: componentTitle }) => ({
      slug,
      title: componentTitle,
    })),
  })),
};

export const paletteEntries: PaletteEntry[] = [
  ...docsNavigation.componentGroups.flatMap((group) =>
    group.components.map((component) => ({
      route: `/components/${component.slug}`,
      title: component.title,
      group: group.title,
    })),
  ),
  ...docsNavigation.lessons.map((lesson) => ({
    route: `/learn/${lesson.slug}`,
    title: lesson.title,
    group: "Learn",
  })),
];
