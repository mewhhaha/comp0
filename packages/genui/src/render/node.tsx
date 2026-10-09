import { type ReactNode } from "react";
import { Binding, Computed, ValidNode } from "../validate/values.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

/**
 * Turns validated props into the props a facade renders: nested components become keyed React
 * elements, and bindings and computed values stay for the facade's hooks to read.
 */
function resolveValue(value: unknown): unknown {
  if (value instanceof ValidNode) return <NodeView key={value.key} node={value} />;
  if (value instanceof Binding || value instanceof Computed) return value;
  if (Array.isArray(value)) return value.map(resolveValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveValue(item)]),
    );
  }
  return value;
}

type NodeViewProps = { node: ValidNode };

/** Renders one validated component with its catalog entry's facade. */
export function NodeView({ node }: NodeViewProps): ReactNode {
  const Facade = node.entry.component;
  const props = Object.fromEntries(
    Object.entries(node.props).map(([key, value]) => [key, resolveValue(value)]),
  );
  return <Facade {...props} />;
}
