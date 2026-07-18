import { type ButtonHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelCloseProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function FloatingPanelClose({
  onClick,
  ref,
  ...props
}: FloatingPanelCloseProps & RefProp<HTMLButtonElement>) {
  const panel = useFloatingPanelContext("FloatingPanelClose");
  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      aria-label={props["aria-label"] ?? "Close panel"}
      data-slot={dataSlot(props, "floating-panel-close")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) panel.requestClose();
      }}
    />
  );
}
