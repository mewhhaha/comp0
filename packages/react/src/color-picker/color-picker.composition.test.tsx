import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { ColorArea } from "./ColorArea.js";
import { ColorAreaThumb } from "./ColorAreaThumb.js";
import { ColorPicker } from "./ColorPicker.js";
import { ColorPickerInput } from "./ColorPickerInput.js";
import { ColorPickerPopover } from "./ColorPickerPopover.js";
import { ColorPickerTrigger } from "./ColorPickerTrigger.js";
import { ColorPickerValue } from "./ColorPickerValue.js";
import { ColorSlider } from "./ColorSlider.js";
import { ColorSwatch } from "./ColorSwatch.js";
import { Label } from "../field/Label.js";

// userEvent cannot drag a range input, so sliders are set in one input event.
function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function renderPicker(onChange = vi.fn()) {
  const result = setup(
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
  it("connects the field label, trigger, popover, displayed value, and form value", async () => {
    const { container, user } = renderPicker();
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

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(popover.hidden).toBe(false);
    expect(document.activeElement?.getAttribute("data-color-area-input")).toBe("saturation");
  });

  it("exposes the color area as two native range inputs controlling one thumb", async () => {
    const { container, onChange, user } = renderPicker();
    await user.click(container.querySelector("button")!);
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

  it("changes hue with a native slider and preserves the other color channels", async () => {
    const { container, onChange, user } = renderPicker();
    await user.click(container.querySelector("button")!);
    const hue = container.querySelector<HTMLInputElement>("[data-channel='hue']")!;

    expect(hue.type).toBe("range");
    expect(hue.getAttribute("aria-valuetext")).toBe("0 degrees");
    fireInput(hue, "120");
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
    expect(hue.getAttribute("aria-valuetext")).toBe("120 degrees");
  });

  it("preserves hue and saturation while the selected color is black", async () => {
    const { container, onChange, user } = renderPicker();
    await user.click(container.querySelector("button")!);
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

  it("keeps partial hex input editable and reports malformed input on commit", async () => {
    const { container, onChange, user } = renderPicker();
    await user.click(container.querySelector("button")!);
    const input = container.querySelector<HTMLInputElement>("input[type='text']")!;

    await user.click(input);
    await user.clear(input);
    await user.type(input, "#12");
    expect(input.value).toBe("#12");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard("{Enter}");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await user.clear(input);
    await user.type(input, "#0d9488");
    expect(onChange).toHaveBeenLastCalledWith("#0d9488");
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("replaces an invalid blurred draft when another control changes the color", async () => {
    const { container, user } = renderPicker();
    await user.click(container.querySelector("button")!);
    const input = container.querySelector<HTMLInputElement>("input[type='text']")!;
    const hue = container.querySelector<HTMLInputElement>("[data-channel='hue']")!;

    await user.click(input);
    await user.clear(input);
    await user.type(input, "not-a-color");
    await user.tab();
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

describe("color picker validation", () => {
  it("warns about an invalid default value and falls back to black", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <ColorPicker defaultValue="chartreuse">
        <ColorPickerValue />
      </ColorPicker>,
    );

    expect(error).toHaveBeenCalledWith(
      'ColorPicker defaultValue "chartreuse" must be a three- or six-digit hex color. It was ignored.',
    );
    expect(container.textContent).toBe("#000000");
    error.mockRestore();
  });

  it("warns about an invalid controlled value and keeps the last valid color", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <ColorPicker value="#12" defaultValue="#0d9488">
        <ColorPickerValue />
      </ColorPicker>,
    );

    expect(error).toHaveBeenCalledWith(
      'ColorPicker value "#12" must be a three- or six-digit hex color. It was ignored.',
    );
    expect(container.textContent).toBe("#0d9488");
    error.mockRestore();
  });

  it("reports open state changes through onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const { container, user } = setup(
      <ColorPicker onOpenChange={onOpenChange}>
        <ColorPickerTrigger />
        <ColorPickerPopover>
          <ColorSlider channel="hue" />
        </ColorPickerPopover>
      </ColorPicker>,
    );

    await user.click(container.querySelector("button")!);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
