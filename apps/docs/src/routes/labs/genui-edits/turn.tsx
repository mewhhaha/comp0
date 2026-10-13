import { GenUIView } from "@comp0/genui/rsc";
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { editState, editVocabulary } from "./contract.js";
import { initialResponse, invalidResponse, replay, revisionResponse } from "./responses.js";

export async function action({ request }: { request: Request }): Promise<Response> {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new Response("Origin refused", { status: 403 });
  let mode: unknown;
  let revised = false;
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "mode" in body) mode = body.mode;
    if (body && typeof body === "object" && "revised" in body) revised = body.revised === true;
  } catch {
    return new Response("Invalid turn", { status: 400 });
  }
  let response = revisionResponse;
  let turn = "assistant-2";
  let history = [initialResponse];
  if (mode === "invalid") {
    response = invalidResponse;
    turn = "assistant-invalid";
    if (revised) history = [initialResponse, revisionResponse];
  } else if (mode !== "revision") return new Response("Unknown turn", { status: 400 });
  return new Response(
    renderToReadableStream(
      <GenUIView
        vocabulary={editVocabulary}
        state={editState}
        stream={replay(response)}
        history={history}
        turn={turn}
      />,
    ),
    { headers: { "content-type": "text/x-component", "cache-control": "no-store" } },
  );
}
