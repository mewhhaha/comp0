import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type SeparatorProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export function Separator({
  orientation = "horizontal",
  ref,
  ...props
}: SeparatorProps & RefProp<HTMLHRElement>) {
  return (
    <hr
      {...props}
      ref={ref}
      aria-orientation={orientation}
      data-orientation={orientation}
      role="separator"
    />
  );
}
