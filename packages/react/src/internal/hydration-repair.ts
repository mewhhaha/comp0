import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Writes the attributes this render produced onto the element once, right after it mounts or
 * hydrates, wherever the DOM says otherwise. `null` means the attribute is absent.
 *
 * React does not patch an attribute whose server HTML differs from the hydration render: it
 * logs the mismatch in development and leaves the DOM as the server sent it, and since its own
 * props never change afterwards it never writes the attribute again. State that depends on the
 * whole collection can differ that way, because the server may render items out of document
 * order (it renders past a component that suspends and comes back to it) while the client
 * hydrates them in order. This is the one write to an element a part renders that render cannot
 * do itself; after it the DOM matches what React rendered, and every later change goes through
 * render as usual. On a client-only mount the comparison finds nothing to write.
 */
export function useHydrationRepair(
  ref: RefObject<Element | null>,
  attributes: Record<string, string | null>,
) {
  const repaired = useRef(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (repaired.current || !element) return;
    repaired.current = true;
    for (const [name, value] of Object.entries(attributes)) {
      if (element.getAttribute(name) === value) continue;
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
  });
}
