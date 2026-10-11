import { catalog as defaultCatalog } from "./catalog.js";
import { describeType } from "./describe-schema.js";
import { descriptionOf, shapeEntries } from "./schema.js";
import { type CatalogEntry } from "./types.js";

/** One prop of a catalog component as plain data. */
export type CatalogPropDescription = {
  name: string;
  /** A short readable type: `string`, `"sm" | "md" | "lg"`, `Component[]`, `number | Binding`. */
  type: string;
  required: boolean;
  /** The schema's description; empty when it has none. */
  description: string;
};

/** A catalog component as plain data, without its schema or React component. */
export type CatalogEntryDescription = {
  name: string;
  group: string;
  description: string;
  props: CatalogPropDescription[];
};

/**
 * Describes a catalog as plain JSON data: every component with its group, description, and props.
 * The generated prompt is written from it, and it suits documentation and component pickers that
 * should not load the schemas or the renderer.
 */
export function describeCatalog(
  catalog: readonly CatalogEntry[] = defaultCatalog,
): CatalogEntryDescription[] {
  return catalog.map((entry) => ({
    name: entry.name,
    group: entry.group,
    description: entry.description,
    props: shapeEntries(entry.props).map((prop) => ({
      name: prop.name,
      type: describeType(prop.schema),
      required: !prop.optional,
      description: descriptionOf(prop.schema) ?? "",
    })),
  }));
}
