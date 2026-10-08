import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { ColorSwatch } from "../color-picker/ColorSwatch.js";
import { ColorSwatchPicker } from "./ColorSwatchPicker.js";
import { ColorSwatchPickerItem } from "./ColorSwatchPickerItem.js";
import { Legend } from "../field/Legend.js";

describe("color swatch picker composition", () => {
  it("selects normalized colors through native radio inputs", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <ColorSwatchPicker name="accent" defaultValue="#f00" onChange={onChange}>
        <Legend>Accent</Legend>
        <ColorSwatchPickerItem color="#f00" aria-label="Red" />
        <ColorSwatchPickerItem color="#00ff00" aria-label="Green" />
      </ColorSwatchPicker>,
    );
    const radios = [...container.querySelectorAll<HTMLInputElement>("input[type='radio']")];
    expect(radios[0]!.checked).toBe(true);
    expect(radios[0]!.value).toBe("#ff0000");
    expect(radios[1]!.getAttribute("aria-label")).toBe("Green");

    await user.click(radios[1]!);
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
    expect(radios[1]!.checked).toBe(true);
  });

  it("submits one selected color and exposes selection styling state", () => {
    const { container } = render(
      <form>
        <ColorSwatchPicker name="accent" defaultValue="#2563eb">
          <ColorSwatchPickerItem color="#2563eb">Blue</ColorSwatchPickerItem>
          <ColorSwatchPickerItem color="#dc2626">Red</ColorSwatchPickerItem>
        </ColorSwatchPicker>
      </form>,
    );
    const selected = container.querySelector("[data-checked]")!;
    expect(selected.getAttribute("data-value")).toBe("#2563eb");
    expect(new FormData(container.querySelector("form")!).get("accent")).toBe("#2563eb");
  });

  it("renders a presentational swatch outside ColorPicker when given a color", () => {
    const { container } = render(<ColorSwatch color="#abc" />);
    const swatch = container.querySelector("span")!;
    expect(swatch.dataset["value"]).toBe("#aabbcc");
    expect(swatch.getAttribute("aria-hidden")).toBe("true");
  });

  it("supports a controlled picker with no selected color", () => {
    const { container } = render(
      <ColorSwatchPicker value="">
        <ColorSwatchPickerItem color="#2563eb">Blue</ColorSwatchPickerItem>
      </ColorSwatchPicker>,
    );
    expect(container.querySelector<HTMLInputElement>("input")?.checked).toBe(false);
  });

  it("warns about and skips an item with an invalid color", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <ColorSwatchPicker>
        <ColorSwatchPickerItem color="blue" />
        <ColorSwatchPickerItem color="#2563eb">Blue</ColorSwatchPickerItem>
      </ColorSwatchPicker>,
    );

    expect(error).toHaveBeenCalledWith(
      'ColorSwatchPickerItem color "blue" must be a three- or six-digit hex color. It was ignored.',
    );
    expect(container.querySelectorAll("input[type='radio']")).toHaveLength(1);
    error.mockRestore();
  });

  it("warns about an invalid value and leaves the group without a selection", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <ColorSwatchPicker defaultValue="not-a-hex">
        <ColorSwatchPickerItem color="#2563eb">Blue</ColorSwatchPickerItem>
      </ColorSwatchPicker>,
    );

    expect(error).toHaveBeenCalledWith(
      'ColorSwatchPicker defaultValue "not-a-hex" must be a three- or six-digit hex color. It was ignored.',
    );
    expect(container.querySelector<HTMLInputElement>("input")?.checked).toBe(false);
    error.mockRestore();
  });
});
