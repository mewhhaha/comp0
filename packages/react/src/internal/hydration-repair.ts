import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Writes the attributes this render produced onto the element once, right after it mounts or
 * hydrates, wherever the DOM says otherwise. A string is the value the part rendered; `null`
 * means the part rendered a presence attribute as absent, and removes it only while it is
 * present with the empty value the part itself writes; `undefined` means the part rendered
 * nothing for it, so it is left alone (with `as={Fragment}` the child's own value is then what
 * React rendered).
 *
 * React does not patch an attribute whose server HTML differs from the hydration render: it
 * logs the mismatch in development and leaves the DOM as the server sent it, and since its own
 * props never change afterwards it never writes the attribute again. State that depends on the
 * whole collection can differ that way, because the server may render items out of document
 * order (it renders past a component that suspends and comes back to it) while the client
 * hydrates them in order. This is the one write to an element a part renders that render cannot
 * do itself; every later change goes through render as usual. On a client-only mount the DOM
 * already holds what was rendered, so nothing is written.
 *
 * Known limit: while a Suspense boundary among the items is still dehydrated, an item outside
 * it is repaired to the stop the client sees so far, and the server's stop inside the boundary
 * stays in its HTML, so there are two until the boundary hydrates.
 */
export function useHydrationRepair(
  ref: RefObject<Element | null>,
  attributes: Record<string, string | null | undefined>,
) {
  const repaired = useRef(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (repaired.current || !element) return;
    repaired.current = true;
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined) continue;
      const current = element.getAttribute(name);
      if (current === value) continue;
      if (value !== null) element.setAttribute(name, value);
      else if (current === "") element.removeAttribute(name);
    }
  });
}
