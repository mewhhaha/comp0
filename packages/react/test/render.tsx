import { type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

const roots = new Set<Root>();

export function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.add(root);

  act(() => {
    root.render(element);
  });

  return {
    container,
    rerender(next: ReactElement) {
      act(() => {
        root.render(next);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      roots.delete(root);
      container.remove();
    },
  };
}

export function cleanupRoots() {
  for (const root of roots) {
    act(() => {
      root.unmount();
    });
  }
  roots.clear();
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
