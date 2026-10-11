import { type JsonValue } from "../json/parse.js";
import { type PropSchema } from "../catalog/schema.js";
import { type InferOutput } from "../catalog/standard-schema.js";

/*
 * Tools are the host's API as the model's interface sees it: named functions with a schema for
 * their input. The interface never reaches them directly; it calls one function, a ToolCaller,
 * which the host implements however its app runs: a React server function that calls `runTool`,
 * a fetch to an HTTP endpoint, or an MCP `tools/call`.
 */

/** What calling a tool produced. Errors are short and safe to show; details stay on the server. */
export type ToolResult = { ok: true; value: JsonValue } | { ok: false; error: string };

/** Calls a tool by name: the one bridge between the interface and the host's API. */
export type ToolCaller = (name: string, args: JsonValue) => Promise<ToolResult>;

/** One function the model's interface may call. */
export type ToolDefinition<TInput = unknown, TOutput = unknown> = {
  /** What the tool does and returns, written for the model. */
  description: string;
  /** Its arguments as a Standard Schema; they are validated before `run`. */
  input: PropSchema<TInput>;
  /** Runs the tool with validated arguments. Its result must be JSON. */
  run: (input: TInput) => TOutput | Promise<TOutput>;
};

/** A set of tools by name. */
export type Tools = Readonly<Record<string, ToolDefinition>>;

/** Declares a tool; `run` receives the type its input schema validates to. */
export function defineTool<TSchema extends PropSchema, TOutput>(tool: {
  description: string;
  input: TSchema;
  run: (input: InferOutput<TSchema>) => TOutput | Promise<TOutput>;
}): ToolDefinition {
  return tool as unknown as ToolDefinition;
}

/** Whether a tool's result is plain JSON, which is all the interface may store. */
export function isJson(value: unknown, depth = 0): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (depth > 32) return false;
  if (Array.isArray(value)) return value.every((item) => isJson(item, depth + 1));
  if (typeof value !== "object") return false;
  return Object.values(value).every((item) => isJson(item, depth + 1));
}

/**
 * Runs a tool for the interface, on the server. The name and arguments come from model output
 * and the browser, so both are untrusted: the tool must exist, and its arguments must pass its
 * schema. A failure is reported without the error's details, which may hold secrets.
 */
export async function runTool(tools: Tools, name: unknown, args: unknown): Promise<ToolResult> {
  if (typeof name !== "string" || !Object.hasOwn(tools, name)) {
    return {
      ok: false,
      error: `there is no tool named ${JSON.stringify(String(name)).slice(0, 60)}`,
    };
  }
  const tool = tools[name]!;
  const checked = await tool.input["~standard"].validate(args);
  if (checked.issues !== undefined) {
    return { ok: false, error: checked.issues.map((issue) => issue.message).join("; ") };
  }
  let value: unknown;
  try {
    value = await tool.run(checked.value);
  } catch {
    return { ok: false, error: `${name} failed` };
  }
  if (!isJson(value)) return { ok: false, error: `${name} returned something that is not JSON` };
  return { ok: true, value };
}
