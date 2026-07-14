import { act } from "react";
import { describe, expect, it } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuList } from "./components/MenuList.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuSeparator } from "./components/MenuSeparator.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

function renderNested() {
  const result = render(
    <Menu defaultOpen>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem value="rename">Rename</MenuItem>
          <MenuSeparator />
          <Menu>
            <MenuTrigger>Share to</MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="link">Copy link</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </MenuList>
      </MenuPopover>
    </Menu>,
  );
  const menus = [...result.container.querySelectorAll<HTMLElement>("[role='menu']")];
  const popovers = [...result.container.querySelectorAll<HTMLElement>("[popover]")];
  const subTrigger = result.container.querySelector<HTMLElement>(
    "[role='menuitem'][aria-haspopup='menu']",
  )!;
  return { ...result, menus, popovers, subTrigger };
}

describe("submenu composition", () => {
  it("renders the subtrigger as a menu item and the separator between items", () => {
    const { container, menus, popovers, subTrigger } = renderNested();
    expect(menus).toHaveLength(2);
    expect(subTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(subTrigger.tabIndex).toBe(-1);
    expect(container.querySelector("[role='separator']")).toBeTruthy();
    expect(popovers[1]!.hidden).toBe(true);
  });

  it("participates in the parent's roving focus and opens with ArrowRight", () => {
    const { container, popovers, subTrigger } = renderNested();
    const rename = container.querySelector<HTMLElement>("[data-value='rename']")!;
    expect(document.activeElement).toBe(rename);
    fireKeyDown(rename, "ArrowDown");
    expect(document.activeElement).toBe(subTrigger);

    fireKeyDown(subTrigger, "ArrowRight");
    expect(popovers[1]!.hidden).toBe(false);
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;
    expect(document.activeElement).toBe(email);
  });

  it("closes only the submenu with ArrowLeft and with Escape", () => {
    const { container, popovers, subTrigger } = renderNested();
    fireKeyDown(subTrigger, "ArrowRight");
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;

    fireKeyDown(email, "ArrowLeft");
    expect(popovers[1]!.hidden).toBe(true);
    expect(popovers[0]!.hidden).toBe(false);
    expect(document.activeElement).toBe(subTrigger);

    fireKeyDown(subTrigger, "ArrowRight");
    const emailAgain = container.querySelector<HTMLElement>("[data-value='email']")!;
    fireKeyDown(emailAgain, "Escape");
    expect(popovers[1]!.hidden).toBe(true);
    expect(popovers[0]!.hidden).toBe(false);
    expect(document.activeElement).toBe(subTrigger);
  });

  it("opens on click and keeps arrow navigation scoped per menu", () => {
    const { container, popovers, subTrigger } = renderNested();
    fireClick(subTrigger);
    expect(popovers[1]!.hidden).toBe(false);
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;
    const link = container.querySelector<HTMLElement>("[data-value='link']")!;
    fireKeyDown(email, "ArrowDown");
    expect(document.activeElement).toBe(link);
    // The parent menu did not also move its own focus.
    expect(popovers[0]!.hidden).toBe(false);
  });
});

describe("submenu coordination", () => {
  it("closes the submenu when focus moves to a different parent item", () => {
    const { container, popovers, subTrigger } = renderNested();
    fireKeyDown(subTrigger, "ArrowRight");
    expect(popovers[1]!.hidden).toBe(false);

    const rename = container.querySelector<HTMLElement>("[data-value='rename']")!;
    act(() => rename.focus());
    expect(popovers[1]!.hidden).toBe(true);
    expect(popovers[0]!.hidden).toBe(false);
  });

  it("closes the whole chain and refocuses the root trigger on activation", () => {
    const { container, popovers, subTrigger } = renderNested();
    fireKeyDown(subTrigger, "ArrowRight");
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;
    fireClick(email);
    expect(popovers[1]!.hidden).toBe(true);
    expect(popovers[0]!.hidden).toBe(true);
    const rootTrigger = container.querySelector<HTMLButtonElement>("button")!;
    expect(document.activeElement).toBe(rootTrigger);
  });
});
