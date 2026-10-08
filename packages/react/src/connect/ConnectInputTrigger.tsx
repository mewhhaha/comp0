import { useId, type ComponentProps, type MouseEvent } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  compatiblePorts,
  portLabel,
  useConnectCardContext,
  useConnectContext,
  useConnectInputContext,
} from "./connect-shared.js";
import { visuallyHiddenStyle } from "../visually-hidden/visually-hidden-shared.js";

export type ConnectInputTriggerProps = ComponentProps<"button"> & AsProp;

export function ConnectInputTrigger({
  as,
  onClick,
  disabled,
  ref,
  ...props
}: ConnectInputTriggerProps) {
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

  const Part = partElement(as, "button");
  return (
    <>
      <Part
        data-slot="connect-input-trigger"
        {...props}
        ref={composeRefs(ref, input.setTrigger)}
        type={as === undefined || as === "button" ? (props.type ?? "button") : undefined}
        disabled={disabled || input.disabled}
        aria-label={props["aria-label"] ?? `${card.label}: ${input.label} input (${input.kind})`}
        aria-describedby={[props["aria-describedby"], descriptionId].filter(Boolean).join(" ")}
        aria-disabled={!available || undefined}
        data-connected={dataAttr(Boolean(connection))}
        data-available={dataAttr(available)}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
