import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Menu } from "./Menu.js";
import { MenuList } from "./MenuList.js";
import { MenuPopover } from "./MenuPopover.js";
import { MenuItem } from "./MenuItem.js";
import { MenuTrigger } from "./MenuTrigger.js";

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

  it("opens, moves focus, typeaheads, and restores trigger focus on escape", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <Menu id="actions" onOpenChange={changed}>
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
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    await user.click(trigger);
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(surface.hidden).toBe(false);
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(items[2]);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(items[2]);
    await user.keyboard("c");
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard("{Escape}");
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("navigates menu items in the menu's owning document", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const { container, unmount, user } = setup(
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
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    await user.click(trigger);
    await user.keyboard("{ArrowDown}");

    expect(frameDocument.activeElement).toBe(items[1]);
    unmount();
    frame.remove();
  });

  it("closes after an item activation unless the item callback prevents it", async () => {
    const prevented = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const { container, user } = setup(
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

    await user.click(items[0]!);
    expect(surface.hidden).toBe(false);
    await user.click(items[1]!);
    expect(surface.hidden).toBe(true);
  });

  it("opens from the trigger with ArrowDown and focuses the first item", async () => {
    const { container, user } = setup(
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

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Copy");
  });

  it("opens from the trigger with ArrowUp and focuses the last enabled item", async () => {
    const { container, user } = setup(
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

    trigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Paste");
  });

  it("closes when focus moves outside the menu and its trigger", async () => {
    const { container, user } = setup(
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

    item.focus();
    await user.tab();
    expect(surface.hidden).toBe(true);
  });
});
