import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelCloseProps = ComponentProps<"button"> & AsProp;

export function FloatingPanelClose({ as, onClick, ...props }: FloatingPanelCloseProps) {
  const panel = useFloatingPanelContext("FloatingPanelClose");
  const isNativeButton = as === undefined || as === "button";
  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-label={props["aria-label"] ?? "Close panel"}
      data-slot={dataSlot(props, "floating-panel-close")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) panel.requestClose();
      }}
    />
  );
}
