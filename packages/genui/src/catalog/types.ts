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
 * One component a model may use: a name, a description written for a model, the props as a
 * shape of Standard Schemas (the single source of truth for validation, the JSON Schema, and the
 * prompt), and the React component that renders it. Nested components arrive as `ReactNode` in
 * the props that were declared with `nodes()`.
 */
export type CatalogEntry<TProps extends PropShape = PropShape> = {
  /** The `type` a model writes, such as `"Select"`. */
  name: string;
  /** What the component is for, when to use it, and which props it requires. */
  description: string;
  /** Each prop's schema; a key ending in `?` is optional, as in `{ label: ..., "gap?": ... }`. */
  props: TProps;
  component: ComponentType<CatalogProps<TProps>>;
  /** The heading it is listed under in the prompt. */
  group: CatalogGroup | (string & {});
};

/** Declares a catalog entry; keeps the schema and component types in sync. */
export function defineEntry<TProps extends PropShape>(entry: CatalogEntry<TProps>): CatalogEntry {
  return entry as unknown as CatalogEntry;
}
