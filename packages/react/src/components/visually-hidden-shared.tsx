import { useState, type CSSProperties, type FocusEvent } from "react";

/**
 * Clip-rect hiding that keeps content readable by assistive technology and,
 * unlike display:none, keeps focusable content reachable by keyboard.
 */
export const visuallyHiddenStyle: CSSProperties = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  width: 1,
  whiteSpace: "nowrap",
};

/**
 * Tracks whether the element or one of its descendants has focus, so
 * focus-revealed primitives (SkipLink, focusable VisuallyHidden) can drop
 * their hiding styles while focused.
 */
export function useFocusWithinReveal<TElement extends HTMLElement>() {
  const [revealed, setRevealed] = useState(false);
  return {
    revealed,
    reveal: () => setRevealed(true),
    conceal: (event: FocusEvent<TElement>) => {
      // Focus moving to a descendant keeps the content revealed.
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      setRevealed(false);
    },
  };
}
