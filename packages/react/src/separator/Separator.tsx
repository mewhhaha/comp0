import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";

export type SeparatorProps = ComponentProps<"hr"> &
  AsProp & {
    orientation?: "horizontal" | "vertical" | undefined;
  };

export function Separator({ as, orientation = "horizontal", ...props }: SeparatorProps) {
  if (orientation === "vertical") {
    // <hr> is horizontal-only, so a vertical separator renders a div with the
    // separator role spelled out. Pass role="presentation" for decoration.
    const Part = partElement(as, "div");
    return (
      <Part
        {...props}
        role={props.role ?? "separator"}
        aria-orientation={props["aria-orientation"] ?? "vertical"}
        data-orientation="vertical"
      />
    );
  }
  const Part2 = partElement(as, "hr");
  return <Part2 {...props} data-orientation="horizontal" />;
}
