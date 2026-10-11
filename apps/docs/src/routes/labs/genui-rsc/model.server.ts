import Anthropic from "@anthropic-ai/sdk";
import { genuiPrompt } from "@comp0/genui/rsc";
import { labTools } from "./lab-tools.js";

/** What the lab tells the model it may compose with: the catalog, the lab's tools, and its views. */
export const labPrompt = genuiPrompt({
  preamble:
    "You are the assistant in the comp0 GenUI lab. Answer each request with an interface composed from the components below, written as JSON.",
  tools: labTools,
  slots: {
    shader:
      'A live plasma shader. It reads the numbers bound as "speed" (0 to 4), "scale" (1 to 12), and "hue" (0 to 360), so sliders bound to those names drive it.',
  },
});

/**
 * The lab's model key, from the Worker's environment: a secret in production, `.dev.vars` or
 * `.env` locally. The lab only offers to ask a model when it is set.
 */
export function labApiKey(): string | undefined {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } };
  const key = runtime.process?.env?.ANTHROPIC_API_KEY?.trim();
  return key === "" ? undefined : key;
}

/** Streams Claude's answer to one request as the text of a GenUI response. */
export async function* askClaude(request: string, client: Anthropic): AsyncGenerator<string> {
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    output_config: { effort: "medium" },
    // A declined request continues on a fallback model in the same stream; a decline mid-answer
    // passes the partial text on, so the JSON keeps growing instead of starting over.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: labPrompt,
    messages: [{ role: "user", content: request }],
  });
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  } catch (error) {
    // The view renders what arrived; the reason belongs in the server log, not the interface.
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("GenUI lab: ANTHROPIC_API_KEY was rejected");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("GenUI lab: rate limited by the Claude API");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`GenUI lab: Claude API error ${error.status}: ${error.message}`);
    } else {
      throw error;
    }
  }
}
