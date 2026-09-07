import { useState, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  ConnectInputContext,
  useConnectCardContext,
  useConnectContext,
  useConnectPort,
} from "./connect-shared.js";

export type ConnectInputProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  label: string;
  kind: string;
  disabled?: boolean;
};

export function ConnectInput({
  value,
  label,
  kind,
  disabled: disabledProp = false,
  children,
  ref,
  ...props
}: ConnectInputProps & RefProp<HTMLDivElement>) {
  const context = useConnectContext("ConnectInput");
  const card = useConnectCardContext("ConnectInput");
  const disabled = disabledProp || card.disabled;
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useConnectPort(
    { value, label, kind, card: card.value, cardLabel: card.label, direction: "input", disabled },
    element,
  );
  return (
    <ConnectInputContext value={{ value, label, kind, disabled }}>
      <div
        {...props}
        ref={composeRefs(ref, setElement)}
        data-slot={dataSlot(props, "connect-input")}
        data-connected={dataAttr(context.connections.some((connection) => connection.to === value))}
      >
        {children}
      </div>
    </ConnectInputContext>
  );
}
