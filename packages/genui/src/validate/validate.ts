import { catalog as defaultCatalog } from "../catalog/catalog.js";
import { validateWith, type ValidatedResponse, type ValidateOptions } from "./core.js";

export {
  maxNodeDepth,
  maxNodes,
  validateWith,
  type ValidatedResponse,
  type ValidateOptions,
} from "./core.js";

/**
 * Validates a response against the catalog, the built-in one by default. The input is the
 * response text (parsed here), a `PartialParse`, or an already parsed object. It returns the
 * component tree to render, with props sanitized against each component's schema (a prop that
 * does not fit is dropped, unknown components and props are left out, unsafe URLs never
 * survive), and the problems found.
 *
 * Problems are reported only when `complete` is true (the default), and never for the part of
 * the document that is still open.
 */
export function validateResponse(input: unknown, options: ValidateOptions = {}): ValidatedResponse {
  return validateWith(input, { ...options, catalog: options.catalog ?? defaultCatalog });
}

/**
 * Validates one component object that is already parsed and finished, such as a node a model
 * returned from a tool call. Equivalent to `validateResponse(value, options)`.
 */
export function validateNode(value: unknown, options: ValidateOptions = {}): ValidatedResponse {
  return validateResponse(value, { ...options, complete: options.complete ?? true });
}
