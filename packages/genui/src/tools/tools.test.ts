import { type } from "arktype";
import { describe, expect, it } from "vitest";
import { defineTool, runTool } from "./tools.js";

const tools = {
  forecast: defineTool({
    description: "Seven daily highs for a city.",
    input: type({ city: "string" }),
    run: ({ city }) => [{ x: 1, y: city.length }],
  }),
  broken: defineTool({
    description: "Fails.",
    input: type({}),
    run: () => {
      throw new Error("database password is hunter2");
    },
  }),
  odd: defineTool({ description: "Returns a function.", input: type({}), run: () => () => 1 }),
};

describe("runTool", () => {
  it("runs a tool with arguments its schema accepts", async () => {
    await expect(runTool(tools, "forecast", { city: "Oslo" })).resolves.toEqual({
      ok: true,
      value: [{ x: 1, y: 4 }],
    });
  });

  it("refuses unknown tools and arguments the schema rejects", async () => {
    expect(await runTool(tools, "toString", {})).toMatchObject({ ok: false });
    expect(await runTool(tools, 42, {})).toMatchObject({ ok: false });
    const invalid = await runTool(tools, "forecast", { city: 3 });
    expect(invalid.ok).toBe(false);
    expect(!invalid.ok && invalid.error).toContain("city");
  });

  it("keeps a tool's error details on the server and refuses results that are not JSON", async () => {
    const failed = await runTool(tools, "broken", {});
    expect(failed).toEqual({ ok: false, error: "broken failed" });
    expect(JSON.stringify(failed)).not.toContain("hunter2");
    expect(await runTool(tools, "odd", {})).toMatchObject({ ok: false });
  });
});
