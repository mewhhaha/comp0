// MCP Apps entry. In the app's `ui://` resource, `createMcpAppBridge` connects to the host and
// `<McpAppGenUI bridge>` renders the response the model streams as a tool call's arguments. On the
// MCP server, `genuiAppTool` describes that tool.
export {
  createMcpAppBridge,
  mcpAppProtocolVersion,
  type McpAppBridge,
  type McpAppBridgeOptions,
  type McpAppError,
  type McpAppFrame,
  type McpAppSize,
  type McpContentBlock,
  type McpDisplayMode,
  type McpHostContext,
  type McpHostFrame,
  type McpImplementation,
  type McpInitializeResult,
  type McpModelContext,
  type McpToolInput,
} from "./bridge.js";
export {
  McpAppGenUI,
  useMcpAppResponse,
  type McpAppGenUIProps,
  type McpAppResponse,
} from "./react.js";
export {
  genuiAppTool,
  mcpAppMimeType,
  type GenUIAppTool,
  type GenUIAppToolOptions,
  type McpToolVisibility,
} from "./server.js";
