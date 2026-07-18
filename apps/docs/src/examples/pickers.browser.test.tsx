import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
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

describe("picker docs examples", () => {
  it("uses one labelled native listbox popover for Select", async () => {
    const Example = getExample("select");
    if (!Example) throw new Error("Missing Select docs example");
    const mounted = mount(Example);

    try {
      const label = mounted.container.querySelector("label")!;
      const trigger = page.getByRole("button", { name: "Size" }).element();
      const listbox = mounted.container.querySelector<HTMLElement>('[role="listbox"]')!;
      const medium = listbox.querySelector<HTMLElement>('[data-value="medium"]')!;

      expect(label.htmlFor).toBe(trigger.id);
      expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
      expect(listbox.getAttribute("popover")).toBe("auto");
      expect(listbox.closest('[role="dialog"]')).toBeNull();
      expect(trigger.style.getPropertyValue("anchor-name")).toMatch(/^--comp0-anchor-/);
      expect(listbox.style.getPropertyValue("position-anchor")).toBe(
        trigger.style.getPropertyValue("anchor-name"),
      );
      expect(listbox.style.getPropertyValue("position-area")).toBe("block-end");

      await act(async () => userEvent.click(trigger));
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(listbox.matches(":popover-open")).toBe(true);
      expect(document.activeElement).toBe(medium);

      await act(async () => userEvent.keyboard("{ArrowDown}"));
      expect(medium.getAttribute("aria-selected")).toBe("true");
      await act(async () => userEvent.keyboard("{Enter}"));

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.textContent?.trim()).toBe("Large");
      expect(mounted.container.querySelector<HTMLSelectElement>('select[name="size"]')?.value).toBe(
        "large",
      );
    } finally {
      unmount(mounted);
    }
  });

  it("keeps Combobox focus and visible active state on its labelled input", async () => {
    const Example = getExample("combobox");
    if (!Example) throw new Error("Missing Combobox docs example");
    const mounted = mount(Example);

    try {
      const label = mounted.container.querySelector("label")!;
      const input = page.getByRole("combobox", { name: "City" }).element() as HTMLInputElement;
      const listbox = mounted.container.querySelector<HTMLElement>('[role="listbox"]')!;

      expect(label.htmlFor).toBe(input.id);
      expect(input.getAttribute("aria-controls")).toBe(listbox.id);
      expect(listbox.getAttribute("popover")).toBe("auto");
      expect(listbox.closest('[role="dialog"]')).toBeNull();
      expect(input.style.getPropertyValue("anchor-name")).toMatch(/^--comp0-anchor-/);
      expect(listbox.style.getPropertyValue("position-anchor")).toBe(
        input.style.getPropertyValue("anchor-name"),
      );
      expect(listbox.style.getPropertyValue("position-area")).toBe("block-end");

      await act(async () => userEvent.click(input));
      await act(async () => userEvent.fill(input, "to"));
      await act(async () => userEvent.keyboard("{ArrowDown}"));
      const activeId = input.getAttribute("aria-activedescendant");
      const activeOption = document.getElementById(activeId ?? "");

      expect(document.activeElement).toBe(input);
      expect(activeOption?.textContent).toBe("Tokyo");
      expect(activeOption?.hasAttribute("data-active")).toBe(true);
      await act(async () => userEvent.keyboard("{Enter}"));

      expect(input.value).toBe("Tokyo");
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    } finally {
      unmount(mounted);
    }
  });
});
