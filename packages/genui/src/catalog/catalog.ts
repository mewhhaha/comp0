import { actionEntries } from "../facades/actions.js";
import { dataEntries } from "../facades/data.js";
import { disclosureEntries } from "../facades/disclosure.js";
import { feedbackEntries } from "../facades/feedback.js";
import { formEntries } from "../facades/forms.js";
import { layoutEntries } from "../facades/layout.js";
import { resultEntries } from "../facades/results.js";
import { type CatalogEntry } from "./types.js";

/**
 * Every component a model may compose, as plain data: a name, a description written for a model,
 * a Zod schema of its props, and the React component that renders it. The catalog is the single
 * source of the validator, the JSON Schema, and the prompt.
 */
export const catalog: readonly CatalogEntry[] = [
  ...layoutEntries,
  ...actionEntries,
  ...formEntries,
  ...disclosureEntries,
  ...dataEntries,
  ...resultEntries,
  ...feedbackEntries,
];
