import { useLayoutEffect } from "react";
import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import { useWarnOnce } from "../internal/dev.js";

export type ConnectConnection = { from: string; to: string };

/** A registered port; `key` is `${direction}:${value}` so inputs and outputs may share a value. */
export type ConnectPort = CollectionItem & {
  value: string;
  label: string;
  kind: string;
  card: string;
  cardLabel: string;
  direction: "input" | "output";
  disabled: boolean;
  element: HTMLElement;
  /** The element a wire attaches to; the input trigger when there is one, else `element`. */
  anchor: HTMLElement;
};

/** The connection state a Connect hands its parts. */

export type ConnectContextValue = {
  instructionsId: string;
  connections: readonly ConnectConnection[];
  ports: readonly ConnectPort[];
  selectedOutput: string | null;
  element: HTMLElement | null;
  /** Port registry; read back in document order through `ports`. */
  portCollection: Collection<ConnectPort>;
  /** Card registry used for Up, Down, Home, and End card navigation. */
  cards: Collection;
  selectOutput: (value: string) => void;
  connect: (from: string, to: string) => void;
  disconnect: (to: string) => void;
  cancel: () => void;
};

export type ConnectCardContextValue = {
  value: string;
  label: string;
  disabled: boolean;
};

export type ConnectInputContextValue = {
  value: string;
  label: string;
  kind: string;
  disabled: boolean;
  /** The input's native source selector, focused after disconnecting. */
  select: HTMLElement | null;
  setTrigger: (element: HTMLElement | null) => void;
  setSelect: (element: HTMLElement | null) => void;
};

export const [ConnectContext, useConnectContext] =
  createRequiredContext<ConnectContextValue>("Connect");
export const [ConnectCardContext, useConnectCardContext] =
  createRequiredContext<ConnectCardContextValue>("ConnectCard");
export const [ConnectInputContext, useConnectInputContext] =
  createRequiredContext<ConnectInputContextValue>("ConnectInput");

export function useConnectPort(
  port: Omit<ConnectPort, "key" | "textValue" | "element" | "anchor">,
  element: HTMLElement | null,
  anchor: HTMLElement | null,
) {
  const warn = useWarnOnce();
  const { portCollection } = useConnectContext("Connect port");
  const { value, label, kind, card, cardLabel, direction, disabled } = port;
  useLayoutEffect(() => {
    if (!element) return;
    if (!value || !kind || !label || !card || !cardLabel) {
      warn(
        `Connect:port:${direction}:${value}:${label}`,
        `Connect ${direction} "${value}" requires a nonempty value, label, kind, and labelled card. It was skipped.`,
      );
      return;
    }
    const key = `${direction}:${value}`;
    if (
      portCollection.get(key)?.element !== undefined &&
      portCollection.get(key)?.element !== element
    ) {
      throw new Error(`Connect has duplicate ${direction} value "${value}".`);
    }
    portCollection.register({
      key,
      textValue: label,
      value,
      label,
      kind,
      card,
      cardLabel,
      direction,
      disabled,
      element,
      anchor: anchor ?? element,
    });
    return () => {
      portCollection.unregister(key, element);
    };
  }, [
    portCollection,
    value,
    label,
    kind,
    card,
    cardLabel,
    direction,
    disabled,
    element,
    anchor,
    warn,
  ]);
}

export function compatiblePorts(output: ConnectPort, input: ConnectPort) {
  return (
    output.direction === "output" &&
    input.direction === "input" &&
    output.card !== input.card &&
    output.kind === input.kind &&
    !output.disabled &&
    !input.disabled
  );
}

export function portLabel(port: ConnectPort) {
  return `${port.cardLabel}: ${port.label} (${port.kind})`;
}
