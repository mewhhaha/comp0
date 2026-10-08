import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { setup } from "../../test/render.js";
import { RangeSlider, type RangeSliderValue } from "./RangeSlider.js";
import { RangeSliderThumb } from "./RangeSliderThumb.js";
import { RangeSliderTrack } from "./RangeSliderTrack.js";

function renderRange(props: Partial<Parameters<typeof RangeSlider>[0]> = {}) {
  const result = setup(
    <RangeSlider aria-label="Price range" defaultValue={[20, 60]} {...props}>
      <RangeSliderTrack />
      <RangeSliderThumb thumb="start" aria-label="Minimum price" />
      <RangeSliderThumb thumb="end" aria-label="Maximum price" />
    </RangeSlider>,
  );
  const group = result.container.querySelector<HTMLElement>("[role='group']")!;
  const [startThumb, endThumb] = [
    ...result.container.querySelectorAll<HTMLElement>("[role='slider']"),
  ];
  return { ...result, group, startThumb: startThumb!, endThumb: endThumb! };
}

async function press(user: ReturnType<typeof setup>["user"], thumb: HTMLElement, key: string) {
  if (document.activeElement !== thumb) act(() => thumb.focus());
  await user.keyboard(`{${key}}`);
}

describe("range slider composition", () => {
  it("renders a named group with two sliders and interlocked bounds", async () => {
    const { group, startThumb, endThumb } = renderRange();

    expect(group.getAttribute("aria-label")).toBe("Price range");
    expect(group.getAttribute("data-orientation")).toBe("horizontal");
    expect(group.style.getPropertyValue("--comp0-range-slider-start")).toBe("0.2");
    expect(group.style.getPropertyValue("--comp0-range-slider-end")).toBe("0.6");

    expect(startThumb.tabIndex).toBe(0);
    expect(endThumb.tabIndex).toBe(0);
    expect(startThumb.getAttribute("aria-orientation")).toBe("horizontal");
    expect(startThumb.getAttribute("aria-valuenow")).toBe("20");
    expect(endThumb.getAttribute("aria-valuenow")).toBe("60");
    // The end thumb's minimum is the start value and vice versa.
    expect(startThumb.getAttribute("aria-valuemin")).toBe("0");
    expect(startThumb.getAttribute("aria-valuemax")).toBe("60");
    expect(endThumb.getAttribute("aria-valuemin")).toBe("20");
    expect(endThumb.getAttribute("aria-valuemax")).toBe("100");
    // No name: nothing submits.
    expect(group.querySelector("input")).toBeNull();
  });

  it("announces vertical orientation on the root and both thumbs", async () => {
    const { group, startThumb, endThumb } = renderRange({ orientation: "vertical" });

    expect(group.getAttribute("data-orientation")).toBe("vertical");
    expect(startThumb.getAttribute("aria-orientation")).toBe("vertical");
    expect(endThumb.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("moves the start thumb with arrows, PageUp/PageDown, Home, and End", async () => {
    const onChange = vi.fn();
    const { group, startThumb, endThumb, user } = renderRange({ onChange });

    await press(user, startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
    await press(user, startThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([22, 60]);
    await press(user, startThumb, "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
    await press(user, startThumb, "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    await press(user, startThumb, "PageUp");
    expect(onChange).toHaveBeenLastCalledWith([30, 60]);
    await press(user, startThumb, "PageDown");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    await press(user, startThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([0, 60]);
    // End takes the start thumb to its own bound: the end value.
    await press(user, startThumb, "End");
    expect(onChange).toHaveBeenLastCalledWith([60, 60]);
    expect(startThumb.getAttribute("aria-valuenow")).toBe("60");
    expect(endThumb.getAttribute("aria-valuemin")).toBe("60");
    expect(group.style.getPropertyValue("--comp0-range-slider-start")).toBe("0.6");
  });

  it("mirrors ArrowRight and ArrowLeft in a right-to-left layout", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <RangeSlider aria-label="Price range" defaultValue={[20, 60]} onChange={onChange}>
        <RangeSliderTrack />
        <RangeSliderThumb thumb="start" aria-label="Minimum price" style={{ direction: "rtl" }} />
        <RangeSliderThumb thumb="end" aria-label="Maximum price" />
      </RangeSlider>,
    );
    const startThumb = container.querySelector<HTMLElement>("[role='slider']")!;

    await press(user, startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([19, 60]);
    await press(user, startThumb, "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    await press(user, startThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
  });

  it("moves the end thumb between the start value and the maximum", async () => {
    const onChange = vi.fn();
    const { endThumb, user } = renderRange({ onChange });

    await press(user, endThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([20, 61]);
    await press(user, endThumb, "End");
    expect(onChange).toHaveBeenLastCalledWith([20, 100]);
    // Home takes the end thumb to its own bound: the start value.
    await press(user, endThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([20, 20]);
  });

  it("scales keyboard moves by step", async () => {
    const onChange = vi.fn();
    const { startThumb, user } = renderRange({ defaultValue: [20, 90], step: 5, onChange });

    await press(user, startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([25, 90]);
    await press(user, startThumb, "PageUp");
    expect(onChange).toHaveBeenLastCalledWith([75, 90]);
  });

  it("clamps each thumb at its sibling so the range cannot cross", async () => {
    const onChange = vi.fn();
    const { startThumb, endThumb, user } = renderRange({ defaultValue: [50, 52], onChange });

    await press(user, startThumb, "ArrowRight");
    await press(user, startThumb, "ArrowRight");
    await press(user, startThumb, "ArrowRight");
    expect(startThumb.getAttribute("aria-valuenow")).toBe("52");
    expect(onChange).toHaveBeenLastCalledWith([52, 52]);

    onChange.mockClear();
    await press(user, startThumb, "ArrowRight");
    // Already resting on the sibling: nothing changes, nothing fires.
    expect(onChange).not.toHaveBeenCalled();

    await press(user, startThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([0, 52]);
    await press(user, endThumb, "PageDown");
    // A ten-step jump still stops at the start thumb.
    await press(user, endThumb, "PageDown");
    await press(user, endThumb, "PageDown");
    await press(user, endThumb, "PageDown");
    await press(user, endThumb, "PageDown");
    await press(user, endThumb, "PageDown");
    expect(endThumb.getAttribute("aria-valuenow")).toBe("0");
    expect(endThumb.getAttribute("aria-valuemin")).toBe("0");
  });

  it("stays where the caller puts it when controlled", async () => {
    const onChange = vi.fn();
    const value: RangeSliderValue = [30, 70];
    const view = (next: RangeSliderValue) => (
      <RangeSlider aria-label="Price range" value={next} onChange={onChange}>
        <RangeSliderThumb thumb="start" aria-label="Minimum price" />
        <RangeSliderThumb thumb="end" aria-label="Maximum price" />
      </RangeSlider>
    );
    const { container, rerender, user } = setup(view(value));
    const startThumb = container.querySelector<HTMLElement>("[role='slider']")!;

    await press(user, startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([31, 70]);
    // Controlled: the DOM only moves when the caller feeds the value back.
    expect(startThumb.getAttribute("aria-valuenow")).toBe("30");

    rerender(view([31, 70]));
    expect(startThumb.getAttribute("aria-valuenow")).toBe("31");
  });

  it("submits the pair as name-start and name-end hidden inputs", async () => {
    const { group, startThumb, user } = renderRange({ name: "price" });
    const startInput = group.querySelector<HTMLInputElement>('input[name="price-start"]')!;
    const endInput = group.querySelector<HTMLInputElement>('input[name="price-end"]')!;

    expect(startInput.type).toBe("hidden");
    expect(endInput.type).toBe("hidden");
    expect(startInput.value).toBe("20");
    expect(endInput.value).toBe("60");

    await press(user, startThumb, "ArrowRight");
    expect(startInput.value).toBe("21");
    expect(endInput.value).toBe("60");
  });

  it("ignores the keyboard while disabled", async () => {
    const onChange = vi.fn();
    const { group, startThumb, user } = renderRange({ disabled: true, onChange });

    await press(user, startThumb, "ArrowRight");
    expect(onChange).not.toHaveBeenCalled();
    expect(group.hasAttribute("data-disabled")).toBe(true);
    expect(startThumb.getAttribute("aria-disabled")).toBe("true");
    expect(startThumb.hasAttribute("data-disabled")).toBe(true);
  });
});
