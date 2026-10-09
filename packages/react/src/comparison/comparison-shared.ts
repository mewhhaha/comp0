import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type ComparisonOptionItem = CollectionItem & {
  recommended: boolean;
};

export type ComparisonContextValue = {
  /** Registered options in column order, with whether each is recommended. */
  options: { value: string; recommended: boolean }[];
  /** The registry every ComparisonOption joins. */
  collection: Collection<ComparisonOptionItem>;
};

export const [ComparisonContext, useComparisonContext] =
  createRequiredContext<ComparisonContextValue>("Comparison");

export type ComparisonRowContextValue = {
  /** Whether the values in the row are not all the same. */
  differs: boolean;
};

export const [ComparisonRowContext, useComparisonRowContext] =
  createRequiredContext<ComparisonRowContextValue>("ComparisonRow");
