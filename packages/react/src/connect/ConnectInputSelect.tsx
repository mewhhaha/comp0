import { type ComponentProps } from "react";
import { dataSlot } from "../internal/shared.js";
import {
  compatiblePorts,
  portLabel,
  useConnectCardContext,
  useConnectContext,
  useConnectInputContext,
} from "./connect-shared.js";

export type ConnectInputSelectProps = Omit<
  ComponentProps<"select">,
  "value" | "defaultValue" | "children" | "multiple"
>;

export function ConnectInputSelect({ onChange, disabled, ...props }: ConnectInputSelectProps) {
  const context = useConnectContext("ConnectInputSelect");
  const card = useConnectCardContext("ConnectInputSelect");
  const input = useConnectInputContext("ConnectInputSelect");
  const registeredInput = context.ports.find(
    (port) => port.direction === "input" && port.value === input.value,
  );
  const outputs = context.ports.filter(
    (port) => registeredInput && compatiblePorts(port, registeredInput),
  );
  const connection = context.connections.find((entry) => entry.to === input.value);
  return (
    <select
      {...props}
      disabled={disabled || input.disabled}
      aria-label={props["aria-label"] ?? `${card.label}: ${input.label} source (${input.kind})`}
      data-slot={dataSlot(props, "connect-input-select")}
      value={connection?.from ?? ""}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        if (event.currentTarget.value === "") context.disconnect(input.value);
        else context.connect(event.currentTarget.value, input.value);
      }}
    >
      <option value="">Not connected</option>
      {connection && !outputs.some((output) => output.value === connection.from) && (
        <option value={connection.from} disabled>
          {connection.from} (unavailable)
        </option>
      )}
      {outputs.map((output) => (
        <option key={output.value} value={output.value}>
          {portLabel(output)}
        </option>
      ))}
    </select>
  );
}
