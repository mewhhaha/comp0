import { type HTMLAttributes, type Ref } from "react";
import { type RefProp } from "../shared.js";

export type SeparatorProps = HTMLAttributes<HTMLElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export function Separator({
  orientation = "horizontal",
  ref,
  ...props
}: SeparatorProps & RefProp<HTMLElement>) {
  if (orientation === "vertical") {
    // <hr> is horizontal-only, so a vertical separator renders a div with the
    // separator role spelled out. Pass role="presentation" for decoration.
    return (
      <div
        {...props}
        ref={ref as Ref<HTMLDivElement> | undefined}
        role={props.role ?? "separator"}
        aria-orientation={props["aria-orientation"] ?? "vertical"}
        data-orientation="vertical"
      />
    );
  }
  return (
    <hr {...props} ref={ref as Ref<HTMLHRElement> | undefined} data-orientation="horizontal" />
  );
}
