import Anthropic from "@anthropic-ai/sdk";
import { labState, labVocabulary } from "./contract.js";
import { labTools } from "./lab-tools.js";

/** What the lab tells the model it may compose with: the catalog, the lab's tools, and its views. */
export const labPrompt = [
  "You are the assistant in the comp0 GenUI lab. Compose an interface using the following restricted JSX vocabulary.",
  labVocabulary.prompt({ state: labState }),
  "Action tools (call steps on Form or Button):",
  ...Object.entries(labTools).map(([name, tool]) => `${name}: ${tool.description}`),
].join("\n\n");

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
    // passes the partial text on, so the JSX keeps growing instead of starting over.
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
