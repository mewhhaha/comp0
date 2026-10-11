import { type ReactElement } from "react";
import { act } from "react";
import { cleanup, render as renderWithTestingLibrary, within } from "@testing-library/react";
import { PointerEventsCheckLevel, userEvent } from "@testing-library/user-event";

export { userEvent, within };

/**
 * jsdom has no popover API, so its UA rule `[popover]:not(:popover-open)` hides every popover
 * surface, and since jsdom 30.1 `focus()` inside a `display: none` ancestor does nothing. Shows
 * surfaces our components opened (they drop `hidden`) so focus behaves as in a browser. The
 * selector matches the UA rule's specificity, which jsdom needs to let an author rule win.
 */
function showOpenPopovers(ownerDocument: Document) {
  const view = ownerDocument.defaultView;
  if (!view || "showPopover" in view.HTMLElement.prototype) return;
  if (ownerDocument.getElementById("jsdom-popover-shim")) return;
  const style = ownerDocument.createElement("style");
  style.id = "jsdom-popover-shim";
  style.textContent =
    "[popover]:not([hidden]):not(:popover-open):not(dialog[open]) { display: block; }";
  ownerDocument.head.append(style);
}

export function render(element: ReactElement, ownerDocument: Document = document) {
  showOpenPopovers(ownerDocument);
  const container = ownerDocument.createElement("div");
  ownerDocument.body.append(container);
  return renderWithTestingLibrary(element, {
    baseElement: ownerDocument.body,
    container,
  });
}

/**
 * Renders `ui` and returns the render result plus a `user` for realistic
 * interaction: `await user.click(...)`, `user.keyboard("{Escape}")`,
 * `user.tab()`, `user.type(...)`. Prefer it over `fireClick`/`fireKeyDown`,
 * which dispatch a single synthetic event; `user` produces the whole
 * pointer/focus/keyboard sequence a browser would (pointerdown, mousedown,
 * focus, pointerup, click; keydown, keypress, keyup, with default actions like
 * Space/Enter activating buttons), so focus movement and default actions are
 * covered.
 *
 * jsdom has no layout, so pointer-events checks are off (components never
 * hide behind CSS here). Always `await` the user calls.
 */
export function setup(ui: ReactElement, ownerDocument: Document = document) {
  const result = render(ui, ownerDocument);
  const user = userEvent.setup({
    document: ownerDocument,
    pointerEventsCheck: PointerEventsCheckLevel.Never,
  });
  return { ...result, user };
}

export function cleanupRoots() {
  cleanup();
}

/**
 * Dispatches one synthetic, cancelable click. Acceptable only when the test
 * needs exactly that: asserting `defaultPrevented`/`preventDefault` handling,
 * clicking an element userEvent would refuse (`pointer-events: none`, disabled
 * ancestors), or driving a handler without focus side effects. Otherwise use
 * `setup(...).user.click`.
 */
export function fireClick(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

/**
 * Dispatches one synthetic, cancelable keydown with no keypress/keyup and no
 * default action. Acceptable for keys userEvent cannot produce (unusual `key`
 * values, `isComposing`, repeat) and for asserting `preventDefault` on a single
 * event. Otherwise use `user.keyboard`/`user.tab` from `setup`.
 */
export function fireKeyDown(element: Element, key: string, init?: KeyboardEventInit) {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}
