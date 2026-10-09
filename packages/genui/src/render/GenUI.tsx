import { useEffect, useState } from "react";
import { BusyRegion } from "@comp0/react";
import { catalog as defaultCatalog } from "../catalog/catalog.js";
import { type CatalogEntry } from "../catalog/types.js";
import { createGenUIStore, type GenUIState, type GenUIStore } from "../state/store.js";
import { type GenUIError } from "../validate/errors.js";
import { validateResponse, type ValidatedResponse } from "../validate/validate.js";
import { GenUIContext, type GenUIAction } from "./context.js";
import { NodeView } from "./node.js";
import { useLatest } from "./use-latest.js";

export type GenUIProps = {
  /**
   * The model's response: the JSON text (a stream may hand it over a prefix at a time), or an
   * already parsed object. `null`, `undefined`, and the empty string render nothing.
   */
  response: unknown;
  /** The response is still arriving. Output is `aria-busy` and actions wait until it ends. */
  streaming?: boolean | undefined;
  /** The components a response may use; defaults to the built-in `catalog`. */
  catalog?: readonly CatalogEntry[] | undefined;
  /** A button was pressed, a form submitted, or a suggestion chosen. Send `action.message`. */
  onAction?: ((action: GenUIAction) => void) | undefined;
  /** The person changed a control. Receives every stored value by state key. */
  onStateChange?: ((state: GenUIState) => void) | undefined;
  /** Values to restore, such as the state `onStateChange` last reported. Read once. */
  initialState?: Readonly<Record<string, unknown>> | undefined;
  /** The finished response had problems. Send them back to the model with `formatErrors`. */
  onError?: ((errors: GenUIError[]) => void) | undefined;
  /** A store to keep outside the component, which then ignores `initialState`. */
  store?: GenUIStore | undefined;
};

const emptyResponse: ValidatedResponse = {
  root: undefined,
  errors: [],
  complete: true,
  bindings: new Map(),
};

/**
 * Renders a model's JSON response with comp0 components. The response may be a prefix of the
 * final document: every prefix renders, nodes keep their identity as the stream grows, and
 * nothing is reported as an error until `streaming` is false. Output sits in a `BusyRegion`.
 */
export function GenUI({
  response,
  streaming = false,
  catalog = defaultCatalog,
  onAction,
  onStateChange,
  initialState,
  onError,
  store: provided,
}: GenUIProps) {
  const [ownStore] = useState(() => createGenUIStore(initialState));
  const store = provided ?? ownStore;
  const known = Object.keys(initialState ?? {});
  const blank = response === null || response === undefined || response === "";
  const validated = blank
    ? emptyResponse
    : validateResponse(response, { catalog, complete: !streaming, known });

  const latestAction = useLatest(onAction);
  const latestState = useLatest(onStateChange);
  const latestError = useLatest(onError);

  useEffect(
    () => store.subscribeToEdits((state) => latestState.current?.(state)),
    [store, latestState],
  );

  const failures = validated.complete && validated.errors.length > 0 ? validated.errors : undefined;
  // The same problems are reported once, however often the response is validated again.
  const failureText = failures === undefined ? "" : JSON.stringify(failures);
  useEffect(() => {
    if (failureText !== "") latestError.current?.(JSON.parse(failureText) as GenUIError[]);
  }, [failureText, latestError]);

  const context = {
    store,
    streaming,
    bindings: validated.bindings,
    act: (action: GenUIAction) => {
      // Acting on a half-written interface would send a half-written request.
      if (!streaming) latestAction.current?.(action);
    },
  };
  return (
    <BusyRegion busy={streaming}>
      <GenUIContext value={context}>
        {validated.root === undefined ? null : <NodeView node={validated.root} />}
      </GenUIContext>
    </BusyRegion>
  );
}
