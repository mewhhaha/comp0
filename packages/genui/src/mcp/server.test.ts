import { describe, expect, it } from "vitest";
import { responseJsonSchema } from "../schema/json-schema.js";
import { genuiAppTool, mcpAppMimeType } from "./server.js";

describe("genuiAppTool", () => {
  it("describes a tool whose arguments are a response, rendered by a ui:// resource", () => {
    const tool = genuiAppTool({
      name: "render_ui",
      description: "Shows the person an interface.",
      resourceUri: "ui://genui/app.html",
    });

    expect(tool).toEqual({
      name: "render_ui",
      description: "Shows the person an interface.",
      inputSchema: responseJsonSchema(),
      _meta: { ui: { resourceUri: "ui://genui/app.html" } },
    });
    expect(tool.inputSchema.type).toBe("object");
    expect(mcpAppMimeType).toBe("text/html;profile=mcp-app");
  });

  it("shapes the schema like responseJsonSchema and declares who may call it", () => {
    const tool = genuiAppTool({
      name: "render_ui",
      description: "Shows the person an interface.",
      resourceUri: "ui://genui/app.html",
      visibility: ["model"],
      strict: true,
    });

    expect(tool.inputSchema).toEqual(responseJsonSchema({ strict: true }));
    expect(tool._meta.ui.visibility).toEqual(["model"]);
  });

  it("rejects a resource that is not a ui:// URI", () => {
    expect(() =>
      genuiAppTool({ name: "render_ui", description: "", resourceUri: "https://example.com" }),
    ).toThrow("ui://");
  });
});
