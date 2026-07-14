import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { ColorArea } from "./components/ColorArea.js";
import { ColorAreaThumb } from "./components/ColorAreaThumb.js";
import { ColorPicker } from "./components/ColorPicker.js";
import { ColorPickerInput } from "./components/ColorPickerInput.js";
import { ColorPickerPopover } from "./components/ColorPickerPopover.js";
import { ColorPickerTrigger } from "./components/ColorPickerTrigger.js";
import { ColorPickerValue } from "./components/ColorPickerValue.js";
import { ColorSlider } from "./components/ColorSlider.js";
import { ColorSwatch } from "./components/ColorSwatch.js";
import { Label } from "./components/Label.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function renderPicker(onChange = vi.fn()) {
  const result = render(
    <form>
      <ColorPicker as="div" id="accent" name="accent" defaultValue="#f00" onChange={onChange}>
        <Label>Accent color</Label>
        <ColorPickerTrigger>
          <ColorSwatch />
          <ColorPickerValue />
        </ColorPickerTrigger>
        <ColorPickerPopover>
          <ColorArea>
            <ColorAreaThumb />
          </ColorArea>
          <ColorSlider channel="hue" />
          <ColorPickerInput />
        </ColorPickerPopover>
      </ColorPicker>
    </form>,
  );
  return { ...result, onChange };
}

describe("color picker composition", () => {
  it("connects the field label, trigger, popover, displayed value, and form value", () => {
    const { container } = renderPicker();
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const popover = container.querySelector<HTMLElement>("[role='dialog']")!;
    const swatch = container.querySelector<HTMLElement>("span[data-value]")!;

    expect(container.querySelector("label")?.htmlFor).toBe("accent");
    expect(trigger.id).toBe("accent");
    expect(container.querySelectorAll("#accent")).toHaveLength(1);
    expect(trigger.getAttribute("aria-label")).toBe("Choose color");
    expect(trigger.getAttribute("aria-controls")).toBe(popover.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(container.textContent).toContain("#ff0000");
    expect(new FormData(container.querySelector("form")!).get("accent")).toBe("#ff0000");

    fireClick(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(popover.hidden).toBe(false);
    expect(document.activeElement?.getAttribute("data-color-area-input")).toBe("saturation");
  });

  it("exposes the color area as two native range inputs controlling one thumb", () => {
    const { container, onChange } = renderPicker();
    fireClick(container.querySelector("button")!);
    const saturation = container.querySelector<HTMLInputElement>(
      "[data-color-area-input='saturation']",
    )!;
    const brightness = container.querySelector<HTMLInputElement>(
      "[data-color-area-input='brightness']",
    )!;
    const thumb = container.querySelector<HTMLElement>("[aria-hidden='true'][style*='left']")!;

    expect(saturation.type).toBe("range");
    expect(saturation.getAttribute("aria-roledescription")).toBe("2D slider");
    expect(saturation.getAttribute("aria-valuetext")).toContain("Saturation: 100%");
    expect(brightness.getAttribute("aria-orientation")).toBe("vertical");

    fireInput(saturation, "50");
    expect(onChange).toHaveBeenLastCalledWith("#ff8080");
    expect(thumb.style.left).toBe("50%");
    expect(thumb.style.top).toBe("0%");
  });

  it("changes hue with a native slider and preserves the other color channels", () => {
    const { container, onChange } = renderPicker();
    fireClick(container.querySelector("button")!);
    const hue = container.querySelector<HTMLInputElement>("[data-channel='hue']")!;

    expect(hue.type).toBe("range");
    expect(hue.getAttribute("aria-valuetext")).toBe("0 degrees");
    fireInput(hue, "120");
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
    expect(hue.getAttribute("aria-valuetext")).toBe("120 degrees");
  });

  it("preserves hue and saturation while the selected color is black", () => {
    const { container, onChange } = renderPicker();
    fireClick(container.querySelector("button")!);
    const brightness = container.querySelector<HTMLInputElement>(
      "[data-color-area-input='brightness']",
    )!;
    const hue = container.querySelector<HTMLInputElement>("[data-channel='hue']")!;

    fireInput(brightness, "0");
    expect(onChange).toHaveBeenLastCalledWith("#000000");
    fireInput(hue, "120");
    fireInput(brightness, "100");
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
  });

  it("keeps partial hex input editable and reports malformed input on commit", () => {
    const { container, onChange } = renderPicker();
    fireClick(container.querySelector("button")!);
    const input = container.querySelector<HTMLInputElement>("input[type='text']")!;

    act(() => input.focus());
    fireInput(input, "#12");
    expect(input.value).toBe("#12");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    fireKeyDown(input, "Enter");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireInput(input, "#0d9488");
    expect(onChange).toHaveBeenLastCalledWith("#0d9488");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("replaces an invalid blurred draft when another control changes the color", () => {
    const { container } = renderPicker();
    fireClick(container.querySelector("button")!);
    const input = container.querySelector<HTMLInputElement>("input[type='text']")!;
    const hue = container.querySelector<HTMLInputElement>("[data-channel='hue']")!;

    act(() => input.focus());
    fireInput(input, "not-a-color");
    act(() => input.blur());
    expect(input.getAttribute("aria-invalid")).toBe("true");

    fireInput(hue, "120");
    expect(input.value).toBe("#00ff00");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("keeps a controlled value until its owner accepts a color change", () => {
    const changed = vi.fn();
    const { container, rerender } = render(
      <ColorPicker value="#ff0000" onChange={changed}>
        <ColorPickerValue />
        <ColorSlider channel="hue" />
      </ColorPicker>,
    );
    const slider = container.querySelector<HTMLInputElement>("input")!;

    fireInput(slider, "120");
    expect(changed).toHaveBeenLastCalledWith("#00ff00");
    expect(container.textContent).toBe("#ff0000");

    rerender(
      <ColorPicker value="#00ff00" onChange={changed}>
        <ColorPickerValue />
        <ColorSlider channel="hue" />
      </ColorPicker>,
    );
    expect(container.textContent).toBe("#00ff00");
  });

  it("disables every interactive picker part from the root", () => {
    const { container } = render(
      <ColorPicker disabled defaultOpen>
        <ColorPickerTrigger />
        <ColorPickerPopover>
          <ColorArea />
          <ColorSlider channel="hue" />
          <ColorPickerInput />
        </ColorPickerPopover>
      </ColorPicker>,
    );

    expect(container.querySelector("button")?.disabled).toBe(true);
    expect([...container.querySelectorAll("input")].every((input) => input.disabled)).toBe(true);
  });

  it("omits the named value from form data while disabled", () => {
    const { container } = render(
      <form>
        <ColorPicker name="accent" defaultValue="#0d9488" disabled>
          <ColorPickerValue />
        </ColorPicker>
      </form>,
    );

    expect(new FormData(container.querySelector("form")!).has("accent")).toBe(false);
  });
});
