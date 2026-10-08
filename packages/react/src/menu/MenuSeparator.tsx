import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type MenuSeparatorProps = ComponentProps<"div"> & AsProp;

export function MenuSeparator({ as, ...props }: MenuSeparatorProps) {
  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      role={props.role ?? "separator"}
      aria-orientation={props["aria-orientation"] ?? "horizontal"}
    />
  );
}
