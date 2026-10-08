import { type ComponentProps, type ElementType, type KeyboardEvent, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { disabledProps } from "./disabled.js";

export type DisclosureTriggerOptions = {
  /** The part's `as` prop. Only the default tag (or `"button"`) gets a native `type`. */
  as: ElementType | undefined;
  /** Whether the controlled surface is open. */
  open: boolean;
  /** Called on click with the next open state unless the consumer prevented default. */
  onOpenChange: (next: boolean) => void;
  /** Id used when the consumer passes none. */
  id?: string | undefined;
  /** Id of the controlled surface; the consumer's `aria-controls` wins. */
  controls?: string | undefined;
  /** What the trigger opens; the consumer's `aria-haspopup` wins. Omit for a plain disclosure. */
  haspopup?: "dialog" | "listbox" | "menu" | "tree" | "grid" | true | undefined;
  /** The consumer's props the hook reads (and, for `onClick`, wraps). */
  props: Pick<
    ComponentProps<"button">,
    "aria-controls" | "aria-haspopup" | "disabled" | "id" | "onClick" | "onKeyDown" | "type"
  >;
};

/**
 * The trigger attributes every disclosure-style button shares: `id`, `type`,
 * `aria-expanded`, `aria-controls`, `aria-haspopup`, `data-open`, `disabled`
 * or `aria-disabled`, and an `onClick` that runs the consumer's handler first,
 * then calls `onOpenChange(!open)` unless it prevented default or the trigger is
 * disabled.
 *
 * Spread the result on the part after `{...props}`: it wraps the consumer's
 * `onClick` and `onKeyDown` from `props`, so they need not be destructured.
 * Keep `ref` and any extra handlers as JSX attributes.
 */
export function useDisclosureTrigger({
  as,
  controls,
  haspopup,
  id,
  onOpenChange,
  open,
  props,
}: DisclosureTriggerOptions) {
  const isNativeButton = as === undefined || as === "button";
  const disabled = props.disabled;
  const disabledAttributes = disabledProps<HTMLElement>(disabled, {
    native: isNativeButton,
    onKeyDown: props.onKeyDown as ((event: KeyboardEvent<HTMLElement>) => void) | undefined,
    onClick(event: MouseEvent<HTMLElement>) {
      props.onClick?.(event as MouseEvent<HTMLButtonElement>);
      if (!event.defaultPrevented) onOpenChange(!open);
    },
  });
  return {
    id: props.id ?? id,
    type: isNativeButton ? (props.type ?? "button") : undefined,
    "aria-controls": props["aria-controls"] ?? controls,
    "aria-expanded": open,
    "aria-haspopup": props["aria-haspopup"] ?? haspopup,
    "data-open": dataAttr(open),
    ...disabledAttributes,
  };
}
