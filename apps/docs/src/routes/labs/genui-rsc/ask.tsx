import Anthropic from "@anthropic-ai/sdk";
import { GenUIView } from "@comp0/genui/rsc";
import { type ReactNode } from "react";
import { Form, Link } from "react-router";
import { AskRoot } from "./AskRoot.js";
import { askClaude, labApiKey } from "./model.server.js";
import { labState, labVocabulary } from "./contract.js";
import { labComponents } from "./components.server.js";

type AskLoaderData = { prompt: string; after: string };

export function meta() {
  return [{ title: "Ask a model · GenUI on React Server Components · Labs · comp0" }];
}

// Long enough for any real request, short enough that the page is not a free proxy.
const maxPromptLength = 2000;

const ideas = [
  "Let me explore the plasma shader with sliders",
  "Compare this week's forecast for Oslo and Lisbon",
  "Help me budget a three-day team offsite for eight people",
];

export function loader({ request }: { request: Request }): AskLoaderData {
  const search = new URL(request.url).searchParams;
  return {
    prompt: (search.get("prompt") ?? "").trim().slice(0, maxPromptLength),
    after: (search.get("after") ?? "").trim().slice(0, maxPromptLength),
  };
}

function requestText(prompt: string, after: string): string {
  if (after === "") return prompt;
  return `This follows my earlier request: ${after}\n\n${prompt}`;
}

export function ServerComponent({ loaderData }: { loaderData: AskLoaderData }) {
  const { prompt, after } = loaderData;
  const apiKey = labApiKey();
  // Without a key the page says what is missing; with one it offers a few requests to start from.
  let hint: ReactNode = (
    <p id="ask-unavailable" className="text-sm/6 text-zinc-600 dark:text-zinc-300">
      Asking needs an Anthropic API key: set <code>ANTHROPIC_API_KEY</code> in the Worker&apos;s
      environment (<code>.dev.vars</code> or <code>.env</code> locally, a secret when deployed).
    </p>
  );
  if (apiKey !== undefined) {
    hint = ideas.map((idea) => (
      <Link
        key={idea}
        to={`?${new URLSearchParams({ prompt: idea })}`}
        className="rounded-full border border-zinc-300 px-3 py-1 text-sm/6 text-zinc-700 hover:border-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white"
      >
        {idea}
      </Link>
    ));
  }
  let answer: ReactNode = null;
  if (apiKey !== undefined && prompt !== "") {
    const stream = askClaude(requestText(prompt, after), new Anthropic({ apiKey }));
    answer = (
      <AskRoot key={`${after}\n${prompt}`} prompt={prompt}>
        <section aria-label="Answer" data-intelligent-ui="">
          <GenUIView
            stream={stream}
            vocabulary={labVocabulary}
            state={labState}
            components={labComponents}
          />
        </section>
      </AskRoot>
    );
  }
  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:px-6 lg:px-10">
      <header className="grid gap-2">
        <p className="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">
          <Link to="/labs/genui-rsc" className="hover:text-zinc-950 dark:hover:text-white">
            Labs · GenUI on React Server Components
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Ask a model
        </h1>
        <p className="max-w-[60ch] text-base/7 text-zinc-600 dark:text-zinc-300">
          Claude composes an answer from the catalog, the lab&apos;s tools, and the shader, and the
          server streams it as it writes.
        </p>
      </header>
      <Form method="get" className="grid gap-3">
        <label
          htmlFor="ask-prompt"
          className="text-sm/6 font-semibold text-zinc-950 dark:text-white"
        >
          What should the interface help with?
        </label>
        <textarea
          id="ask-prompt"
          name="prompt"
          required
          rows={3}
          maxLength={maxPromptLength}
          defaultValue={prompt}
          disabled={apiKey === undefined}
          aria-describedby={apiKey === undefined ? "ask-unavailable" : undefined}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base/6 text-zinc-950 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={apiKey === undefined}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm/6 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950"
          >
            Ask
          </button>
          {hint}
        </div>
      </Form>
      {answer}
    </div>
  );
}
