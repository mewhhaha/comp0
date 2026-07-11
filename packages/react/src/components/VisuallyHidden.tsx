import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type VisuallyHiddenProps = HTMLAttributes<HTMLDivElement>;

export function VisuallyHidden(props: VisuallyHiddenProps & RefProp<HTMLDivElement>) {
  const { ref } = props;
  return (
    <div
      {...props}
      ref={ref}
      data-slot="visually-hidden"
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: 1,
        whiteSpace: "nowrap",
        ...props.style,
      }}
    />
  );
}
