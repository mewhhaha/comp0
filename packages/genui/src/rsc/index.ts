// React Server Components entry. Compose `<GenUIRoot>` (the shared scope: values, host views,
// tools) with any number of `<GenUIView stream>` (one streamed response each). Host components
// read values with the hooks in `@comp0/genui/rsc/client`.
export { GenUIRoot, type GenUIRootProps } from "./client.js";
export { GenUIView, type GenUIViewProps } from "./surface.js";
export { readResponse, type ResponseStream } from "./stream.js";
// Everything a server needs to talk to a model about the catalog, without loading any renderer.
export { catalogSpecs } from "../catalog/specs.js";
export { describeCatalog, type CatalogEntryDescription } from "../catalog/describe-catalog.js";
export { genuiPrompt, type GenUIPromptOptions } from "../prompt/prompt.js";
export { responseJsonSchema, type JsonSchema } from "../schema/json-schema.js";
export { formatErrors, type GenUIError } from "../validate/errors.js";
export { validateResponse } from "../validate/validate.js";
export { handleToolRequest, httpToolCaller } from "../tools/http.js";
export {
  defineTool,
  runTool,
  type ToolCaller,
  type ToolDefinition,
  type ToolResult,
  type Tools,
} from "../tools/tools.js";
