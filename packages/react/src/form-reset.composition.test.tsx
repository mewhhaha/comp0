import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import {
  Checkbox,
  CheckboxGroup,
  ColorPicker,
  ColorPickerInput,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxPopover,
  Input,
  NumberField,
  NumberFieldInput,
  PinInput,
  PinInputField,
  Radio,
  RadioGroup,
  SearchField,
  SearchFieldClear,
  SearchFieldInput,
  Select,
  SelectOption,
  SelectPopover,
  Slider,
  RangeSlider,
  RangeSliderThumb,
  RangeSliderTrack,
  TextField,
} from "./index.js";

async function reset(form: HTMLFormElement) {
  await act(async () => {
    form.reset();
    await Promise.resolve();
  });
}

describe("form reset behavior", () => {
  it("restores uncontrolled text and search fields without reporting a change", async () => {
    const textChanged = vi.fn();
    const searchChanged = vi.fn();
    const { container } = render(
      <form>
        <TextField defaultValue="Ada" onChange={textChanged}>
          <Input name="name" />
        </TextField>
        <SearchField defaultValue="compiler" onChange={searchChanged}>
          <SearchFieldInput name="query" />
          <SearchFieldClear>Clear</SearchFieldClear>
        </SearchField>
      </form>,
    );
    const [textInput, searchInput] = container.querySelectorAll<HTMLInputElement>("input");

    act(() => {
      textInput!.value = "Grace";
      textInput!.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput!.value = "React";
      searchInput!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelector("button")).not.toBeNull();

    textChanged.mockClear();
    searchChanged.mockClear();
    await reset(container.querySelector("form")!);

    expect(textInput!.value).toBe("Ada");
    expect(searchInput!.value).toBe("compiler");
    expect(textChanged).not.toHaveBeenCalled();
    expect(searchChanged).not.toHaveBeenCalled();
  });

  it("does not reset controlled text fields", async () => {
    const { container } = render(
      <form>
        <TextField value="controlled" onChange={() => undefined}>
          <Input />
        </TextField>
      </form>,
    );
    const input = container.querySelector("input")!;

    await reset(container.querySelector("form")!);

    expect(input.value).toBe("controlled");
  });

  it("restores standalone checkbox and same-name radio state", async () => {
    const { container } = render(
      <form>
        <Checkbox name="alerts" defaultChecked>
          Alerts
        </Checkbox>
        <Radio name="density" value="comfortable" defaultChecked>
          Comfortable
        </Radio>
        <Radio name="density" value="compact">
          Compact
        </Radio>
      </form>,
    );
    const [checkbox, comfortable, compact] = container.querySelectorAll<HTMLInputElement>("input");

    act(() => {
      checkbox!.click();
      compact!.click();
    });
    expect(comfortable!.closest("label")!.hasAttribute("data-selected")).toBe(false);
    expect(compact!.closest("label")!.hasAttribute("data-selected")).toBe(true);

    await reset(container.querySelector("form")!);

    expect(checkbox!.checked).toBe(true);
    expect(comfortable!.checked).toBe(true);
    expect(compact!.checked).toBe(false);
    expect(comfortable!.closest("label")!.hasAttribute("data-selected")).toBe(true);
    expect(compact!.closest("label")!.hasAttribute("data-selected")).toBe(false);
  });

  it("enforces required choice groups and restores their initial values", async () => {
    const { container } = render(
      <form>
        <CheckboxGroup name="topics" defaultValue={["news"]} required>
          <Checkbox value="news">News</Checkbox>
          <Checkbox value="events">Events</Checkbox>
        </CheckboxGroup>
        <RadioGroup name="plan" defaultValue="free" required>
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
      </form>,
    );
    const form = container.querySelector("form")!;
    const checkboxControls = container.querySelectorAll<HTMLInputElement>(
      "input[data-checkbox-group-control]",
    );
    const radioControls = container.querySelectorAll<HTMLInputElement>("input[type=radio]");

    expect(form.checkValidity()).toBe(true);
    expect([...radioControls].every((radio) => radio.required)).toBe(true);
    act(() => {
      checkboxControls[0]!.click();
    });
    expect(form.checkValidity()).toBe(false);
    act(() => {
      checkboxControls[1]!.click();
      radioControls[1]!.click();
    });
    expect(form.checkValidity()).toBe(true);

    await reset(form);

    expect(checkboxControls[0]!.checked).toBe(true);
    expect(checkboxControls[1]!.checked).toBe(false);
    expect(radioControls[0]!.checked).toBe(true);
    expect(radioControls[1]!.checked).toBe(false);
  });

  it("restores the initial number field value", async () => {
    const { container } = render(
      <form>
        <NumberField name="guests" defaultValue={2}>
          <NumberFieldInput />
        </NumberField>
      </form>,
    );
    const input = container.querySelector("input")!;

    act(() => {
      input.value = "5";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await reset(container.querySelector("form")!);

    expect(input.value).toBe("2");
  });

  it("restores uncontrolled picker and range values", async () => {
    const { container } = render(
      <form>
        <Select name="plan" defaultValue="free">
          <SelectPopover>
            <SelectOption value="free">Free</SelectOption>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox name="city" defaultValue="paris" defaultInputValue="Paris" allowsEmptyCollection>
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
            <ComboboxOption value="warsaw">Warsaw</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
        <Slider name="volume" defaultValue={25} />
        <RangeSlider name="price" defaultValue={[20, 80]}>
          <RangeSliderTrack />
          <RangeSliderThumb thumb="start" aria-label="Minimum" />
          <RangeSliderThumb thumb="end" aria-label="Maximum" />
        </RangeSlider>
        <PinInput name="code" defaultValue="12">
          <PinInputField aria-label="Digit 1" />
          <PinInputField aria-label="Digit 2" />
        </PinInput>
        <ColorPicker name="accent" defaultValue="#112233">
          <ColorPickerInput />
        </ColorPicker>
      </form>,
    );
    const form = container.querySelector("form")!;

    act(() => {
      container.querySelector<HTMLElement>("[role='option'][data-value='pro']")!.click();
      container.querySelector<HTMLElement>("[role='option'][data-value='warsaw']")!.click();
      const slider = container.querySelector<HTMLInputElement>("input[type='range']")!;
      slider.value = "60";
      slider.dispatchEvent(new Event("change", { bubbles: true }));
      const startThumb = container.querySelector<HTMLElement>("[data-thumb='start']")!;
      startThumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      const pinFields = container.querySelectorAll<HTMLInputElement>("input[autocomplete]");
      pinFields[0]!.value = "9";
      pinFields[0]!.dispatchEvent(new Event("input", { bubbles: true }));
      const color = container.querySelector<HTMLInputElement>("[aria-label='Hex color']")!;
      color.value = "#abcdef";
      color.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await reset(form);
    const values = new FormData(form);
    expect(values.get("plan")).toBe("free");
    expect(values.get("city")).toBe("paris");
    expect(values.get("volume")).toBe("25");
    expect(values.get("price-start")).toBe("20");
    expect(values.get("price-end")).toBe("80");
    expect(values.get("code")).toBe("12");
    expect(values.get("accent")).toBe("#112233");
  });
});
