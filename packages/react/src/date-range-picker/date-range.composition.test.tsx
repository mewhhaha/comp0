import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Label } from "../field/Label.js";
import { CalendarHeader } from "../calendar/CalendarHeader.js";
import { CalendarNextButton } from "../calendar/CalendarNextButton.js";
import { CalendarPreviousButton } from "../calendar/CalendarPreviousButton.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { DateRangePickerEndField } from "./DateRangePickerEndField.js";
import { DateRangePickerPopover } from "./DateRangePickerPopover.js";
import { DateRangePickerStartField } from "./DateRangePickerStartField.js";
import { DateRangePickerTrigger } from "./DateRangePickerTrigger.js";
import { RangeCalendar } from "../range-calendar/RangeCalendar.js";
import { RangeCalendarGrid } from "../range-calendar/RangeCalendarGrid.js";
import { render, setup } from "../../test/render.js";

// A controlled date input restores its value after every keystroke, so userEvent
// can never type a complete date into it; set the whole value in one input event.
function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function dayButton(container: HTMLElement, iso: string) {
  return container.querySelector<HTMLButtonElement>(`td[data-value='${iso}'] button`)!;
}

describe("range calendar", () => {
  it("marks the endpoints and interior of a selected range", async () => {
    const { container } = render(
      <RangeCalendar defaultValue={["2024-02-12", "2024-02-15"]} locale="en-GB">
        <CalendarHeader />
        <RangeCalendarGrid />
      </RangeCalendar>,
    );

    const start = container.querySelector("td[data-value='2024-02-12']")!;
    const interior = container.querySelector("td[data-value='2024-02-13']")!;
    const end = container.querySelector("td[data-value='2024-02-15']")!;
    const outside = container.querySelector("td[data-value='2024-02-16']")!;
    expect(container.querySelector("[role='grid']")?.getAttribute("aria-multiselectable")).toBe(
      "true",
    );
    expect(start.hasAttribute("data-range-start")).toBe(true);
    expect(start.getAttribute("aria-selected")).toBe("true");
    expect(interior.hasAttribute("data-in-range")).toBe(true);
    expect(interior.getAttribute("aria-selected")).toBe("true");
    expect(end.hasAttribute("data-range-end")).toBe(true);
    expect(end.getAttribute("aria-selected")).toBe("true");
    expect(outside.hasAttribute("aria-selected")).toBe(false);
    expect(dayButton(container, "2024-02-15").tabIndex).toBe(0);
  });

  it("starts a new range after a completed one and orders a backwards second selection", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <RangeCalendar defaultValue={["2024-02-12", "2024-02-15"]} locale="en-GB" onChange={onChange}>
        <RangeCalendarGrid />
      </RangeCalendar>,
    );

    await user.click(dayButton(container, "2024-02-20"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-20", ""]);
    expect(
      container.querySelector("td[data-value='2024-02-20']")?.hasAttribute("data-range-start"),
    ).toBe(true);
    expect(container.querySelectorAll("td[data-in-range]")).toHaveLength(0);

    await user.click(dayButton(container, "2024-02-18"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-18", "2024-02-20"]);
    expect(
      container.querySelector("td[data-value='2024-02-18']")?.hasAttribute("data-range-start"),
    ).toBe(true);
    expect(
      container.querySelector("td[data-value='2024-02-19']")?.hasAttribute("data-in-range"),
    ).toBe(true);
    expect(
      container.querySelector("td[data-value='2024-02-20']")?.hasAttribute("data-range-end"),
    ).toBe(true);
  });

  it("previews an incomplete range toward the hovered date and clears after pointer exit", async () => {
    const { container } = render(
      <RangeCalendar defaultValue={["2024-02-12", ""]} locale="en-GB">
        <RangeCalendarGrid />
      </RangeCalendar>,
    );
    const previewEnd = dayButton(container, "2024-02-15");

    act(() => {
      previewEnd.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
    });
    expect(container.querySelectorAll("td[data-range-preview]")).toHaveLength(4);
    expect(
      container.querySelector("td[data-value='2024-02-13']")?.hasAttribute("data-range-preview"),
    ).toBe(true);
    expect(previewEnd.hasAttribute("data-range-preview")).toBe(true);

    act(() => {
      previewEnd.dispatchEvent(new MouseEvent("pointerout", { bubbles: true }));
    });
    expect(container.querySelectorAll("td[data-range-preview]")).toHaveLength(0);
  });

  it("orders a backwards range preview chronologically", async () => {
    const { container } = render(
      <RangeCalendar defaultValue={["2024-02-15", ""]} locale="en-GB">
        <RangeCalendarGrid />
      </RangeCalendar>,
    );

    act(() => {
      dayButton(container, "2024-02-12").dispatchEvent(
        new MouseEvent("pointerover", { bubbles: true }),
      );
    });

    expect(container.querySelectorAll("td[data-range-preview]")).toHaveLength(4);
    expect(
      container.querySelector("td[data-value='2024-02-12']")?.hasAttribute("data-range-preview"),
    ).toBe(true);
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.hasAttribute("data-range-preview"),
    ).toBe(true);
  });

  it("uses the calendar grid keyboard contract and respects controlled state", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(
      <RangeCalendar value={["2024-02-12", "2024-02-15"]} locale="en-GB" onChange={onChange}>
        <RangeCalendarGrid />
      </RangeCalendar>,
    );
    const end = dayButton(container, "2024-02-15");
    act(() => {
      end.focus();
    });

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-16"));
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenLastCalledWith(["2024-02-16", ""]);
    expect(
      container.querySelector("td[data-value='2024-02-12']")?.hasAttribute("data-range-start"),
    ).toBe(true);
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.hasAttribute("data-range-end"),
    ).toBe(true);
  });
});

describe("date range picker composition", () => {
  function renderPicker(props: { onOpenChange?: (open: boolean) => void } = {}) {
    const onChange = vi.fn();
    const result = setup(
      <DateRangePicker
        id="trip"
        defaultValue={["2024-02-12", "2024-02-15"]}
        onChange={onChange}
        {...props}
      >
        <Label>Trip dates</Label>
        <DateRangePickerStartField />
        <DateRangePickerEndField />
        <DateRangePickerTrigger />
        <DateRangePickerPopover>
          <RangeCalendar locale="en-GB">
            <CalendarHeader />
            <CalendarPreviousButton />
            <CalendarNextButton />
            <RangeCalendarGrid />
          </RangeCalendar>
        </DateRangePickerPopover>
      </DateRangePicker>,
    );
    const fields = [
      ...result.container.querySelectorAll<HTMLInputElement>("input:not([aria-hidden])"),
    ];
    const trigger = result.container.querySelector<HTMLButtonElement>(
      "button[aria-haspopup='dialog']",
    )!;
    const surface = result.container.querySelector<HTMLElement>("[role='dialog']")!;
    return { ...result, endField: fields[1]!, onChange, startField: fields[0]!, surface, trigger };
  }

  it("labels both fields and opens with the range end as the roving date", async () => {
    const { container, endField, startField, surface, trigger, user } = renderPicker();

    expect(startField.id).toBe("trip-start");
    expect(endField.id).toBe("trip-end");
    expect(container.querySelector("label")?.htmlFor).toBe("trip-start");
    expect(endField.getAttribute("aria-label")).toBe("End date");
    expect(startField.value).toBe("2024-02-12");
    expect(endField.value).toBe("2024-02-15");
    expect(trigger.getAttribute("aria-label")).toBe("Choose dates");
    expect(surface.hidden).toBe(true);

    await user.click(trigger);
    expect(surface.hidden).toBe(false);
    expect(document.activeElement).toBe(dayButton(container, "2024-02-15"));
  });

  it("stays open for the start, then closes and restores focus when the range completes", async () => {
    const { container, endField, onChange, startField, surface, trigger, user } = renderPicker();

    await user.click(trigger);
    await user.click(dayButton(container, "2024-02-20"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-20", ""]);
    expect(startField.value).toBe("2024-02-20");
    expect(endField.value).toBe("");
    expect(surface.hidden).toBe(false);

    await user.click(dayButton(container, "2024-02-18"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-18", "2024-02-20"]);
    expect(startField.value).toBe("2024-02-18");
    expect(endField.value).toBe("2024-02-20");
    expect(surface.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("reports a controlled field edit without moving values until its owner responds", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateRangePicker value={["2024-02-12", "2024-02-15"]} onChange={onChange}>
        <DateRangePickerStartField aria-label="Start date" />
        <DateRangePickerEndField />
      </DateRangePicker>,
    );
    const [startField, endField] = [
      ...container.querySelectorAll<HTMLInputElement>("input:not([aria-hidden])"),
    ];

    fireInput(startField!, "2024-02-13");
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-13", "2024-02-15"]);
    expect(startField?.value).toBe("2024-02-12");
    expect(endField?.value).toBe("2024-02-15");
  });

  it("submits and resets an uncontrolled pair of date values", async () => {
    const { container, user } = setup(
      <form>
        <DateRangePicker name="trip" defaultValue={["2024-02-12", "2024-02-15"]} defaultOpen>
          <DateRangePickerStartField aria-label="Start date" />
          <DateRangePickerEndField />
          <DateRangePickerPopover>
            <RangeCalendar locale="en-GB">
              <RangeCalendarGrid />
            </RangeCalendar>
          </DateRangePickerPopover>
        </DateRangePicker>
      </form>,
    );
    const form = container.querySelector("form")!;

    await user.click(dayButton(container, "2024-02-20"));
    await user.click(dayButton(container, "2024-02-22"));
    expect(new FormData(form).get("trip-start")).toBe("2024-02-20");
    expect(new FormData(form).get("trip-end")).toBe("2024-02-22");

    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(new FormData(form).get("trip-start")).toBe("2024-02-12");
    expect(new FormData(form).get("trip-end")).toBe("2024-02-15");
  });

  it("reports open state through onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const { trigger, user } = renderPicker({ onOpenChange });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger);
  });
});
