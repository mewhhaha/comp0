// Generated from host.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { fromJsonSchema } from "../catalog/schema.js";

export const queryProps = {
  tool: fromJsonSchema<string>({
    type: "string",
    description: "Name of the host tool to call, from the list of tools.",
  }),
  "args?": fromJsonSchema<Record<string, unknown>>({
    type: "object",
    description:
      'Arguments for the tool; bind a value with {"$bind": name} and the query runs again whenever it changes.',
    additionalProperties: {},
  }),
  into: fromJsonSchema<string>({
    type: "string",
    description:
      'Name to store the result under; show it with {"$bind": name} in a data prop such as a chart\'s data.',
  }),
};
export const slotProps = {
  name: fromJsonSchema<string>({
    type: "string",
    description: "Name of a host view to place here, from the list of host views.",
  }),
};
