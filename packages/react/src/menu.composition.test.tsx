import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuList } from "./components/MenuList.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

describe("menu composition", () => {
  it("requires items to be rendered inside MenuList", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<MenuItem>Copy</MenuItem>)).toThrow(
        "MenuItem must be rendered inside MenuList.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("is wrapper-free by default and connects its explicit trigger and content", () => {
    const { container } = render(
      <Menu id="actions">
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Copy</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;

    expect(container.querySelectorAll("div")).toHaveLength(3);
    expect(trigger.id).toBe("actions-trigger");
    expect(trigger.getAttribute("aria-controls")).toBe("actions-content");
    expect(content.id).toBe("actions-content");
    expect(surface.hidden).toBe(true);
  });

  it("opens, moves focus, typeaheads, and restores trigger focus on escape", () => {
    const changed = vi.fn();
    const { container } = render(
      <Menu id="actions" onToggle={changed}>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Copy</MenuItem>
            <MenuItem disabled>Cut</MenuItem>
            <MenuItem>Paste</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireClick(trigger);
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(surface.hidden).toBe(false);
    expect(document.activeElement).toBe(items[0]);
    fireKeyDown(content, "ArrowDown");
    expect(document.activeElement).toBe(items[2]);
    fireKeyDown(content, "End");
    expect(document.activeElement).toBe(items[2]);
    fireKeyDown(content, "c");
    expect(document.activeElement).toBe(items[0]);
    fireKeyDown(content, "Escape");
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("navigates menu items in the menu's owning document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    const frameDocument = frame.contentDocument!;
    const { container, unmount } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Copy</MenuItem>
            <MenuItem>Paste</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
      frameDocument,
    );
    const trigger = container.querySelector("button")!;
    const menu = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    act(() =>
      trigger.dispatchEvent(
        new frameWindow.MouseEvent("click", { bubbles: true, cancelable: true }),
      ),
    );
    act(() =>
      menu.dispatchEvent(
        new frameWindow.KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );

    expect(frameDocument.activeElement).toBe(items[1]);
    unmount();
    frame.remove();
  });

  it("closes after an item activation unless the item callback prevents it", () => {
    const prevented = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { container } = render(
      <Menu defaultOpen>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={prevented}>Keep open</MenuItem>
            <MenuItem>Close</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireClick(items[0]!);
    expect(surface.hidden).toBe(false);
    fireClick(items[1]!);
    expect(surface.hidden).toBe(true);
  });

  it("opens from the trigger with ArrowDown and focuses the first item", () => {
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Copy</MenuItem>
            <MenuItem>Paste</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;

    fireKeyDown(trigger, "ArrowDown");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Copy");
  });

  it("opens from the trigger with ArrowUp and focuses the last enabled item", () => {
    const { container } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Copy</MenuItem>
            <MenuItem>Paste</MenuItem>
            <MenuItem disabled>Delete</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;

    fireKeyDown(trigger, "ArrowUp");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Paste");
  });

  it("closes when focus moves outside the menu and its trigger", () => {
    const { container } = render(
      <>
        <Menu defaultOpen>
          <MenuTrigger>Actions</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Copy</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <button type="button">After</button>
      </>,
    );
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const item = container.querySelector<HTMLElement>("[role='menuitem']")!;
    const after = container.querySelectorAll<HTMLButtonElement>("button")[1]!;

    act(() => {
      item.focus();
      item.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: after }));
    });
    expect(surface.hidden).toBe(true);
  });
});
