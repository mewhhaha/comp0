import { createContext, useContext, useLayoutEffect } from "react";

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
  element: HTMLDivElement | null;
  register: (port: ConnectPort) => () => void;
  selectOutput: (value: string) => void;
  connect: (from: string, to: string) => void;
  disconnect: (to: string) => void;
  cancel: () => void;
};

export const ConnectContext = createContext<ConnectContextValue | null>(null);
export const ConnectCardContext = createContext<{
  value: string;
  label: string;
  disabled: boolean;
} | null>(null);
export const ConnectInputContext = createContext<{
  value: string;
  label: string;
  kind: string;
  disabled: boolean;
} | null>(null);

export function useConnectContext(part: string) {
  const context = useContext(ConnectContext);
  if (!context) throw new Error(`${part} must be rendered inside Connect.`);
  return context;
}

export function useConnectCardContext(part: string) {
  const context = useContext(ConnectCardContext);
  if (!context) throw new Error(`${part} must be rendered inside ConnectCard.`);
  return context;
}

export function useConnectInputContext(part: string) {
  const context = useContext(ConnectInputContext);
  if (!context) throw new Error(`${part} must be rendered inside ConnectInput.`);
  return context;
}

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
