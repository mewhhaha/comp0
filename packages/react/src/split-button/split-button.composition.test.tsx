import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Button } from "../button/Button.js";
import { Menu } from "../menu/Menu.js";
import { MenuItem } from "../menu/MenuItem.js";
import { MenuList } from "../menu/MenuList.js";
import { MenuPopover } from "../menu/MenuPopover.js";
import { MenuTrigger } from "../menu/MenuTrigger.js";
import { SplitButton } from "./SplitButton.js";

function renderSplit(primaryProps: { disabled?: boolean } = {}) {
  const onSave = vi.fn();
  const onSaveAs = vi.fn();
  const result = setup(
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
  it("groups the two segments with a name and one tab stop", async () => {
    const { group, primary, menuTrigger } = renderSplit();
    expect(group.getAttribute("aria-label")).toBe("Save");
    expect(primary.textContent).toBe("Save");
    expect(primary.tabIndex).toBe(0);
    expect(menuTrigger.tabIndex).toBe(-1);
  });

  it("roves between the segments with the arrow keys, without wrapping", async () => {
    const { primary, menuTrigger, user } = renderSplit();
    primary.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(menuTrigger);
    expect(menuTrigger.tabIndex).toBe(0);
    expect(primary.tabIndex).toBe(-1);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(menuTrigger);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(primary);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(primary);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(menuTrigger);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(primary);
  });

  it("drops a disabled default action from the tab stop", async () => {
    const { primary, menuTrigger } = renderSplit({ disabled: true });
    expect(primary.disabled).toBe(true);
    expect(menuTrigger.tabIndex).toBe(0);
  });

  it("drops an aria-disabled polymorphic action from the tab stop", () => {
    const { container } = setup(
      <SplitButton aria-label="Save">
        <Button as="a" href="/save" disabled>
          Save
        </Button>
        <Button>More</Button>
      </SplitButton>,
    );
    const primary = container.querySelector<HTMLAnchorElement>("a")!;
    const secondary = container.querySelector<HTMLButtonElement>("button")!;

    expect(primary.tabIndex).toBe(-1);
    expect(secondary.tabIndex).toBe(0);
  });

  it("opens the menu from its own button and restores focus on Escape", async () => {
    const { menuTrigger, surface, user } = renderSplit();
    expect(surface.hidden).toBe(true);
    menuTrigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(surface.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("Save as");
    await user.keyboard("{Escape}");
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(menuTrigger);
  });

  it("activates the default action on click", async () => {
    const { primary, onSave, user } = renderSplit();
    await user.click(primary);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
