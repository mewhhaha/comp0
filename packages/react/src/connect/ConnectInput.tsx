import { useState, type ComponentProps } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  ConnectInputContext,
  useConnectCardContext,
  useConnectContext,
  useConnectPort,
} from "./connect-shared.js";

export type ConnectInputProps = ComponentProps<"div"> &
  AsProp & {
    value: string;
    label: string;
    kind: string;
    disabled?: boolean;
  };

export function ConnectInput({
  as,
  value,
  label,
  kind,
  disabled: disabledProp = false,
  children,
  ref,
  ...props
}: ConnectInputProps) {
  const context = useConnectContext("ConnectInput");
  const card = useConnectCardContext("ConnectInput");
  const disabled = disabledProp || card.disabled;
  const [element, setElement] = useState<HTMLElement | null>(null);
  useConnectPort(
    { value, label, kind, card: card.value, cardLabel: card.label, direction: "input", disabled },
    element,
  );
  const Part = partElement(as, "div");
  return (
    <ConnectInputContext value={{ value, label, kind, disabled }}>
      <Part
        {...props}
        ref={composeRefs(ref, setElement)}
        data-slot={dataSlot(props, "connect-input")}
        data-connected={dataAttr(context.connections.some((connection) => connection.to === value))}
      >
        {children}
      </Part>
    </ConnectInputContext>
  );
}
