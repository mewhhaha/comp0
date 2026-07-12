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

function press(element: HTMLElement, key: string) {
  act(() => {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }));
  });
}

function type(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function unmount({ container, root }: MountedExample) {
  act(() => root.unmount());
  container.remove();
}

describe("picker docs examples", () => {
  it("uses one labelled native listbox popover for Select", () => {
    const Example = getExample("select");
    if (!Example) throw new Error("Missing Select docs example");
    const mounted = mount(Example);

    try {
      const label = mounted.container.querySelector("label")!;
      const trigger = mounted.container.querySelector<HTMLButtonElement>(
        'button[aria-haspopup="listbox"]',
      )!;
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

      act(() => trigger.click());
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(listbox.matches(":popover-open")).toBe(true);
      expect(document.activeElement).toBe(medium);

      press(medium, "ArrowDown");
      expect(medium.getAttribute("aria-selected")).toBe("true");
      press(document.activeElement as HTMLElement, "Enter");

      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.textContent?.trim()).toBe("Large");
      expect(mounted.container.querySelector<HTMLSelectElement>('select[name="size"]')?.value).toBe(
        "large",
      );
    } finally {
      unmount(mounted);
    }
  });

  it("keeps Combobox focus and visible active state on its labelled input", () => {
    const Example = getExample("combobox");
    if (!Example) throw new Error("Missing Combobox docs example");
    const mounted = mount(Example);

    try {
      const label = mounted.container.querySelector("label")!;
      const input = mounted.container.querySelector<HTMLInputElement>('input[role="combobox"]')!;
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

      input.focus();
      type(input, "to");
      press(input, "ArrowDown");
      const activeId = input.getAttribute("aria-activedescendant");
      const activeOption = document.getElementById(activeId ?? "");

      expect(document.activeElement).toBe(input);
      expect(activeOption?.textContent).toBe("Tokyo");
      expect(activeOption?.hasAttribute("data-active")).toBe(true);
      press(input, "Enter");

      expect(input.value).toBe("Tokyo");
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    } finally {
      unmount(mounted);
    }
  });
});
