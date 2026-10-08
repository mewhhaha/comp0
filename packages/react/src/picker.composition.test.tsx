import { describe, expect, it, vi } from "vitest";
import {
  Combobox,
  ComboboxPopover,
  ComboboxInput,
  ComboboxOption,
  Description,
  FieldError,
  Label,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
} from "./index.js";
import { render, setup } from "../test/render.js";

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

  it("keeps disabled picker roots authoritative over every interactive part", async () => {
    const selectChanged = vi.fn();
    const comboboxChanged = vi.fn();
    const { container, user } = setup(
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
    await user.click(options[0]!);
    await user.click(options[1]!);

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

  it("preserves explicit trigger labels and enforces required picker values", async () => {
    const { container, user } = setup(
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

    await user.click(trigger);
    await user.click(container.querySelector<HTMLElement>("[role='option']")!);
    await user.type(input, "Warsaw");

    expect(form.checkValidity()).toBe(true);
    const data = new FormData(form);
    expect(data.get("plan")).toBe("pro");
    expect(data.get("city")).toBe("Warsaw");
  });

  it("names a popover by its label only when a label is rendered", () => {
    const { container } = render(
      <>
        <Select id="labelled-select">
          <Label>Plan</Label>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Select id="unlabelled-select">
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox id="unlabelled-combobox">
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
      </>,
    );
    const lists = container.querySelectorAll<HTMLElement>("[role='listbox']");

    expect(lists[0]?.getAttribute("aria-labelledby")).toBe("labelled-select-label");
    expect(lists[1]?.getAttribute("aria-labelledby")).toBe("unlabelled-select");
    expect(lists[2]?.getAttribute("aria-labelledby")).toBe("unlabelled-combobox");
    for (const list of lists) {
      for (const id of list.getAttribute("aria-labelledby")!.split(" ")) {
        expect(document.getElementById(id), `${id} is rendered`).not.toBeNull();
      }
    }
  });
});
