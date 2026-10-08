import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import { Menu, MenuItem, MenuList, MenuPopover, MenuSeparator, MenuTrigger } from "../index.js";

describe("menu browser accessibility", () => {
  it("has no axe violations with a menu and its submenu open", async () => {
    const { container, unmount } = render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList aria-label="Actions">
            <MenuItem value="rename">Rename</MenuItem>
            <MenuSeparator />
            <Menu>
              <MenuTrigger>Share to</MenuTrigger>
              <MenuPopover>
                <MenuList aria-label="Share to">
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="link">Copy link</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const trigger = container.querySelector<HTMLElement>("button")!;

    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(document.body, "open menu");

    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    const submenu = container.querySelector<HTMLElement>("[role='menuitem'][aria-haspopup='menu']");
    expect(submenu?.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(document.body, "open submenu");
    unmount();
  });
});
