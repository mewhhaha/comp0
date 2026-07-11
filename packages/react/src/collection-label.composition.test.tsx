import { describe, expect, it } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Menu } from "./components/Menu.js";
import { MenuItem } from "./components/MenuItem.js";
import { MenuPopover } from "./components/MenuPopover.js";
import { MenuTrigger } from "./components/MenuTrigger.js";
import { Popover } from "./components/Popover.js";
import { Select } from "./components/Select.js";
import { SelectOption } from "./components/SelectOption.js";
import { SelectPopover } from "./components/SelectPopover.js";
import { SelectTrigger } from "./components/SelectTrigger.js";
import { SelectValue } from "./components/SelectValue.js";

describe("collection item labels", () => {
  it("crawls markup children for typeahead text and honors the textValue override", () => {
    const { container } = render(
      <Menu defaultOpen>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuItem value="archive">
            <span>Archive</span>
          </MenuItem>
          <MenuItem value="copy">
            <span>Copy</span>
          </MenuItem>
          <MenuItem value="zebra" textValue="Zebra">
            <span aria-hidden="true">🦓</span>
          </MenuItem>
        </MenuPopover>
      </Menu>,
    );
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    fireKeyDown(content, "c");
    expect(document.activeElement).toBe(items[1]);
    fireKeyDown(content, "z");
    expect(document.activeElement).toBe(items[2]);
  });

  it("shows crawled option text in SelectValue for markup children", () => {
    const { container } = render(
      <Select defaultValue="small">
        <Popover>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <SelectOption value="small">
              <em>Small</em> size
            </SelectOption>
          </SelectPopover>
        </Popover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    expect(trigger.textContent).toContain("Small size");

    const option = container.querySelector<HTMLElement>("[role='option']")!;
    fireClick(option);
    expect(trigger.textContent).toContain("Small size");
  });
});
