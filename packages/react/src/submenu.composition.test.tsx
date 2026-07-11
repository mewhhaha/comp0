import { describe, expect, it } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuSeparator } from "./components/MenuSeparator.js";
import { MenuTrigger } from "./components/MenuTrigger.js";

function renderNested() {
  const result = render(
    <Menu defaultOpen>
      <MenuTrigger>Actions</MenuTrigger>
      <MenuPopover>
        <MenuItem value="rename">Rename</MenuItem>
        <MenuSeparator />
        <Menu>
          <MenuTrigger>Share to</MenuTrigger>
          <MenuPopover>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="link">Copy link</MenuItem>
          </MenuPopover>
        </Menu>
      </MenuPopover>
    </Menu>,
  );
  const menus = [...result.container.querySelectorAll<HTMLElement>("[role='menu']")];
  const subTrigger = result.container.querySelector<HTMLElement>(
    "[role='menuitem'][aria-haspopup='menu']",
  )!;
  return { ...result, menus, subTrigger };
}

describe("submenu composition", () => {
  it("renders the subtrigger as a menu item and the separator between items", () => {
    const { container, menus, subTrigger } = renderNested();
    expect(menus).toHaveLength(2);
    expect(subTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(subTrigger.tabIndex).toBe(-1);
    expect(container.querySelector("[role='separator']")).toBeTruthy();
    expect(menus[1]!.hidden).toBe(true);
  });

  it("participates in the parent's roving focus and opens with ArrowRight", () => {
    const { container, menus, subTrigger } = renderNested();
    const rename = container.querySelector<HTMLElement>("[data-value='rename']")!;
    expect(document.activeElement).toBe(rename);
    fireKeyDown(rename, "ArrowDown");
    expect(document.activeElement).toBe(subTrigger);

    fireKeyDown(subTrigger, "ArrowRight");
    expect(menus[1]!.hidden).toBe(false);
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;
    expect(document.activeElement).toBe(email);
  });

  it("closes only the submenu with ArrowLeft and with Escape", () => {
    const { container, menus, subTrigger } = renderNested();
    fireKeyDown(subTrigger, "ArrowRight");
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;

    fireKeyDown(email, "ArrowLeft");
    expect(menus[1]!.hidden).toBe(true);
    expect(menus[0]!.hidden).toBe(false);
    expect(document.activeElement).toBe(subTrigger);

    fireKeyDown(subTrigger, "ArrowRight");
    const emailAgain = container.querySelector<HTMLElement>("[data-value='email']")!;
    fireKeyDown(emailAgain, "Escape");
    expect(menus[1]!.hidden).toBe(true);
    expect(menus[0]!.hidden).toBe(false);
    expect(document.activeElement).toBe(subTrigger);
  });

  it("opens on click and keeps arrow navigation scoped per menu", () => {
    const { container, menus, subTrigger } = renderNested();
    fireClick(subTrigger);
    expect(menus[1]!.hidden).toBe(false);
    const email = container.querySelector<HTMLElement>("[data-value='email']")!;
    const link = container.querySelector<HTMLElement>("[data-value='link']")!;
    fireKeyDown(email, "ArrowDown");
    expect(document.activeElement).toBe(link);
    // The parent menu did not also move its own focus.
    expect(menus[0]!.hidden).toBe(false);
  });
});
