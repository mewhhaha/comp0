import { Suspense, type ReactNode } from "react";
import { type Vocabulary } from "../composition/spec.js";
import { composition, type Composition } from "../composition/composition.js";
import { type ComponentRegistry } from "./components.js";
import { readResponse, type ResponseSource, type ResponseStream } from "./stream.js";
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
  history?: readonly string[];
  turn?: string;
};

async function HoleContent({
  response,
  name,
  definition,
  options,
  ui,
  components,
}: {
  response: ResponseStream;
  name: string;
  definition: Hole;
  options: FillOptions;
  ui: Composition;
  components: ComponentRegistry;
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
      state={ui.state}
      components={components}
      root={node.key}
      max={definition.max}
      name={name}
      history={options.history}
      turn={options.turn}
    />
  );
}

/** One model response can fill several named places without taking over the page's layout. */
export function createHoles<const T extends Record<string, Hole>>(
  ui: Composition,
  components: ComponentRegistry,
  definitions: T,
) {
  for (const [name, definition] of Object.entries(definitions)) {
    for (const spec of definition.vocabulary.specs) {
      if (ui.vocabulary.get(spec.name) !== spec)
        throw new Error(`Hole ${name}: ${spec.name} is outside the composition.`);
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) throw new Error(`Invalid hole name: ${name}`);
  }
  return {
    prompt() {
      return Object.entries(definitions)
        .map(
          ([name, definition]) =>
            `Fill <${name}>...</${name}> exactly once. ${definition.instruction} At most ${definition.max} direct children.\n${composition({ vocabulary: definition.vocabulary, state: ui.state }).prompt()}`,
        )
        .join("\n\n");
    },
    fill(source: ResponseSource, options: FillOptions = {}): { [K in keyof T]: () => ReactNode } {
      const response = readResponse(source);
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
                  ui={ui}
                  components={components}
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
