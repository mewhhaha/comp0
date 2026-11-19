import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { examples } from "../../examples/genui/gallery/examples.js";
import { recordedReply } from "./recording.server.js";

/** Play the recorded provider response for the submitted prompt. */
export async function action({
  request,
  params,
}: {
  request: Request;
  params: { example?: string };
}) {
  const example = examples.find((item) => item.slug === params.example);
  if (!example) return new Response("Example not found", { status: 404 });
  const prompt = await request.text();
  const turn = [example, example.followUp].find((turn) => turn?.prompt === prompt);
  if (!turn) return new Response("Unknown example prompt", { status: 400 });
  const reply = recordedReply(example, turn, request.signal);
  return new Response(renderToReadableStream(reply, { signal: request.signal }), {
    headers: { "content-type": "text/x-component", "cache-control": "no-store" },
  });
}
