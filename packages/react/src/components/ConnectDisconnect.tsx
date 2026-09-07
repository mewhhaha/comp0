import { type ButtonHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import {
  useConnectCardContext,
  useConnectContext,
  useConnectInputContext,
} from "./connect-shared.js";

export type ConnectDisconnectProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function ConnectDisconnect({
  onClick,
  disabled,
  ref,
  ...props
}: ConnectDisconnectProps & RefProp<HTMLButtonElement>) {
  const context = useConnectContext("ConnectDisconnect");
  const card = useConnectCardContext("ConnectDisconnect");
  const input = useConnectInputContext("ConnectDisconnect");
  const connected = context.connections.some((connection) => connection.to === input.value);
  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled || input.disabled || !connected}
      aria-label={props["aria-label"] ?? `Disconnect ${card.label}: ${input.label}`}
      data-slot={dataSlot(props, "connect-disconnect")}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        context.disconnect(input.value);
        const port = context.ports.find(
          (entry) => entry.direction === "input" && entry.value === input.value,
        );
        port?.element.querySelector("select")?.focus();
      }}
    />
  );
}
