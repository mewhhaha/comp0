import { GenUIRoot, GenUIView } from "@comp0/genui/rsc";
import { demoResponses, tokenize } from "../../../examples/demos/intelligent-ui-responses.js";
import { forecastExplorer } from "./forecast-explorer.js";
import { LiveValues } from "./LiveValues.js";
import { ShaderCanvas } from "./ShaderCanvas.js";
import { shaderExplorer } from "./shader-explorer.js";

export function meta() {
  return [{ title: "GenUI on React Server Components · Labs · comp0" }];
}

/** Replays a recorded response as a model would stream it: a few tokens at a time. */
async function* replay(response: string): AsyncGenerator<string> {
  const tokens = tokenize(response);
  for (let index = 0; index < tokens.length; index += 3) {
    await new Promise((resolve) => setTimeout(resolve, 45));
    yield tokens.slice(index, index + 3).join("");
  }
}

export function ServerComponent() {
  const dashboard = demoResponses.find((demo) => demo.title === "Dashboard")!;
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
          components that share one store.
        </p>
      </header>
      <GenUIRoot call="/labs/genui-rsc/tools" slots={{ shader: <ShaderCanvas /> }}>
        <section aria-label="Live values" className="grid gap-2">
          <h2 className="text-sm/6 font-semibold text-zinc-950 dark:text-white">
            Live values, read by a host component outside every view
          </h2>
          <LiveValues />
        </section>
        <section aria-label="Shader explorer" data-intelligent-ui="">
          <GenUIView stream={replay(shaderExplorer)} />
        </section>
        <section aria-label="Forecast" data-intelligent-ui="">
          <GenUIView stream={replay(forecastExplorer)} />
        </section>
        <section aria-label={dashboard.prompt} data-intelligent-ui="">
          <GenUIView stream={replay(dashboard.response)} />
        </section>
      </GenUIRoot>
    </div>
  );
}
