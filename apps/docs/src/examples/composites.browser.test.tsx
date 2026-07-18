import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page } from "vitest/browser";
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
  it("moves every checked transfer-list row with the bulk action", async () => {
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
      const vueLabel = page.getByText("Vue");
      const addSelected = page.getByRole("button", { name: /Add selected/ });

      await act(async () => vueLabel.click());
      await act(async () => addSelected.click());

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
      const start = page.getByRole("button", { name: "Start tour" });
      const startElement = start.element();

      await act(async () => start.click());
      expect(page.getByRole("dialog").element().textContent).toContain("Find anything");
      expect(document.activeElement?.textContent).toBe("Skip tour");

      await act(async () => page.getByRole("button", { name: "Next" }).click());

      expect(page.getByRole("dialog").element().textContent).toContain("Review updates");
      expect(document.activeElement?.textContent).toBe("Next");

      await act(async () => page.getByRole("button", { name: "Skip tour" }).click());
      expect(document.querySelector('[role="dialog"][open]')).toBeNull();
      expect(document.activeElement).toBe(startElement);
    } finally {
      unmount(mounted);
    }
  });

  it("closes a tour step with Escape and restores its trigger", async () => {
    const Example = getExample("tour");
    if (!Example) throw new Error("Missing Tour docs example");
    const mounted = mount(Example);

    try {
      const start = page.getByRole("button", { name: "Start tour" });
      const startElement = start.element();
      await act(async () => start.click());
      const dialog = page.getByRole("dialog").element() as HTMLDialogElement;

      await act(async () => {
        dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
        await Promise.resolve();
      });

      expect(dialog.open).toBe(false);
      expect(document.activeElement).toBe(startElement);
    } finally {
      unmount(mounted);
    }
  });
});
