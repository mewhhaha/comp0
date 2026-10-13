import Anthropic from "@anthropic-ai/sdk";
import { readResponse } from "@comp0/genui/rsc";
import { afterEach, describe, expect, it, vi } from "vitest";
import { askClaude, labApiKey, labPrompt } from "./model.server.js";
import { labState, labVocabulary } from "./contract.js";
import { dashboard, explainer } from "./responses.js";
import { forecastExplorer } from "./forecast-explorer.js";
import { shaderExplorer } from "./shader-explorer.js";
import { releaseNotes } from "./release-notes.js";

/** A Messages API stream as the server sends it, split into the given text deltas. */
function eventStream(deltas: readonly string[]): string {
  const events: object[] = [
    {
      type: "message_start",
      message: {
        id: "msg_lab",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 1 },
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    ...deltas.map((text) => ({
      type: "content_block_delta",
      index: 0,
      delta: { type: "text_delta", text },
    })),
    { type: "content_block_stop", index: 0 },
    {
      type: "message_delta",
      delta: { stop_reason: "end_turn", stop_sequence: null },
      usage: { output_tokens: 12 },
    },
    { type: "message_stop" },
  ];
  return events
    .map(
      (event) => `event: ${(event as { type: string }).type}\ndata: ${JSON.stringify(event)}\n\n`,
    )
    .join("");
}

type Sent = { url: string; headers: Headers; body: Record<string, unknown> };

function fakeClaude(response: () => Response) {
  const sent: Sent[] = [];
  const client = new Anthropic({
    apiKey: "test-key",
    maxRetries: 0,
    // The unit suite runs under jsdom, which the SDK takes for a browser; the Worker has no DOM.
    dangerouslyAllowBrowser: true,
    fetch: async (input, init) => {
      sent.push({
        url: String(input),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return response();
    },
  });
  return { client, sent };
}

async function collect(chunks: AsyncIterable<string>): Promise<string[]> {
  const all: string[] = [];
  for await (const chunk of chunks) all.push(chunk);
  return all;
}

describe("askClaude", () => {
  afterEach(() => vi.restoreAllMocks());

  it("streams the text deltas as a GenUI response", async () => {
    const deltas = ["<Stack><Text>Hel", "lo", "</Text></Stack>"];
    const { client } = fakeClaude(
      () => new Response(eventStream(deltas), { headers: { "content-type": "text/event-stream" } }),
    );

    const chunks = await collect(askClaude("Say hello", client));

    expect(chunks).toEqual(deltas);
    const validated = labVocabulary.validate(chunks.join(""), { state: labState });
    expect(validated.errors).toEqual([]);
    expect(validated.nodes[0]).toMatchObject({ name: "Stack" });
  });

  it("feeds a view on the server as it arrives", async () => {
    const deltas = ["<Stack><Text>Hi</Text></Stack>"];
    const { client } = fakeClaude(
      () => new Response(eventStream(deltas), { headers: { "content-type": "text/event-stream" } }),
    );

    const response = readResponse(askClaude("Say hi", client));
    await response.until(() => false);

    expect(response.parsed.nodes[0]).toMatchObject({
      name: "Stack",
      children: [{ name: "Text", children: [{ kind: "text", text: "Hi" }] }],
    });
  });

  it("asks Claude with the lab's prompt, tools, and a fallback for declined requests", async () => {
    const { client, sent } = fakeClaude(
      () =>
        new Response(eventStream(["<Text>Hi</Text>"]), {
          headers: { "content-type": "text/event-stream" },
        }),
    );

    await collect(askClaude("Compare Oslo and Lisbon", client));

    expect(sent).toHaveLength(1);
    const [request] = sent;
    expect(request!.url).toMatch(/\/v1\/messages(\?|$)/);
    expect(request!.headers.get("x-api-key")).toBe("test-key");
    expect(request!.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(request!.body).toMatchObject({
      model: "claude-opus-5-5",
      stream: true,
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: labPrompt,
      messages: [{ role: "user", content: "Compare Oslo and Lisbon" }],
    });
    expect(labPrompt).toContain("Forecast");
    expect(labPrompt).toContain("Shader");
    expect(labPrompt).toContain("restricted JSX");
    expect(labPrompt).toContain("subscribe");
  });

  it("ends the response and logs the reason when the API refuses the key", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClaude(() =>
      Response.json(
        { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } },
        { status: 401 },
      ),
    );

    await expect(collect(askClaude("Hello", client))).resolves.toEqual([]);
    expect(log).toHaveBeenCalledWith("GenUI lab: ANTHROPIC_API_KEY was rejected");
  });
});

describe("recorded lab responses", () => {
  it.each([shaderExplorer, forecastExplorer, dashboard, releaseNotes, explainer])(
    "validates a recorded JSX response",
    (source) => {
      const validated = labVocabulary.validate(source, { state: labState });
      expect(validated.errors).toEqual([]);
      expect(validated.nodes).toHaveLength(1);
    },
  );
});

describe("labApiKey", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the key from the Worker's environment and treats a blank one as missing", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", " sk-test ");
    expect(labApiKey()).toBe("sk-test");
    vi.stubEnv("ANTHROPIC_API_KEY", " ");
    expect(labApiKey()).toBeUndefined();
  });
});
