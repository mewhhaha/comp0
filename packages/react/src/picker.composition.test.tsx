import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Combobox,
  ComboboxPopover,
  ComboboxInput,
  ComboboxOptGroup,
  ComboboxOption,
  ComboboxTrigger,
  Description,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  SelectOptGroup,
  SelectPopover,
  SelectOption,
  SelectTrigger,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

describe("picker composition", () => {
  it("wires picker parts without a Popover wrapper and still requires the root", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<SelectTrigger>Choose</SelectTrigger>)).toThrow(
        "SelectTrigger must be rendered inside Select.",
      );
      expect(() => render(<ComboboxInput aria-label="Search" />)).toThrow(
        "ComboboxInput must be rendered inside Combobox.",
      );
    } finally {
      consoleError.mockRestore();
    }

    const { container } = render(
      <Select id="plain-select">
        <SelectTrigger>Choose</SelectTrigger>
        <SelectPopover>
          <SelectOption value="pro">Pro</SelectOption>
        </SelectPopover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    expect(trigger.getAttribute("aria-controls")).toBe("plain-select-listbox");
    expect(container.querySelector("[role='listbox']")?.id).toBe("plain-select-listbox");
  });

  it("connects picker controls to descriptions and invalid errors", () => {
    const { container } = render(
      <>
        <Select id="described-select" invalid>
          <Label>Plan</Label>
          <Description>Choose one plan.</Description>
          <FieldError>A plan is required.</FieldError>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox id="described-combobox">
          <Label>City</Label>
          <Description>Start typing a city.</Description>
          <ComboboxInput />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
      </>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(trigger.getAttribute("aria-describedby")).toBe(
      "described-select-description described-select-error",
    );
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("described-combobox-description");
  });

  it("keeps disabled picker roots authoritative over every interactive part", () => {
    const selectChanged = vi.fn();
    const comboboxChanged = vi.fn();
    const { container } = render(
      <form>
        <Select disabled name="plan" onChange={selectChanged} defaultOpen>
          <SelectTrigger disabled={false}>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox disabled name="city" onChange={comboboxChanged} defaultOpen>
          <ComboboxInput aria-label="City" disabled={false} />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
      </form>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    expect(trigger.disabled).toBe(true);
    expect(input.disabled).toBe(true);
    expect([...options].every((option) => option.getAttribute("aria-disabled") === "true")).toBe(
      true,
    );
    fireClick(options[0]!);
    fireClick(options[1]!);

    expect(selectChanged).not.toHaveBeenCalled();
    expect(comboboxChanged).not.toHaveBeenCalled();
    expect(Array.from(new FormData(container.querySelector("form")!).entries())).toEqual([]);
  });

  it("keeps picker roots wrapper-free while supporting an explicit as wrapper", () => {
    const { container } = render(
      <>
        <Select id="plain-select">
          <SelectTrigger>Choose</SelectTrigger>
        </Select>
        <Combobox as="section" id="wrapped-combobox">
          <ComboboxInput aria-label="Search" />
        </Combobox>
      </>,
    );

    expect(container.querySelectorAll("div")).toHaveLength(0);
    expect(container.querySelector("section")?.id).toBe("wrapped-combobox");
    expect(container.querySelector("button")?.id).toBe("plain-select");
  });

  it("toggles select content and commits a keyboard selection", () => {
    const toggled = vi.fn();
    const { container } = render(
      <Select id="plan" defaultValue="free" onToggle={toggled}>
        <SelectTrigger>Plan</SelectTrigger>
        <SelectPopover>
          <SelectOption value="free">Free</SelectOption>
          <SelectOption value="pro">Pro</SelectOption>
        </SelectPopover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    expect(content.hidden).toBe(true);
    fireClick(trigger);
    expect(content.hidden).toBe(false);
    expect(toggled).toHaveBeenLastCalledWith(true);
    expect(document.activeElement?.textContent).toBe("Free");
    fireKeyDown(document.activeElement!, "ArrowDown");
    fireKeyDown(document.activeElement!, "Enter");

    expect(content.hidden).toBe(true);
    expect(container.querySelector("[data-value='pro']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("navigates labelled select opt groups and submits the selected option", () => {
    const { container } = render(
      <form>
        <Select name="size" defaultValue="medium">
          <SelectTrigger>Size</SelectTrigger>
          <SelectPopover>
            <SelectOptGroup label="Standard sizes">
              <SelectOption value="small">Small</SelectOption>
              <SelectOption value="medium">Medium</SelectOption>
            </SelectOptGroup>
            <SelectOptGroup label="Extended sizes">
              <SelectOption value="large">Large</SelectOption>
            </SelectOptGroup>
          </SelectPopover>
        </Select>
      </form>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const groups = container.querySelectorAll<HTMLElement>("[role='group']");

    expect([...groups].map((group) => group.getAttribute("aria-label"))).toEqual([
      "Standard sizes",
      "Extended sizes",
    ]);
    fireClick(trigger);
    expect(document.activeElement?.textContent).toBe("Medium");
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.textContent).toBe("Large");
    fireKeyDown(document.activeElement!, "Enter");

    expect(new FormData(container.querySelector("form")!).get("size")).toBe("large");
  });

  it("navigates labelled combobox opt groups and serializes a committed option", () => {
    const { container } = render(
      <form>
        <Combobox name="city">
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOptGroup label="Poland">
              <ComboboxOption value="krakow">Kraków</ComboboxOption>
            </ComboboxOptGroup>
            <ComboboxOptGroup label="Portugal">
              <ComboboxOption value="lisbon">Lisbon</ComboboxOption>
            </ComboboxOptGroup>
          </ComboboxPopover>
        </Combobox>
      </form>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const groups = container.querySelectorAll<HTMLElement>("[role='group']");

    expect([...groups].map((group) => group.getAttribute("aria-label"))).toEqual([
      "Poland",
      "Portugal",
    ]);
    fireKeyDown(input, "ArrowDown");
    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      container.querySelector<HTMLElement>("[data-value='lisbon']")?.id,
    );
    fireKeyDown(input, "Enter");

    expect(new FormData(container.querySelector("form")!).get("city")).toBe("lisbon");
  });

  it("preserves native combobox onChange and supports navigation and commit keys", () => {
    const changed = vi.fn();
    const inputChanged = vi.fn();
    const nativeChanged = vi.fn();
    const { container } = render(
      <Combobox id="framework" onChange={changed} onInputChange={inputChanged}>
        <ComboboxInput aria-label="Framework" onChange={nativeChanged} />
        <ComboboxTrigger />
        <ComboboxPopover>
          <ComboboxOption value="react" id="react-option">
            React
          </ComboboxOption>
          <ComboboxOption value="svelte" id="svelte-option">
            Svelte
          </ComboboxOption>
          <ComboboxOption value="vue" id="vue-option">
            Vue
          </ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const trigger = container.querySelector<HTMLButtonElement>("button[aria-haspopup='listbox']")!;

    expect(trigger.getAttribute("aria-controls")).toBe("framework-listbox");
    fireClick(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(input);

    fireInput(input, "r");
    expect(nativeChanged.mock.calls[0]?.[0].nativeEvent).toBeInstanceOf(Event);
    expect(inputChanged).toHaveBeenLastCalledWith("r");
    fireInput(input, "");
    fireKeyDown(input, "ArrowDown");
    fireKeyDown(input, "ArrowDown");
    fireKeyDown(input, "Home");
    fireKeyDown(input, "End");
    fireKeyDown(input, "Enter");

    expect(input.value).toBe("Vue");
    expect(changed).toHaveBeenLastCalledWith("vue");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    fireKeyDown(input, "Escape");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    fireKeyDown(input, "ArrowUp");
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });

  it("points aria-activedescendant at a mounted option despite a different logical value", () => {
    const { container } = render(
      <Combobox id="city" defaultValue="logical-value" allowsEmptyCollection>
        <ComboboxInput aria-label="City" />
        <ComboboxPopover>
          <ComboboxOption value="paris" id="mounted-paris">
            Paris
          </ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    fireKeyDown(input, "ArrowDown");

    expect(input.getAttribute("aria-activedescendant")).toBe("mounted-paris");
    expect(document.getElementById("mounted-paris")).not.toBeNull();
    expect(document.getElementById("mounted-paris")?.hasAttribute("data-active")).toBe(true);
    fireKeyDown(input, "Escape");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.getElementById("mounted-paris")?.hasAttribute("data-active")).toBe(false);
  });

  it("keeps generic ListBox and ListBoxItem selection functional", () => {
    const changed = vi.fn();
    const { container } = render(
      <ListBox aria-label="Libraries" onChange={changed}>
        <ListBoxItem id="react" value="react">
          React
        </ListBoxItem>
        <ListBoxItem id="solid" value="solid">
          Solid
        </ListBoxItem>
      </ListBox>,
    );
    const items = container.querySelectorAll<HTMLElement>("[role='option']");

    fireClick(items[1]!);
    expect(items[1]?.getAttribute("aria-selected")).toBe("true");
    expect(changed).toHaveBeenLastCalledWith("solid");
    fireKeyDown(items[1]!, "ArrowUp");
    expect(items[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("preserves explicit trigger labels and enforces required picker values", () => {
    const { container } = render(
      <form>
        <Select id="required-plan" name="plan" required>
          <SelectTrigger aria-label="Choose plan">+</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox id="required-city" name="city" required>
          <ComboboxInput aria-label="City" />
        </Combobox>
      </form>,
    );
    const form = container.querySelector("form")!;
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(trigger.getAttribute("aria-label")).toBe("Choose plan");
    expect(trigger.hasAttribute("aria-labelledby")).toBe(false);
    expect(input.required).toBe(true);
    expect(form.checkValidity()).toBe(false);

    fireClick(trigger);
    fireClick(container.querySelector<HTMLElement>("[role='option']")!);
    fireInput(input, "Warsaw");

    expect(form.checkValidity()).toBe(true);
    const data = new FormData(form);
    expect(data.get("plan")).toBe("pro");
    expect(data.get("city")).toBe("Warsaw");
  });

  it("treats an initial committed combobox value as a valid form value", () => {
    const { container } = render(
      <form>
        <Combobox id="initial-city" name="city" defaultValue="paris" required>
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(input.value).toBe("Paris");
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("city")).toBe("paris");
  });
});
