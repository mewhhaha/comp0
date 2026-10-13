import { type ComponentType, type ReactNode } from "react";
import { type OutputOf, type PropShape } from "../catalog/schema.js";
import { spec, type ComponentSpec } from "../composition/spec.js";
import { validateProp } from "../composition/validate.js";
import { type JsonValue } from "../json/parse.js";

export type ServerComponent<TProps extends PropShape = PropShape> = {
  kind: "server";
  spec: ComponentSpec<TProps>;
  render: (props: OutputOf<TProps>) => ReactNode | Promise<ReactNode>;
};

/** A data read represented by a component. The implementation never leaves the server. */
export function serverComponent<TProps extends PropShape>(
  name: string,
  options: {
    description: string;
    props: TProps;
    render: (props: OutputOf<TProps>) => ReactNode | Promise<ReactNode>;
  },
): ServerComponent<TProps> {
  return { kind: "server", spec: spec(name, options), render: options.render };
}

// Typed implementations accept narrower props; validation at the named boundary establishes them.
export type ComponentImplementations = Readonly<
  Record<
    string,
    | ComponentType<never>
    | {
        kind: "server";
        spec: ComponentSpec;
        render: unknown;
      }
  >
>;

export function isServerComponent(value: unknown): value is ServerComponent {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "server";
}

/** Host transport contract. RSC encoding belongs to the host's framework. */
export type ComponentRenderer = (
  name: string,
  props: Readonly<Record<string, JsonValue>>,
  signal: AbortSignal,
) => Promise<ReactNode>;

/** Validates every request again on the server before invoking a registered data component. */
export async function renderComponent(
  components: ComponentImplementations,
  name: string,
  props: unknown,
): Promise<ReactNode> {
  const definition = Object.getOwnPropertyDescriptor(components, name)?.value as unknown;
  if (!isServerComponent(definition)) throw new Error(`Unknown server component: ${name}`);
  const validated = validateProp(definition.spec.props, props);
  if (!validated.ok) throw new Error(`Invalid ${name} props: ${validated.message}`);
  return definition.render(validated.value as OutputOf<PropShape>);
}
