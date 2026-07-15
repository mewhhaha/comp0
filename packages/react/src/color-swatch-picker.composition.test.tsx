import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { ColorSwatch } from "./components/ColorSwatch.js";
import { ColorSwatchPicker } from "./components/ColorSwatchPicker.js";
import { ColorSwatchPickerItem } from "./components/ColorSwatchPickerItem.js";
import { Legend } from "./components/Legend.js";

describe("color swatch picker composition", () => {
  it("selects normalized colors through native radio inputs", () => {
    const onChange = vi.fn();
    const { container } = render(
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

    fireClick(radios[1]!);
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
    const selected = container.querySelector("[data-selected]")!;
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

  it("reports an invalid item color with the received value", () => {
    expect(() =>
      render(
        <ColorSwatchPicker>
          <ColorSwatchPickerItem color="blue" />
        </ColorSwatchPicker>,
      ),
    ).toThrow('ColorSwatchPickerItem color "blue" must be a hex color.');
  });
});
