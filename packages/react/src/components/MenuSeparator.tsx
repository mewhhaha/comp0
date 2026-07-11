import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;

export function MenuSeparator(props: MenuSeparatorProps & RefProp<HTMLDivElement>) {
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
