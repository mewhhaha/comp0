// React Server Components entry. Compose `<GenUIRoot>` (the shared scope: values, host views,
// tools) with any number of `<GenUIView stream>` (one streamed response each). Host components
// read values with the hooks in `@comp0/genui/rsc/client`.
export { GenUIRoot, type GenUIRootProps } from "./client.js";
export { GenUIView, type GenUIViewProps } from "./surface.js";
export { readResponse, type ResponseStream } from "./stream.js";
export { serverCatalog } from "./catalog.js";
export { handleToolRequest, httpToolCaller } from "../tools/http.js";
export {
  defineTool,
  runTool,
  type ToolCaller,
  type ToolDefinition,
  type ToolResult,
  type Tools,
} from "../tools/tools.js";
