// Generated from feedback.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { fromJsonSchema, oneOf } from "../catalog/schema.js";

export const alertProps = {
  message: fromJsonSchema<string>({
    type: "string",
    description: "What the person needs to know, in a sentence or two.",
  }),
  "tone?": oneOf(["info", "success", "warning", "danger"], '"info" by default.'),
  "title?": fromJsonSchema<string>({ type: "string", description: "Short bold lead-in." }),
};
export const separatorProps = {
  "orientation?": oneOf(["horizontal", "vertical"], '"horizontal" by default.'),
};
