// React Server Components entry. Compose `<GenUIRoot>` (typed values, data rendering,
// actions) with any number of `<GenUIView stream>` (one JSX response each). Host components
// read values with the hooks in `@comp0/genui/rsc/client`.
export { GenUIRoot, type GenUIRootProps } from "./client.js";
export { GenUIView, type GenUIViewProps } from "./surface.js";
export { readResponse, type ResponseStream } from "./stream.js";
export { hole, holes, type Hole } from "./holes.js";
export {
  serverComponent,
  renderComponent,
  type ServerComponent,
  type ComponentImplementations,
  type ComponentRenderer,
} from "./components.js";
export * from "../composition/index.js";
export { formatErrors, type GenUIError } from "../validate/errors.js";
export { handleToolRequest, httpToolCaller } from "../tools/http.js";
export {
  defineTool,
  runTool,
  type ToolCaller,
  type ToolDefinition,
  type ToolResult,
  type Tools,
} from "../tools/tools.js";
