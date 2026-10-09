/** What kind of problem a response had; stable, so a host can branch on it. */
export type GenUIErrorCode =
  | "syntax"
  | "truncated"
  | "not-a-component"
  | "missing-type"
  | "unknown-type"
  | "missing-prop"
  | "invalid-prop"
  | "unknown-prop"
  | "unsafe-url"
  | "expression"
  | "binding"
  | "unknown-binding"
  | "limit";

/**
 * A problem found in a finished response, written so that it can be sent back to the model as
 * the next message and corrected: where it is, what is wrong, and what was expected.
 */
export type GenUIError = {
  /** JSON Pointer to the offending value; the root is `""`. */
  path: string;
  code: GenUIErrorCode;
  /** One sentence naming the problem and the expected form. */
  message: string;
  /** The `type` of the component the problem belongs to, when there is one. */
  component?: string | undefined;
};

/** The most errors a validation returns; the last one says how many more there were. */
export const maxErrors = 50;

/**
 * Formats errors as a message to send back to the model so it can repair its response:
 * `The response has 2 problems. Fix them and answer again with ...`.
 */
export function formatErrors(errors: readonly GenUIError[]): string {
  if (errors.length === 0) return "";
  const lines = errors.map((error) => {
    const where = error.path === "" ? "(root)" : error.path;
    const component = error.component === undefined ? "" : ` [${error.component}]`;
    return `- ${where}${component}: ${error.message}`;
  });
  return `The response has ${errors.length} problem${errors.length === 1 ? "" : "s"}. Fix ${errors.length === 1 ? "it" : "them"} and answer again with the complete corrected JSON:\n${lines.join("\n")}`;
}
