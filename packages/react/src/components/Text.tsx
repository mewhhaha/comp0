import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "div" | "small" | "strong" | undefined;
};

export function Text({ as: Element = "p", ref, ...props }: TextProps & RefProp<HTMLElement>) {
  return <Element {...props} ref={ref as never} />;
}
