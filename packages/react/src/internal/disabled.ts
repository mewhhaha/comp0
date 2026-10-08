import { type KeyboardEvent, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";

export type DisabledPropsOptions<TElement extends HTMLElement> = {
  /**
   * True for an element with a native `disabled` attribute (`button`, `input`,
   * `select`, `textarea`). Anything else (links, `div`, Fragment children)
   * gets `aria-disabled` and has activation blocked instead.
   */
  native: boolean;
  /** The consumer's click handler; skipped while a non-native element is disabled. */
  onClick?: ((event: MouseEvent<TElement>) => void) | undefined;
  /** The consumer's keydown handler; skipped for Enter and Space while a non-native element is disabled. */
  onKeyDown?: ((event: KeyboardEvent<TElement>) => void) | undefined;
};

/**
 * Props that make an element disabled the right way for its tag.
 *
 * Native elements get `disabled`, which the browser already enforces. Other
 * elements get `aria-disabled` (still focusable, as ARIA recommends), and a
 * click, Enter or Space is cancelled without reaching the consumer's handlers.
 * Both get `data-disabled`. Spread the result on the part after the consumer's
 * props, and destructure `onClick`/`onKeyDown` out of those props first.
 */
export function disabledProps<TElement extends HTMLElement>(
  disabled: boolean | undefined,
  { native, onClick, onKeyDown }: DisabledPropsOptions<TElement>,
) {
  const blocked = Boolean(disabled) && !native;
  return {
    disabled: native && disabled ? true : undefined,
    "aria-disabled": blocked ? true : undefined,
    "data-disabled": dataAttr(Boolean(disabled)),
    onClick(event: MouseEvent<TElement>) {
      if (blocked) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    },
    onKeyDown(event: KeyboardEvent<TElement>) {
      if (blocked && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        return;
      }
      onKeyDown?.(event);
    },
  };
}
