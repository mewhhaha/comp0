import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import { Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Menubar } from "../index.js";

describe("menubar browser accessibility", () => {
  it("has no axe violations with a bar menu open", async () => {
    const { container, unmount } = render(
      <Menubar aria-label="Notes">
        <Menu id="file">
          <MenuTrigger>File</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="open">Open</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu id="edit">
          <MenuTrigger>Edit</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem value="undo">Undo</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Menubar>,
    );
    await expectNoAxeViolations(container, "closed menubar");

    await userEvent.click(container.querySelector<HTMLElement>("#file-trigger")!);
    expect(container.querySelector("#file-trigger")?.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(document.body, "open menubar menu");

    await userEvent.keyboard("{ArrowRight}");
    expect(container.querySelector("#edit-trigger")?.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(document.body, "neighbor menubar menu");
    unmount();
  });
});
