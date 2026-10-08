import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  useConnectCardContext,
  useConnectContext,
  useConnectInputContext,
} from "./connect-shared.js";

export type ConnectDisconnectProps = ComponentProps<"button"> & AsProp;

export function ConnectDisconnect({ as, onClick, disabled, ...props }: ConnectDisconnectProps) {
  const context = useConnectContext("ConnectDisconnect");
  const card = useConnectCardContext("ConnectDisconnect");
  const input = useConnectInputContext("ConnectDisconnect");
  const connected = context.connections.some((connection) => connection.to === input.value);
  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="connect-disconnect"
      {...props}
      type={as === undefined || as === "button" ? (props.type ?? "button") : undefined}
      disabled={disabled || input.disabled || !connected}
      aria-label={props["aria-label"] ?? `Disconnect ${card.label}: ${input.label}`}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        context.disconnect(input.value);
        input.select?.focus();
      }}
    />
  );
}
