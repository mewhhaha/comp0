import { type ComponentProps, type PointerEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

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

export type FloatingPanelHeaderProps = ComponentProps<"div"> & AsProp;

export function FloatingPanelHeader({
  as,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: FloatingPanelHeaderProps) {
  const panel = useFloatingPanelContext("FloatingPanelHeader");
  const Part = partElement(as, "div");
  return (
    <Part
      data-slot="floating-panel-header"
      {...props}
      data-moving={dataAttr(panel.moving)}
      style={{ touchAction: "none", ...props.style }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented && !ownsPointerGesture(event.target)) {
          panel.startPointerMove(event);
        }
      }}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) panel.continuePointerMove(event);
      }}
      onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
        onPointerUp?.(event);
        if (!event.defaultPrevented) panel.finishPointerMove(event);
      }}
      onPointerCancel={(event: PointerEvent<HTMLDivElement>) => {
        onPointerCancel?.(event);
        panel.cancelPointerMove(event);
      }}
    />
  );
}
