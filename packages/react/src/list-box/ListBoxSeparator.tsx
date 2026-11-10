import { type ComponentProps } from "react";
import { useIsCollectionPass } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type ListBoxSeparatorProps = ComponentProps<"div"> & AsProp;

export function ListBoxSeparator({ as, ...props }: ListBoxSeparatorProps) {
  const collecting = useIsCollectionPass();
  const role = props.role ?? "presentation";
  if (collecting) return null;
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
