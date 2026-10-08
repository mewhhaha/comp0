import { act } from "react";
import { type setup } from "./render.js";

/**
 * Focuses `element` (when it is not already the active element) and types
 * `keys` (a userEvent keyboard string such as "{ArrowDown}") into it.
 */
export async function pressKey(
  user: ReturnType<typeof setup>["user"],
  element: Element,
  keys: string,
) {
  if (element instanceof HTMLElement && document.activeElement !== element) {
    act(() => element.focus());
  }
  await user.keyboard(keys);
}
