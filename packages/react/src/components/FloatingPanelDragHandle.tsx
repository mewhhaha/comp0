import { useRef, type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useFloatingPanelContext, type FloatingPanelPosition } from "./floating-panel-shared.js";

const MOVE_STEP = 16;

export type FloatingPanelDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function FloatingPanelDragHandle({
  disabled,
  onBlur,
  onClick,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ref,
  ...props
}: FloatingPanelDragHandleProps & RefProp<HTMLButtonElement>) {
  const panel = useFloatingPanelContext("FloatingPanelDragHandle");
  const keyboardPosition = useRef<FloatingPanelPosition | null>(null);

  const beginKeyboardMove = () => {
    const position = panel.getPosition();
    if (!position) return;
    keyboardPosition.current = position;
    panel.setMoving(true);
    panel.announce(
      "Moving panel. Use the arrow keys to make changes, Enter or Space to finish, Escape to cancel.",
    );
  };
  const commitKeyboardMove = () => {
    const position = panel.getPosition();
    keyboardPosition.current = null;
    panel.setMoving(false);
    if (position) {
      panel.announce(
        `Panel moved to ${Math.round(position.x)} pixels from the left and ${Math.round(position.y)} pixels from the top.`,
      );
    }
  };
  const cancelKeyboardMove = () => {
    const position = keyboardPosition.current;
    if (!position) return;
    keyboardPosition.current = null;
    panel.setPosition(position);
    panel.setMoving(false);
    panel.announce("Panel movement cancelled.");
  };

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      disabled={disabled}
      aria-label={props["aria-label"] ?? "Move panel"}
      aria-keyshortcuts={
        props["aria-keyshortcuts"] ?? "Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
      }
      data-moving={dataAttr(panel.moving)}
      data-slot={dataSlot(props, "floating-panel-drag-handle")}
      style={{ touchAction: "none", ...props.style }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented && keyboardPosition.current) cancelKeyboardMove();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled || event.detail !== 0) return;
        if (keyboardPosition.current) commitKeyboardMove();
        else beginKeyboardMove();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (keyboardPosition.current) commitKeyboardMove();
          else beginKeyboardMove();
          return;
        }
        if (event.key === "Escape" && keyboardPosition.current) {
          event.preventDefault();
          cancelKeyboardMove();
          return;
        }
        if (!keyboardPosition.current) return;
        if (event.key === "ArrowLeft") panel.moveBy(-MOVE_STEP, 0);
        else if (event.key === "ArrowRight") panel.moveBy(MOVE_STEP, 0);
        else if (event.key === "ArrowUp") panel.moveBy(0, -MOVE_STEP);
        else if (event.key === "ArrowDown") panel.moveBy(0, MOVE_STEP);
        else return;
        event.preventDefault();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled) return;
        const startingPosition = keyboardPosition.current;
        if (startingPosition) {
          keyboardPosition.current = null;
          panel.setPosition(startingPosition);
          panel.setMoving(false);
        }
        panel.startPointerMove(event, startingPosition ?? undefined);
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
