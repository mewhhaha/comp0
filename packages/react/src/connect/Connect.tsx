import { useId, useLayoutEffect, useState, type ComponentProps, type KeyboardEvent } from "react";
import { composeRefs, useCollection, useControllableState } from "@comp0/core";
import { warnOnce } from "../internal/dev.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  ConnectContext,
  compatiblePorts,
  portLabel,
  type ConnectConnection,
  type ConnectPort,
} from "./connect-shared.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type ConnectProps = Omit<ComponentProps<"div">, "onChange" | "defaultValue"> &
  AsProp & {
    value?: readonly ConnectConnection[];
    defaultValue?: readonly ConnectConnection[];
    onChange?: (connections: readonly ConnectConnection[]) => void;
  };

export function Connect({
  as,
  value,
  defaultValue,
  onChange,
  children,
  onKeyDown,
  ref,
  ...props
}: ConnectProps) {
  const instructionsId = useId();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [requestedConnections, setConnections] = useControllableState<readonly ConnectConnection[]>(
    {
      value,
      defaultValue: defaultValue ?? [],
      onChange,
    },
  );
  const connections = validConnections(requestedConnections);
  const portCollection = useCollection<ConnectPort>();
  const cards = useCollection();
  const [ports, setPorts] = useState<readonly ConnectPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<ConnectPort | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Ports register in their own layout effects, which run before this one, so the list is read
  // once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncPorts = () => setPorts(portCollection.items());
    syncPorts();
    return portCollection.subscribe(syncPorts);
  }, [portCollection]);

  let selectedOutput: string | null = null;
  if (selectedPort && ports.includes(selectedPort) && !selectedPort.disabled) {
    selectedOutput = selectedPort.value;
  }

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

  const Part = partElement(as, "div");
  return (
    <ConnectContext
      value={{
        instructionsId,
        connections,
        ports,
        selectedOutput,
        element,
        portCollection,
        cards,
        selectOutput,
        connect,
        disconnect,
        cancel,
      }}
    >
      <Part
        data-slot="connect"
        {...props}
        ref={composeRefs(ref, setElement)}
        role={props.role ?? "group"}
        style={{ position: "relative", ...props.style }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || selectedOutput === null) return;
          event.preventDefault();
          event.stopPropagation();
          cancel();
        }}
      >
        <>
          <span id={instructionsId} style={visuallyHiddenStyle}>
            Choose an output, then a matching input to connect. Escape cancels. Each input also has
            a source selector. When a card is focused, use Up and Down to visit cards, or Home and
            End for the first and last card.
          </span>
          {children}
          <output aria-live="polite" aria-atomic="true" style={visuallyHiddenStyle}>
            {announcement}
          </output>
        </>
      </Part>
    </ConnectContext>
  );
}

/** Drops connections with an empty endpoint or a second source for the same input. */
function validConnections(connections: readonly ConnectConnection[]) {
  const connectedInputs = new Set<string>();
  const valid: ConnectConnection[] = [];
  for (const connection of connections) {
    if (!connection.from || !connection.to || connectedInputs.has(connection.to)) {
      warnOnce(
        `Connect:connection:${connection.from}:${connection.to}`,
        `Connect requires nonempty endpoints and one source per input; received ${JSON.stringify(connection)}. It was skipped.`,
      );
      continue;
    }
    connectedInputs.add(connection.to);
    valid.push(connection);
  }
  return valid;
}
