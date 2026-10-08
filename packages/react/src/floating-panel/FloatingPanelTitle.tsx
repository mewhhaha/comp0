import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useFloatingPanelContext } from "./floating-panel-shared.js";

export type FloatingPanelTitleProps = ComponentProps<"h2"> & AsProp;

export function FloatingPanelTitle({ as, ...props }: FloatingPanelTitleProps) {
  const panel = useFloatingPanelContext("FloatingPanelTitle");
  const Part = partElement(as, "h2");
  return <Part data-slot="floating-panel-title" {...props} id={props.id ?? panel.titleId} />;
}
