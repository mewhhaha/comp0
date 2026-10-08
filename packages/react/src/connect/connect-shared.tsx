import { useLayoutEffect } from "react";
import { createRequiredContext } from "../internal/context.js";

export type ConnectConnection = { from: string; to: string };

export type ConnectPort = {
  value: string;
  label: string;
  kind: string;
  card: string;
  cardLabel: string;
  direction: "input" | "output";
  disabled: boolean;
  element: HTMLElement;
};

export type ConnectContextValue = {
  instructionsId: string;
  connections: readonly ConnectConnection[];
  ports: readonly ConnectPort[];
  selectedOutput: string | null;
  element: HTMLElement | null;
  register: (port: ConnectPort) => () => void;
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
};

export const [ConnectContext, useConnectContext] =
  createRequiredContext<ConnectContextValue>("Connect");
export const [ConnectCardContext, useConnectCardContext] =
  createRequiredContext<ConnectCardContextValue>("ConnectCard");
export const [ConnectInputContext, useConnectInputContext] =
  createRequiredContext<ConnectInputContextValue>("ConnectInput");

export function useConnectPort(port: Omit<ConnectPort, "element">, element: HTMLElement | null) {
  const { register } = useConnectContext("Connect port");
  const { value, label, kind, card, cardLabel, direction, disabled } = port;
  useLayoutEffect(() => {
    if (!element) return;
    return register({ value, label, kind, card, cardLabel, direction, disabled, element });
  }, [register, value, label, kind, card, cardLabel, direction, disabled, element]);
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
