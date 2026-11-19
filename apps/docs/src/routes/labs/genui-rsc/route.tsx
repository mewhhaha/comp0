import { Link } from "react-router";
import { dashboard, explainer } from "./responses.js";
import { labRenderer } from "./components.server.js";
import { forecastExplorer } from "./forecast-explorer.js";
import { releaseNotes } from "./release-notes.js";
import { LiveValues } from "./LiveValues.js";
import { LabRoot } from "./LabRoot.js";
import { shaderExplorer } from "./shader-explorer.js";

export function meta() {
  return [{ title: "GenUI on React Server Components · Labs · comp0" }];
}

/** Replays a recorded response as a model would stream it: a few tokens at a time. */
async function* replay(response: string): AsyncGenerator<string> {
  const tokens = response.match(/[A-Za-z0-9$.]+|\s+|[^A-Za-z0-9$.\s]/g) ?? [];
  for (let index = 0; index < tokens.length; index += 3) {
    await new Promise((resolve) => setTimeout(resolve, 45));
    yield tokens.slice(index, index + 3).join("");
  }
}

export function ServerComponent() {
  return (
    <div className="mx-auto grid max-w-4xl gap-16 px-4 py-12 sm:px-6 lg:px-10">
      <header className="grid gap-2">
        <p className="text-sm/6 font-medium text-zinc-500 dark:text-zinc-400">Labs</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          GenUI on React Server Components
        </h1>
        <p className="max-w-[60ch] text-base/7 text-zinc-600 dark:text-zinc-300">
          Each response below is replayed on the server and streamed as RSC. Layout renders on the
          server with no JavaScript; controls, charts, and the shader are predefined client
          components that share one store.{" "}
          <Link
            to="/labs/genui-rsc/ask"
            className="font-medium text-zinc-950 underline dark:text-white"
          >
            Ask a model
          </Link>{" "}
          to compose one live, or try the{" "}
          <Link to="/labs/genui-rsc/compose" className="underline">
            JSX playground
          </Link>
          .
        </p>
      </header>
      <LabRoot>
        <section aria-label="Live values" className="grid gap-2">
          <h2 className="text-sm/6 font-semibold text-zinc-950 dark:text-white">
            Live values, read by a host component outside every view
          </h2>
          <LiveValues />
        </section>
        <section aria-label="Shader explorer" data-genui="">
          <labRenderer.View source={replay(shaderExplorer)} />
        </section>
        <section aria-label="Forecast" data-genui="">
          <labRenderer.View source={replay(forecastExplorer)} />
        </section>
        <section aria-label="How did the product do this week?" data-genui="">
          <labRenderer.View source={replay(dashboard)} />
        </section>
        <section aria-label="Release notes" data-genui="">
          <labRenderer.View source={replay(releaseNotes)} />
        </section>
        <section aria-label="Explain how OAuth works." data-genui="">
          <labRenderer.View source={replay(explainer)} />
        </section>
      </LabRoot>
    </div>
  );
}
