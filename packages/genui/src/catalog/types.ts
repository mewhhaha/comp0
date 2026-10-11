import { type ComponentType } from "react";
import { type PropShape, type ShapeProps } from "./schema.js";

/** The groups the built-in catalog entries are listed under in the generated prompt. */
export type CatalogGroup = "Layout" | "Actions" | "Forms" | "Disclosure" | "Data" | "Feedback";

/**
 * The props a facade receives. A model may stop mid-statement, so every prop can be missing
 * while a response streams; facades render sensibly with any subset.
 */
export type CatalogProps<TProps extends PropShape> = ShapeProps<TProps>;

/**
 * One component a model may use, as plain data: a name, a description written for a model, and
 * the props as a shape of Standard Schemas (the single source of truth for validation, the JSON
 * Schema, and the prompt). Nothing in a spec renders, so specs are safe on a server.
 */
export type CatalogSpec<TProps extends PropShape = PropShape> = {
  /** The `type` a model writes, such as `"Select"`. */
  name: string;
  /** What the component is for, when to use it, and which props it requires. */
  description: string;
  /** Each prop's schema; a key ending in `?` is optional, as in `{ label: ..., "gap?": ... }`. */
  props: TProps;
  /** The heading it is listed under in the prompt. */
  group: CatalogGroup | (string & {});
};

/**
 * A spec with the React component that renders it. Nested components arrive as `ReactNode` in
 * the props that were declared with `nodes()`.
 */
export type CatalogEntry<TProps extends PropShape = PropShape> = CatalogSpec<TProps> & {
  component: ComponentType<CatalogProps<TProps>>;
};

/** Declares a catalog entry; keeps the schema and component types in sync. */
export function defineEntry<TProps extends PropShape>(entry: CatalogEntry<TProps>): CatalogEntry {
  return entry as unknown as CatalogEntry;
}

/**
 * Pairs specs with the components that render them, by name, in the specs' order. A spec without
 * a component is left out, so a catalog can offer a subset, or swap one renderer for another
 * while keeping the model-facing spec: `withComponents(catalogSpecs, { ...builtIn, Button: Mine })`.
 */
export function withComponents(
  specs: readonly CatalogSpec[],
  components: Readonly<Record<string, ComponentType<never>>>,
): CatalogEntry[] {
  return specs.flatMap((spec) => {
    if (!Object.hasOwn(components, spec.name)) return [];
    const component = components[spec.name] as unknown as CatalogEntry["component"];
    return [{ ...spec, component }];
  });
}
