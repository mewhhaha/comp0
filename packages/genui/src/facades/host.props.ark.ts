// The host facades' props, written with ArkType and precompiled into host.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";

export const queryProps = {
  tool: type("string").describe("Name of the host tool to call, from the list of tools."),
  "args?": type("Record<string, unknown>").describe(
    'Arguments for the tool; bind a value with {"$bind": name} and the query runs again whenever it changes.',
  ),
  into: type("string").describe(
    'Name to store the result under; show it with {"$bind": name} in a data prop such as a chart\'s data.',
  ),
};

export const slotProps = {
  name: type("string").describe("Name of a host view to place here, from the list of host views."),
};
