import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import { ContextMenu, ContextMenuTrigger, MenuItem, MenuList, MenuPopover } from "../index.js";

describe("context menu browser accessibility", () => {
  it("has no axe violations while open", async () => {
    const { container, unmount } = render(
      <ContextMenu id="attachment">
        <ContextMenuTrigger tabIndex={0}>Attachment</ContextMenuTrigger>
        <MenuPopover>
          <MenuList aria-label="Attachment actions">
            <MenuItem value="download">Download</MenuItem>
            <MenuItem value="remove">Remove</MenuItem>
          </MenuList>
        </MenuPopover>
      </ContextMenu>,
    );

    await userEvent.click(container.querySelector<HTMLElement>("[tabindex='0']")!, {
      button: "right",
    });
    // The menu opens once the right-button press settles.
    await vi.waitFor(() =>
      expect(container.querySelector<HTMLElement>("[popover]")?.matches(":popover-open")).toBe(
        true,
      ),
    );
    await expectNoAxeViolations(document.body, "open context menu");
    unmount();
  });
});
