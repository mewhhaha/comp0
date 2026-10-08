export const FOCUSABLE_SELECTOR =
  "a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]";

/** The focusable, enabled elements inside `element`, excluding the element itself. */
export function focusableWithin(element: HTMLElement) {
  return [...element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (candidate) => candidate !== element && !candidate.matches(":disabled"),
  );
}
