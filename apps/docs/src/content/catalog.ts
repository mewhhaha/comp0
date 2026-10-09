import type { ComponentDoc, ComponentGroup } from "./types.js";
import { groupMeta, groupOrder } from "./group-order.js";

export { groupOrder };

const entries = import.meta.glob<ComponentDoc>("./components/*.ts", {
  eager: true,
  import: "default",
});

/** Entry files keyed by the slug in their file name. */
export const componentEntries = new Map(
  Object.entries(entries).map(([path, entry]) => [
    path.replace("./components/", "").replace(/\.ts$/, ""),
    entry,
  ]),
);

function groupComponents(id: ComponentGroup["id"]) {
  return groupOrder[id].map((slug) => {
    const entry = componentEntries.get(slug);
    if (!entry) throw new Error(`Missing component entry for ${slug}`);
    return entry;
  });
}

export const componentGroups: ComponentGroup[] = groupMeta.map((meta) => ({
  ...meta,
  components: groupComponents(meta.id),
}));
export const components = componentGroups.flatMap((group) => group.components);
export const componentBySlug = new Map(components.map((item) => [item.slug, item]));
