import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { getExample } from "./registry.js";

type MountedExample = {
  container: HTMLDivElement;
  root: Root;
};

function mount(Example: ComponentType): MountedExample {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => root.render(<Example />));
  return { container, root };
}

function unmount({ container, root }: MountedExample) {
  act(() => root.unmount());
  container.remove();
}

describe("composite docs examples", () => {
  it("moves every checked transfer-list row with the bulk action", () => {
    const Example = getExample("grid-list.transfer-list");
    if (!Example) throw new Error("Missing Transfer List docs example");
    const mounted = mount(Example);

    try {
      const available = mounted.container.querySelector<HTMLElement>(
        'section[aria-labelledby="available-title"]',
      )!;
      const chosen = mounted.container.querySelector<HTMLElement>(
        'section[aria-labelledby="chosen-title"]',
      )!;
      const vueCheckbox = Array.from(available.querySelectorAll<HTMLInputElement>("input")).find(
        (input) => input.parentElement?.textContent?.includes("Vue"),
      )!;
      const addSelected = Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Add selected"),
      )!;

      act(() => vueCheckbox.click());
      act(() => addSelected.click());

      expect(available.textContent).not.toContain("Vue");
      expect(chosen.textContent).toContain("Vue");
    } finally {
      unmount(mounted);
    }
  });

  it("moves tour focus with the active dialog and restores the start control", async () => {
    const Example = getExample("tour");
    if (!Example) throw new Error("Missing Tour docs example");
    const mounted = mount(Example);

    try {
      const start = Array.from(mounted.container.querySelectorAll("button")).find(
        (button) => button.textContent === "Start tour",
      )!;

      act(() => start.click());
      expect(document.querySelector('[role="dialog"][open]')?.textContent).toContain(
        "Find anything",
      );
      expect(document.activeElement?.textContent).toBe("Skip tour");

      const next = Array.from(document.querySelectorAll("button")).find(
        (button) => button.textContent === "Next" && button.closest("dialog[open]"),
      )!;
      act(() => next.click());

      expect(document.querySelector('[role="dialog"][open]')?.textContent).toContain(
        "Review updates",
      );
      expect(document.activeElement?.textContent).toBe("Skip tour");

      const skip = document.activeElement as HTMLButtonElement;
      await act(async () => {
        skip.click();
        await Promise.resolve();
      });
      expect(document.querySelector('[role="dialog"][open]')).toBeNull();
      expect(document.activeElement).toBe(start);
    } finally {
      unmount(mounted);
    }
  });

  it("closes a tour step with Escape and restores its trigger", async () => {
    const Example = getExample("tour");
    if (!Example) throw new Error("Missing Tour docs example");
    const mounted = mount(Example);

    try {
      const start = Array.from(mounted.container.querySelectorAll("button")).find(
        (button) => button.textContent === "Start tour",
      )!;
      act(() => start.click());
      const dialog = document.querySelector<HTMLDialogElement>('[role="dialog"][open]')!;

      await act(async () => {
        dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
        await Promise.resolve();
      });

      expect(dialog.open).toBe(false);
      expect(document.activeElement).toBe(start);
    } finally {
      unmount(mounted);
    }
  });
});
