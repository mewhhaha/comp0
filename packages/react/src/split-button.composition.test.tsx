import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Button } from "./components/Button.js";
import { Menu } from "./components/Menu.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuList } from "./components/MenuList.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuTrigger } from "./components/MenuTrigger.js";
import { SplitButton } from "./components/SplitButton.js";

function renderSplit(primaryProps: { disabled?: boolean } = {}) {
  const onSave = vi.fn();
  const onSaveAs = vi.fn();
  const result = render(
    <SplitButton aria-label="Save">
      <Button onClick={onSave} {...primaryProps}>
        Save
      </Button>
      <Menu id="save-menu">
        <MenuTrigger aria-label="More save options">More</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem onClick={onSaveAs}>Save as</MenuItem>
            <MenuItem>Save a copy</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </SplitButton>,
  );
  const group = result.container.querySelector<HTMLElement>("[role='group']")!;
  const primary = result.container.querySelector<HTMLButtonElement>("button")!;
  const menuTrigger = result.container.querySelector<HTMLButtonElement>("[aria-haspopup='menu']")!;
  const content = result.container.querySelector<HTMLElement>("[role='menu']")!;
  const surface = result.container.querySelector<HTMLElement>("[popover]")!;
  return { ...result, group, primary, menuTrigger, content, surface, onSave, onSaveAs };
}

describe("split button composition", () => {
  it("groups the two segments with a name and one tab stop", () => {
    const { group, primary, menuTrigger } = renderSplit();
    expect(group.getAttribute("aria-label")).toBe("Save");
    expect(primary.textContent).toBe("Save");
    expect(primary.tabIndex).toBe(0);
    expect(menuTrigger.tabIndex).toBe(-1);
  });

  it("roves between the segments with the arrow keys, without wrapping", () => {
    const { primary, menuTrigger } = renderSplit();
    primary.focus();
    fireKeyDown(primary, "ArrowRight");
    expect(document.activeElement).toBe(menuTrigger);
    expect(menuTrigger.tabIndex).toBe(0);
    expect(primary.tabIndex).toBe(-1);
    fireKeyDown(menuTrigger, "ArrowRight");
    expect(document.activeElement).toBe(menuTrigger);
    fireKeyDown(menuTrigger, "ArrowLeft");
    expect(document.activeElement).toBe(primary);
    fireKeyDown(primary, "ArrowLeft");
    expect(document.activeElement).toBe(primary);
    fireKeyDown(primary, "End");
    expect(document.activeElement).toBe(menuTrigger);
    fireKeyDown(menuTrigger, "Home");
    expect(document.activeElement).toBe(primary);
  });

  it("drops a disabled default action from the tab stop", () => {
    const { primary, menuTrigger } = renderSplit({ disabled: true });
    expect(primary.disabled).toBe(true);
    expect(menuTrigger.tabIndex).toBe(0);
  });

  it("opens the menu from its own button and restores focus on Escape", () => {
    const { menuTrigger, surface } = renderSplit();
    expect(surface.hidden).toBe(true);
    menuTrigger.focus();
    fireKeyDown(menuTrigger, "ArrowDown");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Save as");
    fireKeyDown(document.activeElement!, "Escape");
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(menuTrigger);
  });

  it("activates the default action on click", () => {
    const { primary, onSave } = renderSplit();
    fireClick(primary);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
