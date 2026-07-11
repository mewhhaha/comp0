import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuContent } from "./components/MenuContent.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

describe("menu composition", () => {
  it("is wrapper-free by default and connects its explicit trigger and content", () => {
    const { container } = render(
      <Menu id="actions">
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem>Copy</MenuItem>
        </MenuContent>
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
        <MenuContent>
          <MenuItem>Copy</MenuItem>
          <MenuItem disabled>Cut</MenuItem>
          <MenuItem>Paste</MenuItem>
        </MenuContent>
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
        <MenuContent>
          <MenuItem onClick={prevented}>Keep open</MenuItem>
          <MenuItem>Close</MenuItem>
        </MenuContent>
      </Menu>,
    );
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireClick(items[0]!);
    expect(content.hidden).toBe(false);
    fireClick(items[1]!);
    expect(content.hidden).toBe(true);
  });
});
