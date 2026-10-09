import { type ComponentType } from "react";
import { type z } from "zod";

/** The groups the built-in catalog entries are listed under in the generated prompt. */
export type CatalogGroup = "Layout" | "Actions" | "Forms" | "Disclosure" | "Data" | "Feedback";

/**
 * The props a facade receives. A model may stop mid-statement, so every prop can be missing
 * while a response streams; facades render sensibly with any subset.
 */
export type CatalogProps<TProps extends z.ZodObject> = {
  [TKey in keyof z.infer<TProps>]?: z.infer<TProps>[TKey] | null | undefined;
};

/**
 * One component a model may use: a name, a description written for a model, a Zod schema of the
 * props (the single source of truth for validation, the JSON Schema, and the prompt), and the
 * React component that renders it. Nested components arrive as `ReactNode` in the props that
 * were declared with `nodes()`.
 */
export type CatalogEntry<TProps extends z.ZodObject = z.ZodObject> = {
  /** The `type` a model writes, such as `"Select"`. */
  name: string;
  /** What the component is for, when to use it, and which props it requires. */
  description: string;
  props: TProps;
  component: ComponentType<CatalogProps<TProps>>;
  /** The heading it is listed under in the prompt. */
  group: CatalogGroup | (string & {});
};

/** Declares a catalog entry; keeps the schema and component types in sync. */
export function defineEntry<TProps extends z.ZodObject>(entry: CatalogEntry<TProps>): CatalogEntry {
  return entry as unknown as CatalogEntry;
}
