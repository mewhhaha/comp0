import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { station } from "./station.server.js";

export async function loader({ request }: { request: Request }) {
  const line = new URL(request.url).searchParams.get("line");
  try {
    const view = await station.render("Departures", { line });
    return new Response(renderToReadableStream(view), {
      headers: { "content-type": "text/x-component" },
    });
  } catch {
    return new Response("Unknown rail line", { status: 400 });
  }
}
