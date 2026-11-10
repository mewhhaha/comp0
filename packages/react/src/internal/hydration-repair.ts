import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Brings the element in line with this render once, right after it mounts or hydrates.
 *
 * `attributes` are the collection-dependent attributes as they reach the DOM: a string is
 * written and `null` removes the attribute wherever the DOM says otherwise, and `undefined`
 * leaves it alone (the part rendered nothing for it). With `as={Fragment}` the caller passes
 * the child's own value where the part's prop is absent, since that is what React rendered.
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
 * `onFocused` runs when the element already holds focus at that moment: the user focused it in
 * server HTML, before any handler existed, so the owner has no record of it and the stop would
 * otherwise sit on another item.
 *
 * Known limit: while a Suspense boundary among the items is still dehydrated, an item outside
 * it is repaired to the stop the client sees so far, and the server's stop inside the boundary
 * stays in its HTML, so there are two until the boundary hydrates.
 */
export function useHydrationRepair(
  ref: RefObject<Element | null>,
  attributes: Record<string, string | null | undefined>,
  onFocused: () => void,
) {
  const repaired = useRef(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (repaired.current || !element) return;
    repaired.current = true;
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || element.getAttribute(name) === value) continue;
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
    if (element.ownerDocument.activeElement === element) onFocused();
  });
}
