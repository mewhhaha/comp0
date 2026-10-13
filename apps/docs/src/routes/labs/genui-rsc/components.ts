import { renderComponent } from "@comp0/genui/rsc";
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { labComponents } from "./components.server.js";

const maxBodySize = 16_384;

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBodySize) {
        await reader.cancel();
        throw new Error("Request is too large");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

/** Refreshes one validated server component without rerunning its route. */
export async function action({ request }: { request: Request }): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Use POST", { status: 405, headers: { allow: "POST" } });
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return new Response("Origin refused", { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return new Response("Use JSON", { status: 415 });
  try {
    const body = await readBody(request);
    if (!body || typeof body !== "object" || !Object.hasOwn(body, "name"))
      return new Response("Invalid component request", { status: 400 });
    const { name, props } = body as { name?: unknown; props?: unknown };
    if (typeof name !== "string") return new Response("Invalid component name", { status: 400 });
    const result = await renderComponent(labComponents, name, props);
    return new Response(renderToReadableStream(result), {
      headers: { "content-type": "text/x-component", "cache-control": "no-store" },
    });
  } catch {
    return new Response("Invalid component request", { status: 400 });
  }
}
