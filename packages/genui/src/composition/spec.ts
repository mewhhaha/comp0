import { type ComponentType, type ReactNode } from "react";
import { jsonSchemaOf, shapeEntries, type OutputOf, type PropShape } from "../catalog/schema.js";
export type ComponentChildren = "text" | "label" | "nodes" | readonly string[];
export type ComponentBinding = { prop: string; kind: "string" | "number" | "boolean" | "strings" };

type BindingValues = { string: string; number: number; boolean: boolean; strings: string[] };
type ClientProps<P extends PropShape, K extends keyof BindingValues | undefined> = OutputOf<P> & {
  children?: ReactNode;
} & (K extends keyof BindingValues ? { onChange?: (next: BindingValues[K]) => void } : {});

type SpecData<P extends PropShape> = {
  readonly name: string;
  readonly description: string;
  readonly props: P;
  readonly children?: ComponentChildren;
  readonly binding?: ComponentBinding;
  readonly parents?: readonly string[];
  readonly identity?: { prop: string; scope: string; matchesBoundValue?: boolean };
};

/** The default type erases the renderer while retaining the server-safe contract. */
export type ComponentDefinition<
  P extends PropShape = PropShape,
  K extends keyof BindingValues | undefined = undefined,
> = {
  readonly spec: ComponentSpec<P, K>;
  readonly component: string extends keyof P ? unknown : ComponentType<ClientProps<P, K>>;
};

export type ComponentSpec<
  P extends PropShape = PropShape,
  K extends keyof BindingValues | undefined = undefined,
> = SpecData<P> & {
  implement(
    component: string extends keyof P ? never : ComponentType<ClientProps<P, K>>,
  ): ComponentDefinition<P, K>;
};

/** Describes a JSX component without loading its implementation. */
export function spec<P extends PropShape, K extends keyof BindingValues | undefined = undefined>(
  name: string,
  options: Omit<SpecData<P>, "name" | "binding"> & {
    binding?: { prop: string; kind: K & keyof BindingValues };
  },
): ComponentSpec<P, K> {
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid component name: ${name}`);
  if (name === "Update" || name === "Append")
    throw new Error(`${name} is reserved for edit operations`);
  const names = shapeEntries(options.props).map((entry) => entry.name);
  if (new Set(names).size !== names.length) throw new Error(`${name} has duplicate props`);
  if (
    names.includes("id") ||
    names.includes("bind") ||
    names.includes("children") ||
    names.includes("onChange")
  ) {
    throw new Error(`${name}: id, bind, children and onChange are composition props`);
  }
  if (options.binding && !names.includes(options.binding.prop)) {
    throw new Error(`${name}: unknown binding prop ${options.binding.prop}`);
  }
  jsonSchemaOf(options.props);
  if (options.identity && !names.includes(options.identity.prop)) {
    throw new Error(`${name}: unknown identity prop ${options.identity.prop}`);
  }
  const contract: ComponentSpec<P, K> = {
    ...options,
    name,
    implement(component) {
      return { spec: contract, component } as ComponentDefinition<P, K>;
    },
  };
  return contract;
}

export type Vocabulary = {
  readonly specs: readonly ComponentSpec[];
  get(name: string): ComponentSpec | undefined;
  only(...names: string[]): Vocabulary;
};

type VocabularyItem = ComponentSpec | Vocabulary | readonly ComponentSpec[];

/** A set of contracts. Combining groups and selecting subsets preserves spec identity. */
export function vocabulary(...items: VocabularyItem[]): Vocabulary {
  const byName = new Map<string, ComponentSpec>();
  function add(entry: ComponentSpec) {
    if (byName.has(entry.name)) throw new Error(`Duplicate component: ${entry.name}`);
    byName.set(entry.name, entry);
  }
  for (const item of items) {
    if ("specs" in item) item.specs.forEach(add);
    else if ("name" in item) add(item);
    else item.forEach(add);
  }
  return {
    specs: Object.freeze([...byName.values()]),
    get: (name) => byName.get(name),
    only(...names) {
      return vocabulary(
        names.map((name) => {
          const entry = byName.get(name);
          if (!entry) throw new Error(`Unknown component: ${name}`);
          return entry;
        }),
      );
    },
  };
}
