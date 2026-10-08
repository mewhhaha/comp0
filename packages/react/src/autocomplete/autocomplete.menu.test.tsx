import { describe, expect, it, vi } from "vitest";
import {
  Autocomplete,
  Label,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SearchField,
  SearchFieldInput,
  TextArea,
  TextField,
} from "../index.js";
import { setup } from "../../test/render.js";

describe("Autocomplete with a Menu", () => {
  it("leaves the query untouched when a Menu item handles its click", async () => {
    const clicked = vi.fn();
    const { container, user } = setup(
      <Autocomplete defaultInputValue="to">
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <Menu defaultOpen>
          <MenuPopover>
            <MenuList aria-label="City actions">
              <MenuItem value="tokyo" onClick={clicked}>
                Tokyo
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.click(container.querySelector<HTMLElement>("[role='menuitem']")!);

    expect(clicked).toHaveBeenCalledOnce();
    expect(input.value).toBe("to");
  });

  it("keeps focus on the editor when keyboard activation closes an Autocomplete Menu", async () => {
    const clicked = vi.fn();
    const { container, user } = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="Command" />
        </SearchField>
        <Menu defaultOpen>
          <MenuTrigger>Commands</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem id="archive-command" value="archive" onClick={clicked}>
                Archive
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;

    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe("archive-command");
    await user.keyboard("{Enter}");

    expect(clicked).toHaveBeenCalledOnce();
    expect(surface.hidden).toBe(true);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("keeps a searchable menu editor inside the popover but outside the menu list", async () => {
    const clicked = vi.fn();
    const { container, user } = setup(
      <Autocomplete disableAutoFocusFirst>
        <Menu defaultOpen>
          <MenuTrigger aria-controls="command-search" aria-haspopup="dialog">
            Commands
          </MenuTrigger>
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Menu popovers expose a dialog role through their DOM props. */}
          <MenuPopover id="command-search" role="dialog" aria-label="Command search">
            <SearchField>
              <SearchFieldInput aria-label="Find a command" />
            </SearchField>
            <MenuList aria-label="Matching commands">
              <MenuItem id="archive-command" value="archive" onClick={clicked}>
                Archive
              </MenuItem>
              <MenuItem id="print-command" value="print">
                Print
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const input = container.querySelector<HTMLInputElement>("input")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const menu = container.querySelector<HTMLElement>("[role='menu']")!;

    expect(surface.contains(input)).toBe(true);
    expect(menu.contains(input)).toBe(false);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-controls")).toBe("command-search");
    expect(document.activeElement).toBe(input);

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(input);
    await user.keyboard("ar");
    await user.keyboard("{Escape}");
    expect(input.value).toBe("");
    expect(surface.hidden).toBe(false);
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe("archive-command");
    await user.keyboard("{Enter}");

    expect(clicked).toHaveBeenCalledOnce();
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("uses a mounted MenuList id for TextArea controls and removes it on unmount", () => {
    const { container, rerender } = setup(
      <Autocomplete>
        <TextField>
          <Label>Command</Label>
          <TextArea />
        </TextField>
        <Menu defaultOpen>
          <MenuTrigger>Commands</MenuTrigger>
          <MenuPopover>
            <MenuList id="command-results" aria-label="Commands">
              <MenuItem value="archive">Archive</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    expect(input.getAttribute("aria-controls")).toBe("command-results");
    expect(trigger.getAttribute("aria-controls")).toBe("command-results");

    rerender(
      <Autocomplete>
        <TextField>
          <Label>Command</Label>
          <TextArea />
        </TextField>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-controls")).toBe(false);
  });

  it("filters rich Menu children on the initial query without a measurement render", () => {
    const { container } = setup(
      <Autocomplete
        defaultInputValue="New York"
        filter={(textValue, inputValue) => textValue.includes(inputValue)}
      >
        <SearchField>
          <SearchFieldInput aria-label="City action" />
        </SearchField>
        <Menu defaultOpen>
          <MenuPopover>
            <MenuList aria-label="Cities">
              <MenuItem value="nyc">
                <span>
                  New <strong>York</strong>
                </span>
              </MenuItem>
              <MenuItem value="warsaw">
                <span>Warsaw</span>
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    expect(container.querySelectorAll("[role='menuitem']")).toHaveLength(1);
    expect(container.querySelector("[role='menuitem']")?.textContent).toBe("New York");
  });
});
