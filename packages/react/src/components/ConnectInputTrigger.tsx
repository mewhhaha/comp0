import { useId, type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  compatiblePorts,
  portLabel,
  useConnectCardContext,
  useConnectContext,
  useConnectInputContext,
} from "./connect-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type ConnectInputTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ConnectInputTrigger({
  onClick,
  disabled,
  ref,
  ...props
}: ConnectInputTriggerProps & RefProp<HTMLButtonElement>) {
  const context = useConnectContext("ConnectInputTrigger");
  const descriptionId = useId();
  const card = useConnectCardContext("ConnectInputTrigger");
  const input = useConnectInputContext("ConnectInputTrigger");
  const connection = context.connections.find((entry) => entry.to === input.value);
  const source = context.ports.find(
    (port) => port.direction === "output" && port.value === connection?.from,
  );
  const selected = context.ports.find(
    (port) => port.direction === "output" && port.value === context.selectedOutput,
  );
  const registeredInput = context.ports.find(
    (port) => port.direction === "input" && port.value === input.value,
  );
  const available = Boolean(
    selected && registeredInput && compatiblePorts(selected, registeredInput),
  );
  let description = "Not connected. Choose an output first, or use the source selector.";
  if (connection) description = `Connected from ${source ? portLabel(source) : connection.from}.`;

  return (
    <>
      <button
        {...props}
        ref={ref}
        type={props.type ?? "button"}
        disabled={disabled || input.disabled}
        aria-label={props["aria-label"] ?? `${card.label}: ${input.label} input (${input.kind})`}
        aria-describedby={[props["aria-describedby"], descriptionId].filter(Boolean).join(" ")}
        data-connect-input-trigger=""
        aria-disabled={!available || undefined}
        data-slot={dataSlot(props, "connect-input-trigger")}
        data-connected={dataAttr(Boolean(connection))}
        data-available={dataAttr(available)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || !available || context.selectedOutput === null) return;
          context.connect(context.selectedOutput, input.value);
        }}
      />
      <span id={descriptionId} style={visuallyHiddenStyle}>
        {description}
      </span>
    </>
  );
}
