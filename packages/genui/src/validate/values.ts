import { type CatalogSpec } from "../catalog/types.js";
import { type Expression } from "../expression/expression.js";
import { type JsonValue } from "../json/parse.js";

/**
 * A component that passed validation: the catalog spec it matched (with its component, when validated against a catalog of entries) and the props that
 * survived, with nested components as further nodes and bindings and expressions resolved into
 * {@link Binding} and {@link Computed}. `key` is the node's JSON Pointer, which stays the same
 * while a streamed response grows, so React never remounts a rendered component.
 */
class ValidNode {
  constructor(
    readonly key: string,
    readonly entry: CatalogSpec,
    readonly props: Readonly<Record<string, unknown>>,
  ) {}
}

/** A control prop bound to a shared name: `{ "$bind": "seats", "initial": 3 }`. */
class Binding {
  constructor(
    readonly name: string,
    readonly initial: JsonValue | undefined,
  ) {}
}

/** A prop computed from bound names: `{ "$expr": "seats * 12" }`. */
class Computed {
  constructor(readonly expression: Expression) {}

  get source(): string {
    return this.expression.source;
  }
}

export { Binding, Computed, ValidNode };
