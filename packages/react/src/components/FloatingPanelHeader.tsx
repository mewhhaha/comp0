import { type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelHeaderProps = HTMLAttributes<HTMLDivElement>;

function ownsPointerGesture(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button, a, input, select, textarea, [contenteditable], [data-floating-panel-no-drag]",
      ),
    )
  );
}

export function FloatingPanelHeader({
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  ...props
}: FloatingPanelHeaderProps & RefProp<HTMLDivElement>) {
  const panel = useFloatingPanelContext("FloatingPanelHeader");
  return (
    <div
      {...props}
      ref={ref}
      data-moving={dataAttr(panel.moving)}
      data-slot={dataSlot(props, "floating-panel-header")}
      style={{ touchAction: "none", ...props.style }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !ownsPointerGesture(event.target)) {
          panel.startPointerMove(event);
        }
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) panel.continuePointerMove(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (!event.defaultPrevented) panel.finishPointerMove(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        panel.cancelPointerMove(event);
      }}
    />
  );
}
