import { actionsComponents } from "../facades/actions.js";
import { dataComponents } from "../facades/data.js";
import { disclosureComponents } from "../facades/disclosure.js";
import { feedbackComponents } from "../facades/feedback.js";
import { formsComponents } from "../facades/forms.js";
import { hostComponents } from "../facades/host.js";
import { layoutComponents } from "../facades/layout.js";
import { resultsComponents } from "../facades/results.js";
import { catalogSpecs } from "./specs.js";
import { withComponents, type CatalogEntry } from "./types.js";

/** The React components that render the built-in specs, by component name. */
export const builtInComponents = {
  ...layoutComponents,
  ...actionsComponents,
  ...formsComponents,
  ...disclosureComponents,
  ...dataComponents,
  ...resultsComponents,
  ...feedbackComponents,
  ...hostComponents,
};

/**
 * Every component a model may compose: the built-in specs with their React components. The specs
 * alone (`catalogSpecs`) are the single source of the validator, the JSON Schema, and the prompt.
 */
export const catalog: readonly CatalogEntry[] = withComponents(catalogSpecs, builtInComponents);
