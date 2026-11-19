import { type Composition } from "../composition/composition.js";
import { register, type Implementation } from "./components.js";
import { createHoles, type Hole } from "./holes.js";
import { readResponse } from "./stream.js";
import { ResponseView, type GenUIViewProps } from "./surface.js";

/** Bind implementations once on the server. Every response shares the same contract and registry. */
export function createRenderer(ui: Composition, ...definitions: Implementation[]) {
  const components = register(ui.vocabulary, definitions);
  function View({ source, history, turn }: GenUIViewProps) {
    return (
      <ResponseView
        response={readResponse(source)}
        vocabulary={ui.vocabulary}
        state={ui.state}
        components={components}
        history={history}
        turn={turn}
      />
    );
  }
  return {
    View,
    render: components.render,
    holes<const T extends Record<string, Hole>>(definitions: T) {
      return createHoles(ui, components, definitions);
    },
  };
}
