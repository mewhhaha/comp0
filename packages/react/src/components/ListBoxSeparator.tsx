import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type ListBoxSeparatorProps = HTMLAttributes<HTMLDivElement>;

export function ListBoxSeparator(props: ListBoxSeparatorProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  const role = props.role ?? "presentation";
  return (
    <div
      {...props}
      ref={ref}
      role={role}
      aria-orientation={
        props["aria-orientation"] ?? (role === "separator" ? "horizontal" : undefined)
      }
    />
  );
}
