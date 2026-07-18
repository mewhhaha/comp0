import { type ReactElement } from "react";
import { act } from "react";
import { cleanup, render as renderWithTestingLibrary, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

export { userEvent, within };

export function render(element: ReactElement, ownerDocument: Document = document) {
  const container = ownerDocument.createElement("div");
  ownerDocument.body.append(container);
  return renderWithTestingLibrary(element, {
    baseElement: ownerDocument.body,
    container,
  });
}

export function cleanupRoots() {
  cleanup();
}

export function fireClick(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

export function fireKeyDown(element: Element, key: string, init?: KeyboardEventInit) {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}
