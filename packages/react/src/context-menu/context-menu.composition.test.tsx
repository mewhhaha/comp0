import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { MenuItem } from "../menu/MenuItem.js";
import { MenuList } from "../menu/MenuList.js";
import { MenuPopover } from "../menu/MenuPopover.js";
import { ContextMenu } from "./ContextMenu.js";
import { ContextMenuTrigger } from "./ContextMenuTrigger.js";

function fireContextMenu(element: Element, init?: MouseEventInit) {
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, ...init });
  act(() => {
    element.dispatchEvent(event);
  });
  return event;
}

function renderContextMenu(onOpenChange?: (open: boolean) => void) {
  const result = setup(
    <>
      <button type="button">Before</button>
      <ContextMenu id="attachment" onOpenChange={onOpenChange}>
        <ContextMenuTrigger tabIndex={0}>Attachment</ContextMenuTrigger>
        <MenuPopover>
          <MenuList aria-label="Attachment actions">
            <MenuItem value="download" onContextMenu={(event) => event.stopPropagation()}>
              Download
            </MenuItem>
            <MenuItem value="remove">Remove</MenuItem>
          </MenuList>
        </MenuPopover>
      </ContextMenu>
    </>,
  );
  const before = result.container.querySelector<HTMLButtonElement>("button")!;
  const area = document.getElementById("attachment-trigger")!;
  const popover = result.container.querySelector<HTMLElement>("[popover]")!;
  const menuList = result.container.querySelector<HTMLElement>("[role='menu']")!;
  return { ...result, before, area, popover, menuList };
}

describe("context menu composition", () => {
  it("opens on contextmenu with the pointer position exposed as CSS variables", () => {
    const changed = vi.fn();
    const { container, area, popover } = renderContextMenu(changed);
    expect(popover.hidden).toBe(true);

    const event = fireContextMenu(area, { clientX: 42, clientY: 24 });
    expect(event.defaultPrevented).toBe(true);
    expect(changed).toHaveBeenLastCalledWith(true);
    expect(popover.hidden).toBe(false);
    expect(area.getAttribute("data-open")).toBe("");
    expect(popover.style.getPropertyValue("--comp0-context-menu-x")).toBe("42px");
    expect(popover.style.getPropertyValue("--comp0-context-menu-y")).toBe("24px");
    const first = container.querySelector<HTMLElement>("[data-value='download']")!;
    expect(document.activeElement).toBe(first);
  });

  it("opens from a right-button press and keeps the menu open after the press settles", async () => {
    const { area, popover, user } = renderContextMenu();

    await user.pointer({ keys: "[MouseRight]", target: area });
    await vi.waitFor(() => expect(popover.hidden).toBe(false));
  });

  it("labels the menu list instead of borrowing a trigger label", () => {
    const { popover, menuList } = renderContextMenu();
    expect(menuList.getAttribute("aria-label")).toBe("Attachment actions");
    expect(popover.hasAttribute("aria-label")).toBe(false);
    expect(popover.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("re-records the position when reopened elsewhere", () => {
    const { area, popover } = renderContextMenu();
    fireContextMenu(area, { clientX: 10, clientY: 20 });
    fireContextMenu(area, { clientX: 300, clientY: 150 });
    expect(popover.hidden).toBe(false);
    expect(popover.style.getPropertyValue("--comp0-context-menu-x")).toBe("300px");
    expect(popover.style.getPropertyValue("--comp0-context-menu-y")).toBe("150px");
  });

  it("closes with Escape and restores focus to where it was", async () => {
    const { before, area, popover, user } = renderContextMenu();
    before.focus();
    fireContextMenu(area, { clientX: 5, clientY: 5 });
    expect(popover.hidden).toBe(false);

    await user.keyboard("{Escape}");
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  it("opens from the keyboard with Shift+F10 and the ContextMenu key", async () => {
    const { area, popover, user } = renderContextMenu();
    area.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(popover.hidden).toBe(false);

    await user.keyboard("{Escape}");
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(area);

    await user.keyboard("{ContextMenu}");
    expect(popover.hidden).toBe(false);
  });

  it("suppresses a native context menu after keyboard opening moves focus", () => {
    const { area, popover } = renderContextMenu();
    area.focus();
    // userEvent cannot report the default action of one keydown, which is what this asserts.
    const keydown = new KeyboardEvent("keydown", {
      key: "F10",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => area.dispatchEvent(keydown));

    expect(keydown.defaultPrevented).toBe(true);
    expect(popover.hidden).toBe(false);
    expect(document.activeElement?.getAttribute("data-value")).toBe("download");

    const nativeEvent = fireContextMenu(document.activeElement!);
    expect(nativeEvent.defaultPrevented).toBe(true);
    expect(popover.hidden).toBe(false);
  });

  it("closes after activating an item and restores focus", async () => {
    const { container, area, popover, user } = renderContextMenu();
    area.focus();
    fireContextMenu(area, { clientX: 8, clientY: 9 });
    const remove = container.querySelector<HTMLElement>("[data-value='remove']")!;
    await user.click(remove);
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(area);
  });
});
