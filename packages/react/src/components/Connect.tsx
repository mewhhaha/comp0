import { useCallback, useId, useState, type HTMLAttributes } from "react";
import { composeRefs, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  ConnectContext,
  compatiblePorts,
  portLabel,
  type ConnectConnection,
  type ConnectPort,
} from "./connect-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

/* oxlint-disable jsx-a11y/no-static-element-interactions -- The labelled group handles Escape bubbling from its native port controls. */

export type ConnectProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  value?: readonly ConnectConnection[];
  defaultValue?: readonly ConnectConnection[];
  onChange?: (connections: readonly ConnectConnection[]) => void;
};

export function Connect({
  value,
  defaultValue,
  onChange,
  children,
  onKeyDown,
  ref,
  ...props
}: ConnectProps & RefProp<HTMLDivElement>) {
  const instructionsId = useId();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [connections, setConnections] = useControllableState<readonly ConnectConnection[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  const connectedInputs = new Set<string>();
  for (const connection of connections) {
    if (!connection.from || !connection.to || connectedInputs.has(connection.to)) {
      throw new Error(
        `Connect requires nonempty endpoints and one source per input; received ${JSON.stringify(connection)}.`,
      );
    }
    connectedInputs.add(connection.to);
  }
  const [ports, setPorts] = useState<readonly ConnectPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<ConnectPort | null>(null);
  let selectedOutput: string | null = null;
  if (selectedPort && ports.includes(selectedPort) && !selectedPort.disabled)
    selectedOutput = selectedPort.value;
  const [announcement, setAnnouncement] = useState("");

  // Port registration is a layout-effect dependency, including after a compiler bailout.
  const register = useCallback((port: ConnectPort) => {
    if (!port.value || !port.kind || !port.label || !port.card || !port.cardLabel) {
      throw new Error(
        `Connect ${port.direction} "${port.value}" requires a nonempty value, label, kind, and labelled card.`,
      );
    }
    setPorts((previous) => {
      if (
        previous.some((entry) => entry.direction === port.direction && entry.value === port.value)
      ) {
        throw new Error(`Connect has duplicate ${port.direction} value "${port.value}".`);
      }
      return [...previous, port];
    });
    return () => setPorts((previous) => previous.filter((entry) => entry !== port));
  }, []);

  function cancel() {
    const output = ports.find(
      (port) => port.direction === "output" && port.value === selectedOutput,
    );
    setSelectedPort(null);
    setAnnouncement("Connection cancelled.");
    output?.element.focus();
  }

  function selectOutput(outputValue: string) {
    if (selectedOutput === outputValue) {
      cancel();
      return;
    }
    const output = ports.find((port) => port.direction === "output" && port.value === outputValue);
    if (!output || output.disabled) return;
    setSelectedPort(output);
    setAnnouncement(
      `${portLabel(output)} selected. Choose a matching input, or press Escape to cancel.`,
    );
  }

  function connect(from: string, to: string) {
    const output = ports.find((port) => port.direction === "output" && port.value === from);
    const input = ports.find((port) => port.direction === "input" && port.value === to);
    if (!output || !input || !compatiblePorts(output, input)) {
      setAnnouncement("These ports cannot be connected. Choose matching types on different cards.");
      return;
    }
    setConnections([...connections.filter((connection) => connection.to !== to), { from, to }]);
    setSelectedPort(null);
    let action = "Connected";
    if (value !== undefined) action = "Requested connection from";
    setAnnouncement(`${action} ${portLabel(output)} to ${portLabel(input)}.`);
  }

  function disconnect(to: string) {
    setSelectedPort(null);
    setConnections(connections.filter((connection) => connection.to !== to));
    const input = ports.find((port) => port.direction === "input" && port.value === to);
    let action = "Disconnected";
    if (value !== undefined) action = "Requested disconnection of";
    setAnnouncement(`${action} ${input ? portLabel(input) : to}.`);
  }

  return (
    <ConnectContext
      value={{
        instructionsId,
        connections,
        ports,
        selectedOutput,
        element,
        register,
        selectOutput,
        connect,
        disconnect,
        cancel,
      }}
    >
      <div
        {...props}
        ref={composeRefs(ref, setElement)}
        role={props.role ?? "group"}
        data-connect-root=""
        style={{ position: "relative", ...props.style }}
        data-slot={dataSlot(props, "connect")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || selectedOutput === null) return;
          event.preventDefault();
          event.stopPropagation();
          cancel();
        }}
      >
        <span id={instructionsId} style={visuallyHiddenStyle}>
          Choose an output, then a matching input to connect. Escape cancels. Each input also has a
          source selector. When a card is focused, use Up and Down to visit cards, or Home and End
          for the first and last card.
        </span>
        {children}
        <output aria-live="polite" aria-atomic="true" style={visuallyHiddenStyle}>
          {announcement}
        </output>
      </div>
    </ConnectContext>
  );
}
