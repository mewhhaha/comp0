import { act } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { Menu } from "../menu/Menu.js";
import { Menubar } from "./Menubar.js";
import { MenuItem } from "../menu/MenuItem.js";
import { MenuList } from "../menu/MenuList.js";
import { MenuPopover } from "../menu/MenuPopover.js";
import { MenuTrigger } from "../menu/MenuTrigger.js";

function renderMenubar(ownerDocument?: Document) {
  const result = setup(
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
    ownerDocument,
  );
  const bar = result.container.querySelector<HTMLElement>("[role='menubar']")!;
  const file = result.container.querySelector<HTMLElement>("#file-trigger")!;
  const edit = result.container.querySelector<HTMLElement>("#edit-trigger")!;
  const view = result.container.querySelector<HTMLElement>("#view-trigger")!;
  const surfaces = [...result.container.querySelectorAll<HTMLElement>("[popover]")];
  return { ...result, bar, file, edit, view, surfaces };
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

  it("roves with ArrowRight and ArrowLeft, wrapping at both ends", async () => {
    const { file, edit, view, user } = renderMenubar();
    file.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(edit);
    expect([file.tabIndex, edit.tabIndex]).toEqual([-1, 0]);

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(file);

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(view);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(file);

    await user.keyboard("{End}");
    expect(document.activeElement).toBe(view);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(file);
  });

  it("mirrors horizontal roving in right-to-left layouts", async () => {
    const { bar, file, edit, user } = renderMenubar();
    bar.style.direction = "rtl";
    file.focus();

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(edit);
  });

  it("roves within the menubar's owning document", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const { file, edit, unmount, user } = renderMenubar(frameDocument);

    file.focus();
    await user.keyboard("{ArrowRight}");

    expect(frameDocument.activeElement).toBe(edit);
    expect([file.tabIndex, edit.tabIndex]).toEqual([-1, 0]);
    unmount();
    frame.remove();
  });

  it("keeps the bar's arrows away from menus while closed", async () => {
    const { file, surfaces, user } = renderMenubar();
    file.focus();
    await user.keyboard("{ArrowRight}");
    expect(surfaces.every((surface) => surface.hidden)).toBe(true);
  });

  it("opens with ArrowDown and focuses the first item", async () => {
    const { container, file, surfaces, user } = renderMenubar();
    file.focus();
    await user.keyboard("{ArrowDown}");
    expect(surfaces[0]!.hidden).toBe(false);
    expect(file.getAttribute("aria-expanded")).toBe("true");
    const first = container.querySelector<HTMLElement>("[data-value='new']")!;
    expect(document.activeElement).toBe(first);
  });

  it("opens with Enter and Space, and ArrowUp focuses the last item", async () => {
    const { container, file, edit, view, surfaces, user } = renderMenubar();
    file.focus();
    await user.keyboard("{Enter}");
    expect(surfaces[0]!.hidden).toBe(false);
    await user.keyboard("{Escape}");
    expect(surfaces[0]!.hidden).toBe(true);

    edit.focus();
    await user.keyboard(" ");
    expect(surfaces[1]!.hidden).toBe(false);
    await user.keyboard("{Escape}");

    view.focus();
    await user.keyboard("{ArrowUp}");
    expect(surfaces[2]!.hidden).toBe(false);
    expect(document.activeElement).toBe(container.querySelector("[data-value='zoom']"));
  });

  it("moves openness to the neighbor menu with horizontal arrows while open", async () => {
    const { container, file, surfaces, user } = renderMenubar();
    file.focus();
    await user.keyboard("{ArrowDown}");

    await user.keyboard("{ArrowRight}");
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[1]!.hidden).toBe(false);
    const undo = container.querySelector<HTMLElement>("[data-value='undo']")!;
    expect(document.activeElement).toBe(undo);

    await user.keyboard("{ArrowLeft}");
    expect(surfaces[1]!.hidden).toBe(true);
    expect(surfaces[0]!.hidden).toBe(false);
    expect(document.activeElement?.textContent).toBe("New");
  });

  it("carries openness when focus lands on another item while a menu is open", async () => {
    const { file, view, surfaces, user } = renderMenubar();
    file.focus();
    await user.keyboard("{ArrowDown}");
    expect(surfaces[0]!.hidden).toBe(false);

    act(() => view.focus());
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[2]!.hidden).toBe(false);
  });

  it("closes with Escape, restores focus to the item, and stays closed", async () => {
    const { edit, surfaces, user } = renderMenubar();
    edit.focus();
    await user.keyboard("{ArrowDown}");
    expect(surfaces[1]!.hidden).toBe(false);

    await user.keyboard("{Escape}");
    expect(surfaces[1]!.hidden).toBe(true);
    expect(document.activeElement).toBe(edit);
    expect(edit.tabIndex).toBe(0);
  });

  it("opens by click, closes by clicking the open item, and carries openness on hover", async () => {
    const { file, edit, surfaces, user } = renderMenubar();
    await user.click(file);
    expect(surfaces[0]!.hidden).toBe(false);

    await user.hover(edit);
    expect(surfaces[0]!.hidden).toBe(true);
    expect(surfaces[1]!.hidden).toBe(false);

    await user.click(edit);
    expect(surfaces[1]!.hidden).toBe(true);
  });

  it("skips disabled items when roving and ignores their activation", async () => {
    const { container, user } = setup(
      <Menubar aria-label="Notes">
        <Menu id="file">
          <MenuTrigger>File</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>New</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu id="edit">
          <MenuTrigger disabled>Edit</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Undo</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu id="view">
          <MenuTrigger>View</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Zoom</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Menubar>,
    );
    const edit = container.querySelector<HTMLElement>("#edit-trigger")!;
    const surfaces = [...container.querySelectorAll<HTMLElement>("[popover]")];

    expect(edit.getAttribute("aria-disabled")).toBe("true");
    container.querySelector<HTMLElement>("#file-trigger")!.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(container.querySelector("#view-trigger"));
    await user.click(edit);
    expect(surfaces[1]!.hidden).toBe(true);
  });
});
