import { Suspense, type ReactNode } from "react";
import { type Vocabulary } from "../composition/spec.js";
import { type StateContract } from "../composition/state.js";
import { type ComponentImplementations } from "./components.js";
import { readResponse, type ResponseStream } from "./stream.js";
import { GenUIStreamEnd, GenUIViewScope } from "./client.js";
import { ResponseView } from "./surface.js";

export type Hole = { vocabulary: Vocabulary; instruction: string; max: number };

/** A bounded place for the model to compose inside a host-owned layout. */
export function hole(
  vocabulary: Vocabulary,
  instruction: string,
  options: { max?: number } = {},
): Hole {
  const max = options.max ?? 100;
  if (!Number.isInteger(max) || max < 1 || max > 1000)
    throw new Error("A hole's max must be between 1 and 1000.");
  return { vocabulary, instruction, max };
}

type FillOptions = {
  state?: StateContract;
  components?: ComponentImplementations;
  history?: readonly string[];
  turn?: string;
};

async function HoleContent({
  response,
  name,
  definition,
  options,
}: {
  response: ResponseStream;
  name: string;
  definition: Hole;
  options: FillOptions;
}) {
  const find = () =>
    response.parsed.nodes.find((node) => node.kind === "element" && node.name === name);
  await response.until(() => find() !== undefined);
  const node = find();
  if (!node && options.history !== undefined) return null;
  if (!node)
    return (
      <GenUIViewScope>
        <GenUIStreamEnd
          errors={[
            { path: "", code: "missing-prop", message: `The response must fill the ${name} hole.` },
          ]}
        />
      </GenUIViewScope>
    );
  return (
    <ResponseView
      response={response}
      vocabulary={definition.vocabulary}
      state={options.state}
      components={options.components ?? {}}
      root={node.key}
      max={definition.max}
      name={name}
      history={options.history}
      turn={options.turn}
    />
  );
}

/** One model response can fill several named places without taking over the page's layout. */
export function holes<const T extends Record<string, Hole>>(definitions: T) {
  for (const name of Object.keys(definitions)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) throw new Error(`Invalid hole name: ${name}`);
  }
  return {
    prompt(options: { state?: StateContract } = {}) {
      return Object.entries(definitions)
        .map(
          ([name, definition]) =>
            `Fill <${name}>...</${name}> exactly once. ${definition.instruction} At most ${definition.max} direct children.\n${definition.vocabulary.prompt(options)}`,
        )
        .join("\n\n");
    },
    fill(
      chunks: AsyncIterable<string>,
      options: FillOptions = {},
    ): { [K in keyof T]: () => ReactNode } {
      const response = readResponse(chunks);
      return Object.fromEntries(
        Object.entries(definitions).map(([name, definition]) => {
          function Content() {
            return (
              <Suspense fallback={null}>
                <HoleContent
                  response={response}
                  name={name}
                  definition={definition}
                  options={options}
                />
              </Suspense>
            );
          }
          return [name, Content];
        }),
      ) as { [K in keyof T]: () => ReactNode };
    },
  };
}
