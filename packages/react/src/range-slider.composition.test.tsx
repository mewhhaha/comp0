import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { RangeSlider, type RangeSliderValue } from "./components/RangeSlider.js";
import { RangeSliderThumb } from "./components/RangeSliderThumb.js";
import { RangeSliderTrack } from "./components/RangeSliderTrack.js";

function renderRange(props: Partial<Parameters<typeof RangeSlider>[0]> = {}) {
  const result = render(
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

describe("range slider composition", () => {
  it("renders a named group with two sliders and interlocked bounds", () => {
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

  it("announces vertical orientation on the root and both thumbs", () => {
    const { group, startThumb, endThumb } = renderRange({ orientation: "vertical" });

    expect(group.getAttribute("data-orientation")).toBe("vertical");
    expect(startThumb.getAttribute("aria-orientation")).toBe("vertical");
    expect(endThumb.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("moves the start thumb with arrows, PageUp/PageDown, Home, and End", () => {
    const onChange = vi.fn();
    const { group, startThumb, endThumb } = renderRange({ onChange });

    fireKeyDown(startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
    fireKeyDown(startThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([22, 60]);
    fireKeyDown(startThumb, "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
    fireKeyDown(startThumb, "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    fireKeyDown(startThumb, "PageUp");
    expect(onChange).toHaveBeenLastCalledWith([30, 60]);
    fireKeyDown(startThumb, "PageDown");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    fireKeyDown(startThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([0, 60]);
    // End takes the start thumb to its own bound: the end value.
    fireKeyDown(startThumb, "End");
    expect(onChange).toHaveBeenLastCalledWith([60, 60]);
    expect(startThumb.getAttribute("aria-valuenow")).toBe("60");
    expect(endThumb.getAttribute("aria-valuemin")).toBe("60");
    expect(group.style.getPropertyValue("--comp0-range-slider-start")).toBe("0.6");
  });

  it("mirrors ArrowRight and ArrowLeft in a right-to-left layout", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider aria-label="Price range" defaultValue={[20, 60]} onChange={onChange}>
        <RangeSliderTrack />
        <RangeSliderThumb thumb="start" aria-label="Minimum price" style={{ direction: "rtl" }} />
        <RangeSliderThumb thumb="end" aria-label="Maximum price" />
      </RangeSlider>,
    );
    const startThumb = container.querySelector<HTMLElement>("[role='slider']")!;

    fireKeyDown(startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([19, 60]);
    fireKeyDown(startThumb, "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith([20, 60]);
    fireKeyDown(startThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([21, 60]);
  });

  it("moves the end thumb between the start value and the maximum", () => {
    const onChange = vi.fn();
    const { endThumb } = renderRange({ onChange });

    fireKeyDown(endThumb, "ArrowUp");
    expect(onChange).toHaveBeenLastCalledWith([20, 61]);
    fireKeyDown(endThumb, "End");
    expect(onChange).toHaveBeenLastCalledWith([20, 100]);
    // Home takes the end thumb to its own bound: the start value.
    fireKeyDown(endThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([20, 20]);
  });

  it("scales keyboard moves by step", () => {
    const onChange = vi.fn();
    const { startThumb } = renderRange({ defaultValue: [20, 90], step: 5, onChange });

    fireKeyDown(startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([25, 90]);
    fireKeyDown(startThumb, "PageUp");
    expect(onChange).toHaveBeenLastCalledWith([75, 90]);
  });

  it("clamps each thumb at its sibling so the range cannot cross", () => {
    const onChange = vi.fn();
    const { startThumb, endThumb } = renderRange({ defaultValue: [50, 52], onChange });

    fireKeyDown(startThumb, "ArrowRight");
    fireKeyDown(startThumb, "ArrowRight");
    fireKeyDown(startThumb, "ArrowRight");
    expect(startThumb.getAttribute("aria-valuenow")).toBe("52");
    expect(onChange).toHaveBeenLastCalledWith([52, 52]);

    onChange.mockClear();
    fireKeyDown(startThumb, "ArrowRight");
    // Already resting on the sibling: nothing changes, nothing fires.
    expect(onChange).not.toHaveBeenCalled();

    fireKeyDown(startThumb, "Home");
    expect(onChange).toHaveBeenLastCalledWith([0, 52]);
    fireKeyDown(endThumb, "PageDown");
    // A ten-step jump still stops at the start thumb.
    fireKeyDown(endThumb, "PageDown");
    fireKeyDown(endThumb, "PageDown");
    fireKeyDown(endThumb, "PageDown");
    fireKeyDown(endThumb, "PageDown");
    fireKeyDown(endThumb, "PageDown");
    expect(endThumb.getAttribute("aria-valuenow")).toBe("0");
    expect(endThumb.getAttribute("aria-valuemin")).toBe("0");
  });

  it("stays where the caller puts it when controlled", () => {
    const onChange = vi.fn();
    const value: RangeSliderValue = [30, 70];
    const view = (next: RangeSliderValue) => (
      <RangeSlider aria-label="Price range" value={next} onChange={onChange}>
        <RangeSliderThumb thumb="start" aria-label="Minimum price" />
        <RangeSliderThumb thumb="end" aria-label="Maximum price" />
      </RangeSlider>
    );
    const { container, rerender } = render(view(value));
    const startThumb = container.querySelector<HTMLElement>("[role='slider']")!;

    fireKeyDown(startThumb, "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith([31, 70]);
    // Controlled: the DOM only moves when the caller feeds the value back.
    expect(startThumb.getAttribute("aria-valuenow")).toBe("30");

    rerender(view([31, 70]));
    expect(startThumb.getAttribute("aria-valuenow")).toBe("31");
  });

  it("submits the pair as name-start and name-end hidden inputs", () => {
    const { group, startThumb } = renderRange({ name: "price" });
    const startInput = group.querySelector<HTMLInputElement>('input[name="price-start"]')!;
    const endInput = group.querySelector<HTMLInputElement>('input[name="price-end"]')!;

    expect(startInput.type).toBe("hidden");
    expect(endInput.type).toBe("hidden");
    expect(startInput.value).toBe("20");
    expect(endInput.value).toBe("60");

    fireKeyDown(startThumb, "ArrowRight");
    expect(startInput.value).toBe("21");
    expect(endInput.value).toBe("60");
  });

  it("ignores the keyboard while disabled", () => {
    const onChange = vi.fn();
    const { group, startThumb } = renderRange({ disabled: true, onChange });

    fireKeyDown(startThumb, "ArrowRight");
    expect(onChange).not.toHaveBeenCalled();
    expect(group.hasAttribute("data-disabled")).toBe(true);
    expect(startThumb.getAttribute("aria-disabled")).toBe("true");
    expect(startThumb.hasAttribute("data-disabled")).toBe(true);
  });
});
