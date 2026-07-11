import {
  createElement,
  Fragment,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { type RefProp } from "../shared.js";

export type ProviderRootProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: ElementType | typeof Fragment | undefined;
  children?: ReactNode | undefined;
};

/** Renders provider-root children directly unless a DOM wrapper is requested. */
export function ProviderRoot({
  as,
  children,
  ref,
  ...props
}: ProviderRootProps & RefProp<HTMLElement>) {
  if (!as || as === Fragment) return children;
  return createElement(as, { ...props, ref }, children);
}
