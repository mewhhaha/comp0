import { type JsonValue } from "../json/parse.js";
import { runTool, type ToolCaller, type ToolResult, type Tools } from "./tools.js";

/*
 * Tools over HTTP: one POST endpoint that takes `{ name, args }` and answers with a ToolResult.
 * It is plain Fetch API, so the same endpoint works in a React Router resource route, a Next.js
 * route handler, Hono, or a Worker, and calling it never re-renders the page around it.
 */

/** Calls tools at an endpoint served by {@link handleToolRequest}. */
export function httpToolCaller(url: string, init: RequestInit = {}): ToolCaller {
  return async (name: string, args: JsonValue): Promise<ToolResult> => {
    try {
      const response = await fetch(url, {
        ...init,
        method: "POST",
        headers: { "content-type": "application/json", ...init.headers },
        body: JSON.stringify({ name, args }),
      });
      const result = (await response.json()) as ToolResult;
      if (typeof result === "object" && result !== null && typeof result.ok === "boolean") {
        return result;
      }
      return { ok: false, error: `${name} answered with something unexpected` };
    } catch {
      return { ok: false, error: `${name} could not be reached` };
    }
  };
}

/** Answers one tool call: reads `{ name, args }`, runs it with {@link runTool}, and returns JSON. */
export async function handleToolRequest(tools: Tools, request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "the request is not JSON" } satisfies ToolResult, {
      status: 400,
    });
  }
  const { name, args } = (typeof body === "object" && body !== null ? body : {}) as {
    name?: unknown;
    args?: unknown;
  };
  return Response.json(await runTool(tools, name, args));
}

/** A tool caller from what a root was given: a function, or the URL of a tool endpoint. */
export function toolCaller(call: ToolCaller | string | undefined): ToolCaller | undefined {
  return typeof call === "string" ? httpToolCaller(call) : call;
}
