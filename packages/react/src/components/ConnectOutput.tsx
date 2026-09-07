import { useId, useRef, useState, type ButtonHTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import {
  portLabel,
  useConnectCardContext,
  useConnectContext,
  useConnectPort,
} from "./connect-shared.js";
import { visuallyHiddenStyle } from "./visually-hidden-shared.js";

export type ConnectOutputProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
  label: string;
  kind: string;
};

export function ConnectOutput({
  value,
  label,
  kind,
  disabled: disabledProp = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ref,
  ...props
}: ConnectOutputProps & RefProp<HTMLButtonElement>) {
  const context = useConnectContext("ConnectOutput");
  const descriptionId = useId();
  const card = useConnectCardContext("ConnectOutput");
  const disabled = disabledProp || card.disabled;
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const gesture = useRef<{ pointerId: number; x: number; y: number; dragging: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  useConnectPort(
    { value, label, kind, card: card.value, cardLabel: card.label, direction: "output", disabled },
    element,
  );
  const destinations = context.connections
    .filter((connection) => connection.from === value)
    .map((connection) => {
      const input = context.ports.find(
        (port) => port.direction === "input" && port.value === connection.to,
      );
      return input ? portLabel(input) : connection.to;
    });
  let description = "Not connected.";
  if (destinations.length > 0) description = `Connected to ${destinations.join(", ")}.`;

  return (
    <>
      <button
        {...props}
        ref={composeRefs(ref, setElement)}
        type={props.type ?? "button"}
        value={value}
        disabled={disabled}
        aria-label={props["aria-label"] ?? `${card.label}: ${label} output (${kind})`}
        aria-describedby={[props["aria-describedby"], descriptionId, context.instructionsId]
          .filter(Boolean)
          .join(" ")}
        aria-pressed={context.selectedOutput === value}
        data-slot={dataSlot(props, "connect-output")}
        data-connected={dataAttr(destinations.length > 0)}
        data-selected={dataAttr(context.selectedOutput === value)}
        style={{ touchAction: "none", ...props.style }}
        onClick={(event) => {
          onClick?.(event);
          const suppressed = suppressClick.current && event.detail > 0;
          suppressClick.current = false;
          if (event.defaultPrevented || suppressed) return;
          context.selectOutput(value);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || event.button !== 0 || !event.isPrimary) return;
          suppressClick.current = false;
          gesture.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dragging: false,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          const current = gesture.current;
          if (
            event.defaultPrevented ||
            !current ||
            current.pointerId !== event.pointerId ||
            current.dragging
          )
            return;
          const dragThreshold = event.pointerType === "touch" ? 10 : 4;
          if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < dragThreshold)
            return;
          current.dragging = true;
          if (context.selectedOutput !== value) context.selectOutput(value);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId) return;
          gesture.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          if (event.defaultPrevented || !current.dragging) return;
          suppressClick.current = true;
          if (context.selectedOutput !== value) return;
          const target = event.currentTarget.ownerDocument.elementFromPoint(
            event.clientX,
            event.clientY,
          );
          const input = context.ports.find(
            (port) => port.direction === "input" && target && port.element.contains(target),
          );
          if (input) context.connect(value, input.value);
          else context.cancel();
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId) return;
          gesture.current = null;
          if (current.dragging) context.cancel();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          if (gesture.current?.pointerId !== event.pointerId) return;
          gesture.current = null;
          suppressClick.current = true;
          context.cancel();
        }}
      />
      <span id={descriptionId} style={visuallyHiddenStyle}>
        {description}
      </span>
    </>
  );
}
