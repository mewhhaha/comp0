import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ListBoxSeparatorProps = ComponentProps<"div"> & AsProp;

export function ListBoxSeparator({ as, ...props }: ListBoxSeparatorProps) {
  const role = props.role ?? "presentation";
  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      role={role}
      aria-orientation={
        props["aria-orientation"] ?? (role === "separator" ? "horizontal" : undefined)
      }
    />
  );
}
