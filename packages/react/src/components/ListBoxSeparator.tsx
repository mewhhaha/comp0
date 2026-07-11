import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type ListBoxSeparatorProps = HTMLAttributes<HTMLDivElement>;

export function ListBoxSeparator(props: ListBoxSeparatorProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return (
    <div
      {...props}
      ref={ref}
      role={props.role ?? "separator"}
      aria-orientation={props["aria-orientation"] ?? "horizontal"}
    />
  );
}
