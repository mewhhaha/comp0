import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, render, setup } from "../test/render.js";
import { Menu } from "./menu/Menu.js";
import { MenuItem } from "./menu/MenuItem.js";
import { MenuList } from "./menu/MenuList.js";
import { MenuPopover } from "./menu/MenuPopover.js";
import { MenuTrigger } from "./menu/MenuTrigger.js";
import { Select } from "./select/Select.js";
import { SelectOption } from "./select/SelectOption.js";
import { SelectPopover } from "./select/SelectPopover.js";
import { SelectTrigger } from "./select/SelectTrigger.js";
import { SelectValue } from "./select/SelectValue.js";

describe("collection item labels", () => {
  it("crawls markup children for typeahead text and honors the textValue override", () => {
    vi.useFakeTimers();
    const { container } = render(
      <Menu defaultOpen>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem value="archive">
              <span>Archive</span>
            </MenuItem>
            <MenuItem value="copy">
              <span>Copy</span>
            </MenuItem>
            <MenuItem value="zebra" textValue="Zebra">
              <span aria-hidden="true">🦓</span>
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>,
    );
    const content = container.querySelector<HTMLElement>("[role='menu']")!;
    const items = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    // oxlint-disable-next-line comp0/no-synthetic-events -- userEvent cannot advance the typeahead timeout under fake timers
    fireKeyDown(content, "c");
    expect(document.activeElement).toBe(items[1]);
    // Rapid keystrokes extend one buffered search: "co" still matches Copy.
    // oxlint-disable-next-line comp0/no-synthetic-events -- userEvent cannot advance the typeahead timeout under fake timers
    fireKeyDown(content, "o");
    expect(document.activeElement).toBe(items[1]);
    // After the buffer times out a new search starts.
    vi.advanceTimersByTime(700);
    // oxlint-disable-next-line comp0/no-synthetic-events -- userEvent cannot advance the typeahead timeout under fake timers
    fireKeyDown(content, "z");
    expect(document.activeElement).toBe(items[2]);
    vi.useRealTimers();
  });

  it("shows crawled option text in SelectValue for markup children", async () => {
    const { container, user } = setup(
      <Select defaultValue="small">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectPopover>
          <SelectOption value="small">
            <em>Small</em> size
          </SelectOption>
        </SelectPopover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    expect(trigger.textContent).toContain("Small size");

    const option = container.querySelector<HTMLElement>("[role='option']")!;
    await user.click(option);
    expect(trigger.textContent).toContain("Small size");
  });
});
