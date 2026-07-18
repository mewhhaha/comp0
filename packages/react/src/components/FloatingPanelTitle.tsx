import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function FloatingPanelTitle({
  children,
  ref,
  ...props
}: FloatingPanelTitleProps & RefProp<HTMLHeadingElement>) {
  const panel = useFloatingPanelContext("FloatingPanelTitle");
  return (
    <h2
      {...props}
      ref={ref}
      id={props.id ?? panel.titleId}
      data-slot={dataSlot(props, "floating-panel-title")}
    >
      {children}
    </h2>
  );
}
