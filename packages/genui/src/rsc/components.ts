import { type ComponentType, type ReactNode } from "react";
import { type OutputOf, type PropShape } from "../catalog/schema.js";
import { builtInVocabulary } from "../composition/builtins.js";
import {
  type ComponentDefinition,
  type ComponentSpec,
  type Vocabulary,
} from "../composition/spec.js";
import { validateProp } from "../composition/validate.js";
import { type JsonValue } from "../json/parse.js";

/** A server-only data implementation of an existing model contract. */
export function serverComponent<P extends PropShape>(
  spec: ComponentSpec<P>,
  render: (props: OutputOf<P>) => ReactNode | Promise<ReactNode>,
) {
  if (spec.children || spec.binding)
    throw new Error(`${spec.name}: a server data component must be an unbound leaf.`);
  return { spec, render };
}

export type Implementation =
  | ComponentDefinition
  | {
      readonly spec: ComponentSpec;
      readonly render: (props: never) => ReactNode | Promise<ReactNode>;
    };

export function register(vocabulary: Vocabulary, definitions: readonly Implementation[]) {
  const entries = new Map<ComponentSpec, Implementation>();
  for (const entry of definitions) {
    const { spec } = entry;
    if (vocabulary.get(spec.name) !== spec)
      throw new Error(`Implementation must use the vocabulary's spec for ${spec.name}.`);
    if (entries.has(spec)) throw new Error(`Duplicate implementation: ${spec.name}`);
    entries.set(spec, entry);
  }
  for (const spec of vocabulary.specs) {
    if (!entries.has(spec) && builtInVocabulary.get(spec.name) !== spec)
      throw new Error(`Missing implementation: ${spec.name}`);
  }
  return {
    get(spec: ComponentSpec) {
      const entry = entries.get(spec);
      if (!entry || "render" in entry) return entry;
      return { component: entry.component as ComponentType<never> };
    },
    async render(name: string, props: unknown): Promise<ReactNode> {
      const spec = vocabulary.get(name);
      const entry = spec && entries.get(spec);
      if (!entry || !("render" in entry)) throw new Error(`Unknown server component: ${name}`);
      const checked = validateProp(entry.spec.props, props);
      if (!checked.ok) throw new Error(`Invalid ${name} props: ${checked.message}`);
      // Registration ties the callback to this exact spec. The heterogeneous map erases P.
      return entry.render(checked.value as never);
    },
  };
}

export type ComponentRegistry = ReturnType<typeof register>;

/** Host transport contract. RSC encoding belongs to the host's framework. */
export type ComponentRenderer = (
  name: string,
  props: Readonly<Record<string, JsonValue>>,
  signal: AbortSignal,
) => Promise<ReactNode>;
