import { Fragment, act } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Autocomplete,
  Label,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  SearchField,
  SearchFieldInput,
  TextArea,
  TextField,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

function fireInput(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    const prototype = Object.getPrototypeOf(element) as typeof HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function CityOptions() {
  return (
    <ListBox aria-label="Cities">
      <ListBoxItem value="warsaw" textValue="Warsaw">
        Warsaw
      </ListBoxItem>
      <ListBoxItem value="new-york" textValue="New York">
        NYC
      </ListBoxItem>
    </ListBox>
  );
}

describe("Autocomplete composition", () => {
  it("is a provider and does not add a wrapper around its children", () => {
    const { container } = render(
      <Autocomplete>
        <SearchField as={Fragment}>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("INPUT");
  });

  it("filters ListBox items by their textValue and leaves unfiltered collections intact", () => {
    const { container } = render(
      <Autocomplete filter={(textValue, inputValue) => textValue.includes(inputValue)}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    expect(container.querySelectorAll("[role='option']")).toHaveLength(2);
    fireInput(input, "York");

    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(container.querySelector("[role='option']")?.textContent).toBe("NYC");

    const unfiltered = render(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    expect(unfiltered.container.querySelectorAll("[role='option']")).toHaveLength(2);
  });

  it("keeps the query separate when a ListBox item is selected", () => {
    const { container } = render(
      <Autocomplete defaultInputValue="war">
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const option = container.querySelector<HTMLElement>("[data-value='warsaw']")!;

    fireClick(option);

    expect(option.getAttribute("aria-selected")).toBe("true");
    expect(input.value).toBe("war");
  });

  it("leaves the query untouched when a Menu item handles its click", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Autocomplete defaultInputValue="to">
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <Menu defaultOpen>
          <MenuPopover aria-label="City actions">
            <MenuItem value="tokyo" onClick={clicked}>
              Tokyo
            </MenuItem>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    fireClick(container.querySelector<HTMLElement>("[role='menuitem']")!);

    expect(clicked).toHaveBeenCalledOnce();
    expect(input.value).toBe("to");
  });

  it("keeps focus on the editor when keyboard activation closes an Autocomplete Menu", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="Command" />
        </SearchField>
        <Menu defaultOpen>
          <MenuTrigger>Commands</MenuTrigger>
          <MenuPopover>
            <MenuItem id="archive-command" value="archive" onClick={clicked}>
              Archive
            </MenuItem>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const menu = container.querySelector<HTMLElement>("[role='menu']")!;

    input.focus();
    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("archive-command");
    fireKeyDown(input, "Enter");

    expect(clicked).toHaveBeenCalledOnce();
    expect(menu.hidden).toBe(true);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("only exposes the effective ListBox id while the collection is mounted", () => {
    const { container, rerender } = render(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.hasAttribute("aria-controls")).toBe(false);

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox id="city-results" aria-label="Cities">
          <ListBoxItem value="warsaw">Warsaw</ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.getAttribute("aria-controls")).toBe("city-results");

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-controls")).toBe(false);
  });

  it("uses a mounted MenuPopover id for TextArea controls and removes it on unmount", () => {
    const { container, rerender } = render(
      <Autocomplete>
        <TextField>
          <Label>Command</Label>
          <TextArea />
        </TextField>
        <Menu defaultOpen>
          <MenuTrigger>Commands</MenuTrigger>
          <MenuPopover id="command-results" aria-label="Commands">
            <MenuItem value="archive">Archive</MenuItem>
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

  it("reports edits without replacing a rejected controlled query", () => {
    const changed = vi.fn();
    const { container } = render(
      <Autocomplete inputValue="War" onInputChange={changed}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    fireInput(input, "Tokyo");

    expect(changed).toHaveBeenLastCalledWith("Tokyo");
    expect(input.value).toBe("War");
  });

  it("uses virtual focus only for rendered enabled items and clears it on editing keys", () => {
    const { container } = render(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="Framework" />
        </SearchField>
        <ListBox aria-label="Frameworks">
          <ListBoxItem id="disabled-first" value="angular" disabled>
            Angular
          </ListBoxItem>
          <ListBoxItem id="react-option" value="react">
            React
          </ListBoxItem>
          <ListBoxItem id="disabled-middle" value="solid" disabled>
            Solid
          </ListBoxItem>
          <ListBoxItem id="vue-option" value="vue">
            Vue
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    input.focus();
    fireInput(input, "r");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    expect(container.querySelector("#react-option")?.hasAttribute("data-active")).toBe(true);

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("vue-option");
    fireKeyDown(input, "ArrowUp");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    const end = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
    act(() => input.dispatchEvent(end));
    expect(end.defaultPrevented).toBe(false);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    fireKeyDown(input, "ArrowDown");
    const home = new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true });
    act(() => input.dispatchEvent(home));
    expect(home.defaultPrevented).toBe(false);
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    fireKeyDown(input, "ArrowDown");
    fireKeyDown(input, "ArrowRight");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    fireKeyDown(input, "Tab");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    fireKeyDown(input, "Escape");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("activates a delayed external result once for the current forward edit", () => {
    const { container, rerender } = render(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities" />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    input.focus();
    fireInput(input, "wa");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.getAttribute("aria-activedescendant")).toBe("delayed-warsaw");

    fireKeyDown(input, "ArrowRight");
    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxItem>
          <ListBoxItem id="delayed-wawel" value="wawel">
            Wawel
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    fireInput(input, "w");
    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxItem>
          <ListBoxItem id="delayed-wawel" value="wawel">
            Wawel
          </ListBoxItem>
          <ListBoxItem id="delayed-wroclaw" value="wroclaw">
            Wroclaw
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("drops an active item when filtered results remove it", () => {
    const { container, rerender } = render(
      <Autocomplete filter={() => true}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem id="warsaw-option" value="warsaw">
            Warsaw
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("warsaw-option");

    rerender(
      <Autocomplete filter={() => false}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem id="warsaw-option" value="warsaw">
            Warsaw
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );

    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("supports disabling automatic and virtual focus independently", () => {
    const { container, rerender } = render(
      <Autocomplete disableAutoFocusFirst>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    let input = container.querySelector<HTMLInputElement>("input")!;

    fireInput(input, "war");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    rerender(
      <Autocomplete disableVirtualFocus>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    input = container.querySelector<HTMLInputElement>("input")!;
    input.focus();
    fireKeyDown(input, "ArrowDown");

    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("filters rich ListBox and Menu children on the initial query without a measurement render", () => {
    const listBox = render(
      <Autocomplete
        defaultInputValue="New York"
        filter={(textValue, inputValue) => textValue.includes(inputValue)}
      >
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem value="nyc">
            <span>
              New <strong>York</strong>
            </span>
          </ListBoxItem>
          <ListBoxItem value="warsaw">
            <span>Warsaw</span>
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    expect(listBox.container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(listBox.container.querySelector("[role='option']")?.textContent).toBe("New York");

    const menu = render(
      <Autocomplete
        defaultInputValue="New York"
        filter={(textValue, inputValue) => textValue.includes(inputValue)}
      >
        <SearchField>
          <SearchFieldInput aria-label="City action" />
        </SearchField>
        <Menu defaultOpen>
          <MenuPopover aria-label="Cities">
            <MenuItem value="nyc">
              <span>
                New <strong>York</strong>
              </span>
            </MenuItem>
            <MenuItem value="warsaw">
              <span>Warsaw</span>
            </MenuItem>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    expect(menu.container.querySelectorAll("[role='menuitem']")).toHaveLength(1);
    expect(menu.container.querySelector("[role='menuitem']")?.textContent).toBe("New York");
  });

  it("requires textValue for opaque child labels before a filtered item can render", () => {
    function CityName() {
      return <span>New York</span>;
    }

    expect(() =>
      render(
        <Autocomplete defaultInputValue="New" filter={(textValue) => textValue.startsWith("New")}>
          <SearchField>
            <SearchFieldInput aria-label="City" />
          </SearchField>
          <ListBox aria-label="Cities">
            <ListBoxItem value="nyc">
              <CityName />
            </ListBoxItem>
          </ListBox>
        </Autocomplete>,
      ),
    ).toThrow(/requires textValue/);
  });

  it("filters an opaque child label after its text has been crawled from an initial render", () => {
    function CityName() {
      return <span>New York</span>;
    }

    const { container } = render(
      <Autocomplete filter={(textValue, inputValue) => textValue.startsWith(inputValue)}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem value="nyc">
            <CityName />
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    fireInput(input, "New");

    expect(container.querySelector("[role='option']")?.textContent).toBe("New York");
  });

  it("selects the active item instead of submitting a SearchField", () => {
    const submitted = vi.fn();
    const clicked = vi.fn();
    const { container } = render(
      <Autocomplete defaultInputValue="war">
        <SearchField onSubmit={submitted}>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxItem value="warsaw" onClick={clicked}>
            Warsaw
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    input.focus();
    fireKeyDown(input, "ArrowDown");
    fireKeyDown(input, "Enter");

    expect(clicked).toHaveBeenCalledOnce();
    expect(submitted).not.toHaveBeenCalled();
    expect(input.value).toBe("war");
    expect(document.activeElement).toBe(input);
  });

  it("filters TextArea suggestions by substring and selects the active item on Enter", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Autocomplete filter={(textValue, inputValue) => textValue.includes(inputValue)}>
        <TextField>
          <Label>Destination</Label>
          <TextArea />
        </TextField>
        <ListBox aria-label="Destinations">
          <ListBoxItem value="warsaw">Warsaw</ListBoxItem>
          <ListBoxItem value="newark" onClick={clicked}>
            Newark
          </ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;

    input.focus();
    fireInput(input, "ark");
    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(input.getAttribute("aria-activedescendant")).toBe(
      container.querySelector("[role='option']")?.id,
    );
    fireKeyDown(input, "Enter");

    expect(clicked).toHaveBeenCalledOnce();
    expect(input.value).toBe("ark");
    expect(document.activeElement).toBe(input);
  });
});
