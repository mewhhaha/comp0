import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

describe("menu composition", () => {
  it("is wrapper-free by default and connects its explicit trigger and content", () => {
    const { container } = render(
      <Menu id="actions">
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuItem>Copy</MenuItem>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='menu']")!;

    expect(container.querySelectorAll("div")).toHaveLength(2);
    expect(trigger.id).toBe("actions-trigger");
    expect(trigger.getAttribute("aria-controls")).toBe("actions-content");
    expect(content.id).toBe("actions-content");
    expect(content.hidden).toBe(true);
  });

  it("opens, moves focus, typeaheads, and restores trigger focus on escape", () => {
    const changed = vi.fn();
    const { container } = render(
      <Menu id="actions" onToggle={changed}>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuItem>Copy</MenuItem>
          <MenuItem disabled>Cut</MenuItem>
          <MenuItem>Paste</MenuItem>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireClick(trigger);
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(content.hidden).toBe(false);
    expect(document.activeElement).toBe(items[0]);
    fireKeyDown(content, "ArrowDown");
    expect(document.activeElement).toBe(items[2]);
    fireKeyDown(content, "End");
    expect(document.activeElement).toBe(items[2]);
    fireKeyDown(content, "c");
    expect(document.activeElement).toBe(items[0]);
    fireKeyDown(content, "Escape");
    expect(content.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes after an item activation unless the item callback prevents it", () => {
    const prevented = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { container } = render(
      <Menu defaultOpen>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuItem onClick={prevented}>Keep open</MenuItem>
          <MenuItem>Close</MenuItem>
        </MenuPopover>
      </Menu>,
    );
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireClick(items[0]!);
    expect(content.hidden).toBe(false);
    fireClick(items[1]!);
    expect(content.hidden).toBe(true);
  });

  it("opens from the trigger with ArrowDown and focuses the first item", () => {
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuItem>Copy</MenuItem>
          <MenuItem>Paste</MenuItem>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='menu']")!;

    fireKeyDown(trigger, "ArrowDown");
    expect(content.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Copy");
  });

  it("closes when focus moves outside the menu and its trigger", () => {
    const { container } = render(
      <>
        <Menu defaultOpen>
          <MenuTrigger>Actions</MenuTrigger>
          <MenuPopover>
            <MenuItem>Copy</MenuItem>
          </MenuPopover>
        </Menu>
        <button type="button">After</button>
      </>,
    );
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const item = container.querySelector<HTMLElement>("[role='menuitem']")!;
    const after = container.querySelectorAll<HTMLButtonElement>("button")[1]!;

    act(() => {
      item.focus();
      item.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: after }));
    });
    expect(content.hidden).toBe(true);
  });
});
