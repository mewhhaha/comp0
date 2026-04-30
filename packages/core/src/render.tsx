import {
  cloneElement,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { composeRefs, mergeProps } from "./utils.js";

export type RenderProp<TState> = ReactNode | ((state: TState) => ReactNode);

export function renderProp<TState>(children: RenderProp<TState> | undefined, state: TState) {
  return typeof children === "function"
    ? (children as (state: TState) => ReactNode)(state)
    : children;
}

export type PolymorphicProps<TElement extends ElementType, TOwnProps> = TOwnProps &
  Omit<ComponentPropsWithoutRef<TElement>, keyof TOwnProps | "as"> & {
    as?: TElement;
  };

type SlotProps = {
  children?: ReactElement | undefined;
  ref?: Ref<HTMLElement> | undefined;
};

export function Slot({
  children,
  ref: forwardedRef,
  ...slotProps
}: SlotProps & Record<string, unknown>) {
  if (!isValidElement(children)) {
    return null;
  }

  const child = children as ReactElement<Record<string, unknown> & { ref?: Ref<HTMLElement> }>;
  const ref = composeRefs(child.props.ref, forwardedRef);
  const props = mergeProps(child.props, slotProps, { ref });

  return cloneElement(child, props);
}
