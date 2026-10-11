import {
  responseJsonSchema,
  type JsonSchema,
  type ResponseSchemaOptions,
} from "../schema/json-schema.js";

/** The MIME type of an MCP Apps HTML resource, for the `ui://` resource that renders responses. */
export const mcpAppMimeType = "text/html;profile=mcp-app";

/** Who may call an MCP Apps tool: the model, the app through the host, or both (the default). */
export type McpToolVisibility = "model" | "app";

export type GenUIAppToolOptions = ResponseSchemaOptions & {
  /** The tool's name, such as `"render_ui"`. */
  name: string;
  /** What the tool is for, written for the model. `genuiPrompt()` fits here. */
  description: string;
  /** The `ui://` resource that renders the tool's arguments, served as {@link mcpAppMimeType}. */
  resourceUri: string;
  visibility?: readonly McpToolVisibility[] | undefined;
};

/** An MCP tool descriptor, as a server lists it in `tools/list`. */
export type GenUIAppTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  _meta: { ui: { resourceUri: string; visibility?: McpToolVisibility[] } };
};

/**
 * Describes an MCP tool whose arguments are a GenUI response: the model writes the interface as
 * the call's arguments, the host streams them to the `ui://` resource, and the app renders them
 * with `McpAppGenUI`. The input schema is `responseJsonSchema`, so the same options shape it.
 */
export function genuiAppTool({
  name,
  description,
  resourceUri,
  visibility,
  ...schema
}: GenUIAppToolOptions): GenUIAppTool {
  if (!resourceUri.startsWith("ui://")) {
    throw new Error(
      `An MCP Apps resource URI starts with ui://, not ${JSON.stringify(resourceUri)}.`,
    );
  }
  const ui =
    visibility === undefined ? { resourceUri } : { resourceUri, visibility: [...visibility] };
  return { name, description, inputSchema: responseJsonSchema(schema), _meta: { ui } };
}
