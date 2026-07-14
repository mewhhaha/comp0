import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { ContextMenu } from "./components/ContextMenu.js";
import { ContextMenuTrigger } from "./components/ContextMenuTrigger.js";
import { Menu } from "./components/Menu.js";
import { Menubar } from "./components/Menubar.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuList } from "./components/MenuList.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

function renderMenubar() {
  const result = render(
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
      <Menu id="view">
        <MenuTrigger>View</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem value="zoom">Zoom</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </Menubar>,
  );
  const bar = result.container.querySelector<HTMLElement>("[role='menubar']")!;
  const file = document.getElementById("file-trigger")!;
  const edit = document.getElementById("edit-trigger")!;
  const view = document.getElementById("view-trigger")!;
  const surfaces = [...result.container.querySelectorAll<HTMLElement>("[popover]")];
  return { ...result, bar, file, edit, view, surfaces };
}

function fireContextMenu(element: Element, init?: MouseEventInit) {
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, ...init });
  act(() => {
    element.dispatchEvent(event);
  });
  return event;
}

describe("menubar composition", () => {
  it("renders menubar semantics with menuitem triggers and a single tab stop", () => {
    const { bar, file, edit, view, surfaces } = renderMenubar();
    expect(bar.getAttribute("aria-label")).toBe("Notes");
    for (const trigger of [file, edit, view]) {
      expect(trigger.getAttribute("role")).toBe("menuitem");
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    }
    expect(file.getAttribute("aria-controls")).toBe("file-content");
    expect([file.tabIndex, edit.tabIndex, view.tabIndex]).toEqual([0, -1, -1]);
    expect(surfaces.every((surface) => surface.hidden)).toBe(true);
  });

  it("roves with ArrowRight and ArrowLeft, wrapping at both ends", () => {
    const { file, edit, view } = renderMenubar();
    act(() => file.focus());

    fireKeyDown(file, "ArrowRight");
    expect(document.activeElement).toBe(edit);
    expect([file.tabIndex, edit.tabIndex]).toEqual([-1, 0]);

    fireKeyDown(edit, "ArrowLeft");
    expect(document.activeElement).toBe(file);

    fireKeyDown(file, "ArrowLeft");
    expect(document.activeElement).toBe(view);
    fireKeyDown(view, "ArrowRight");
    expect(document.activeElement).toBe(file);

    fireKeyDown(file, "End");
    expect(document.activeElement).toBe(view);
    fireKeyDown(view, "Home");
    expect(document.activeElement).toBe(file);
  });

  it("keeps the bar's arrows away from menus while closed", () => {
    const { file, surfaces } = renderMenubar();
    act(() => file.focus());
    fireKeyDown(file, "ArrowRight");
    expect(surfaces.every((surface) => surface.hidden)).toBe(true);
  });

  it("opens with ArrowDown and focuses the first item", () => {
    const { container, file, surfaces } = renderMenubar();
    act(() => file.focus());
    fireKeyDown(file, "ArrowDown");
    expect(surfaces[0]!.hidden).toBe(false);
    expect(file.getAttribute("aria-expanded")).toBe("true");
    const first = container.querySelector<HTMLElement>("[data-value='new']")!;
    expect(document.activeElement).toBe(first);
  });

  it("moves openness to the neighbor menu with horizontal arrows while open", () => {
    const { container, file, surfaces } = renderMenubar();
    act(() => file.focus());
    fireKeyDown(file, "ArrowDown");
    const newItem = container.querySelector<HTMLElement>("[data-value='new']")!;

    fireKeyDown(newItem, "ArrowRight");
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[1]!.hidden).toBe(false);
    const undo = container.querySelector<HTMLElement>("[data-value='undo']")!;
    expect(document.activeElement).toBe(undo);

    fireKeyDown(undo, "ArrowLeft");
    expect(surfaces[1]!.hidden).toBe(true);
    expect(surfaces[0]!.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("New");
  });

  it("carries openness when focus lands on another item while a menu is open", () => {
    const { file, view, surfaces } = renderMenubar();
    act(() => file.focus());
    fireKeyDown(file, "ArrowDown");
    expect(surfaces[0]!.hidden).toBe(false);

    act(() => view.focus());
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[2]!.hidden).toBe(false);
  });

  it("closes with Escape, restores focus to the item, and stays closed", () => {
    const { edit, surfaces } = renderMenubar();
    act(() => edit.focus());
    fireKeyDown(edit, "ArrowDown");
    expect(surfaces[1]!.hidden).toBe(false);

    fireKeyDown(document.activeElement!, "Escape");
    expect(surfaces[1]!.hidden).toBe(true);
    expect(document.activeElement).toBe(edit);
    expect(edit.tabIndex).toBe(0);
  });

  it("closes an open sibling when another item's menu opens by click", () => {
    const { file, edit, surfaces } = renderMenubar();
    fireClick(file);
    expect(surfaces[0]!.hidden).toBe(false);
    fireClick(edit);
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[1]!.hidden).toBe(false);
  });
});

function renderContextMenu(onToggle?: (open: boolean) => void) {
  const result = render(
    <>
      <button type="button">Before</button>
      <ContextMenu id="attachment" onToggle={onToggle}>
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

  it("closes with Escape and restores focus to where it was", () => {
    const { before, area, popover } = renderContextMenu();
    act(() => before.focus());
    fireContextMenu(area, { clientX: 5, clientY: 5 });
    expect(popover.hidden).toBe(false);

    fireKeyDown(document.activeElement!, "Escape");
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  it("opens from the keyboard with Shift+F10 and the ContextMenu key", () => {
    const { area, popover } = renderContextMenu();
    act(() => area.focus());
    fireKeyDown(area, "F10", { shiftKey: true });
    expect(popover.hidden).toBe(false);

    fireKeyDown(document.activeElement!, "Escape");
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(area);

    fireKeyDown(area, "ContextMenu");
    expect(popover.hidden).toBe(false);
  });

  it("suppresses a native context menu after keyboard opening moves focus", () => {
    const { area, popover } = renderContextMenu();
    act(() => area.focus());
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

  it("closes after activating an item and restores focus", () => {
    const { container, area, popover } = renderContextMenu();
    act(() => area.focus());
    fireContextMenu(area, { clientX: 8, clientY: 9 });
    const remove = container.querySelector<HTMLElement>("[data-value='remove']")!;
    fireClick(remove);
    expect(popover.hidden).toBe(true);
    expect(document.activeElement).toBe(area);
  });
});
