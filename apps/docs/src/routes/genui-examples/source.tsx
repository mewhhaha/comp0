import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { CodeBlock } from "../../components/teaching/CodeBlock.js";
import type { CodeLanguage } from "../../content/types.js";
import { examples } from "../../examples/genui/gallery/examples.js";
import { hostFiles } from "./host-files.js";

export function loader({
  request,
  params,
}: {
  request: Request;
  params: { example?: string; panel?: string };
}) {
  const example = examples.find((item) => item.slug === params.example);
  if (!example) return new Response("Unknown example", { status: 404 });
  const blocks: { title: string; code: string; language: CodeLanguage }[] = [];
  if (params.panel === "response") {
    blocks.push({
      title: "Recorded response",
      code: example.source,
      language: example.format ?? "jsx",
    });
    if (example.followUp)
      blocks.push({ title: "Band’s follow-up", code: example.followUp.source, language: "jsx" });
  } else if (params.panel === "host") {
    const file = hostFiles.get(example.slug);
    if (file) blocks.push({ title: file[0], code: file[1].trimEnd(), language: "tsx" });
  }
  if (!blocks.length) return new Response("Unknown source", { status: 404 });
  const headers = new Headers({ Vary: "Accept" });
  if (request.headers.get("Accept") !== "text/x-component") {
    headers.set("Content-Type", "text/plain; charset=utf-8");
    return new Response(blocks.map((block) => block.code).join("\n\n"), { headers });
  }
  headers.set("Content-Type", "text/x-component");
  return new Response(
    renderToReadableStream(
      blocks.map((block) => <CodeBlock key={block.title} {...block} className="mt-3" />),
      { signal: request.signal },
    ),
    { headers },
  );
}
