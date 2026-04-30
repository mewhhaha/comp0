import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
};

export function Heading({ level = 2, ref, ...props }: HeadingProps & RefProp<HTMLHeadingElement>) {
  const Element = `h${level}` as "h1";
  return <Element {...props} ref={ref} />;
}
