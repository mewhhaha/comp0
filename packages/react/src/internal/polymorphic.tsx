import {
  cloneElement,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ComponentPropsWithRef,
  type ElementType,
  type JSX,
  type ReactNode,
} from "react";
import { mergeProps } from "@comp0/core";

/**
 * Lets a part render another element or component in place of its default
 * tag. `as={Fragment}` renders no element of its own and merges the part's
 * props into its single child element instead.
 */
export type AsProp = {
  as?: ElementType | undefined;
};

type IntrinsicTag = keyof JSX.IntrinsicElements;

/** The DOM props a root forwards to its `as` element: the tag's props minus the root's own. */
type RootDomProps<TOwn, TTag extends IntrinsicTag> = Omit<
  ComponentProps<TTag>,
  keyof TOwn | "as" | "children" | "key"
>;

/** Forbids every DOM prop, so a root without `as` cannot silently drop one. */
type WithoutRootDomProps<TOwn, TTag extends IntrinsicTag> = {
  [TKey in keyof RootDomProps<TOwn, TTag>]?: never;
};

/**
 * Props for a provider root: `TOwn` plus, only when `as` names an element to
 * render, that element's DOM props. Without `as` (or with `as={Fragment}`) the
 * root renders its children directly, so DOM props such as `className` are a
 * type error instead of being dropped.
 */
export type RootProps<TOwn, TTag extends IntrinsicTag = "div"> = TOwn &
  (
    | ({ as?: typeof Fragment | undefined } & WithoutRootDomProps<TOwn, TTag>)
    | ({ as: ElementType } & RootDomProps<TOwn, TTag>)
  );

function Passthrough({ children }: { children?: ReactNode }) {
  return children;
}

/**
 * The element a provider root renders: its `as` element, or (without `as` or
 * with `as={Fragment}`) a passthrough that renders only the children.
 *
 * Roots and parts render the returned type as JSX (`<Root {...props} />`)
 * rather than through a helper call, so the React Compiler can see the props
 * and handlers as JSX attributes and keep memoizing the component. The tag
 * type parameter types those attributes as the tag's props, `ref` included;
 * `data-*` and `aria-*` attributes are always accepted.
 */
export function rootElement<TTag extends IntrinsicTag = "div">(
  as: ElementType | undefined,
): (props: ComponentPropsWithRef<TTag>) => ReactNode {
  if (as === undefined || as === Fragment) return Passthrough as never;
  return as as never;
}

/**
 * The element a part renders: its `as` element, or `fallback` when none is
 * given. `as={Fragment}` renders `Slot`, which merges the part's props into
 * its single child element. The returned component is typed with the
 * fallback tag's props, `ref` included.
 */
export function partElement<TTag extends IntrinsicTag>(
  as: ElementType | undefined,
  fallback: TTag,
): (props: ComponentPropsWithRef<TTag>) => ReactNode {
  if (as === Fragment) return Slot as never;
  return (as ?? fallback) as never;
}

type SlotProps = Record<string, unknown> & { children?: ReactNode };

/**
 * Merges a part's props onto its single element child with `mergeProps`:
 * the child's handlers run first, classes concatenate, refs compose, and the
 * part's other defined props win.
 */
function Slot({ children, ...props }: SlotProps) {
  if (!isValidElement<Record<string, unknown>>(children)) {
    throw new Error("A part rendered as={Fragment} needs exactly one element child.");
  }
  const { children: _childChildren, ...childProps } = children.props;
  return cloneElement(children, mergeProps(childProps, props));
}
