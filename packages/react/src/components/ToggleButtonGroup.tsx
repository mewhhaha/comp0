import { createElement, type ElementType, type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";

export type ToggleButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType | undefined;
  "data-slot"?: string | undefined;
  orientation?: "horizontal" | "vertical" | undefined;
};

export function ToggleButtonGroup({
  as,
  orientation = "horizontal",
  ref,
  ...props
}: ToggleButtonGroupProps & RefProp<HTMLDivElement>) {
  return createElement(as ?? "div", {
    ...props,
    ref,
    role: props.role ?? "group",
    "aria-orientation": props["aria-orientation"] ?? orientation,
    "data-orientation": orientation,
    "data-slot": props["data-slot"] ?? "toggle-button-group",
  });
}
