import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Label } from "./components/Label.js";
import { CalendarHeader } from "./components/CalendarHeader.js";
import { CalendarNextButton } from "./components/CalendarNextButton.js";
import { CalendarPreviousButton } from "./components/CalendarPreviousButton.js";
import { DateRangePicker } from "./components/DateRangePicker.js";
import { DateRangePickerEndField } from "./components/DateRangePickerEndField.js";
import { DateRangePickerPopover } from "./components/DateRangePickerPopover.js";
import { DateRangePickerStartField } from "./components/DateRangePickerStartField.js";
import { DateRangePickerTrigger } from "./components/DateRangePickerTrigger.js";
import { RangeCalendar } from "./components/RangeCalendar.js";
import { RangeCalendarGrid } from "./components/RangeCalendarGrid.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

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
  it("marks the endpoints and interior of a selected range", () => {
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

  it("starts a new range after a completed one and orders a backwards second selection", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar defaultValue={["2024-02-12", "2024-02-15"]} locale="en-GB" onChange={onChange}>
        <RangeCalendarGrid />
      </RangeCalendar>,
    );

    fireClick(dayButton(container, "2024-02-20"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-20", ""]);
    expect(
      container.querySelector("td[data-value='2024-02-20']")?.hasAttribute("data-range-start"),
    ).toBe(true);
    expect(container.querySelectorAll("td[data-in-range]")).toHaveLength(0);

    fireClick(dayButton(container, "2024-02-18"));
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

  it("uses the calendar grid keyboard contract and respects controlled state", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeCalendar value={["2024-02-12", "2024-02-15"]} locale="en-GB" onChange={onChange}>
        <RangeCalendarGrid />
      </RangeCalendar>,
    );
    const end = dayButton(container, "2024-02-15");
    act(() => {
      end.focus();
    });

    fireKeyDown(end, "ArrowRight");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-16"));
    fireKeyDown(document.activeElement!, "Enter");

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
  function renderPicker() {
    const onChange = vi.fn();
    const result = render(
      <DateRangePicker id="trip" defaultValue={["2024-02-12", "2024-02-15"]} onChange={onChange}>
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

  it("labels both fields and opens with the range end as the roving date", () => {
    const { container, endField, startField, surface, trigger } = renderPicker();

    expect(startField.id).toBe("trip-start");
    expect(endField.id).toBe("trip-end");
    expect(container.querySelector("label")?.htmlFor).toBe("trip-start");
    expect(endField.getAttribute("aria-label")).toBe("End date");
    expect(startField.value).toBe("2024-02-12");
    expect(endField.value).toBe("2024-02-15");
    expect(trigger.getAttribute("aria-label")).toBe("Choose dates");
    expect(surface.hidden).toBe(true);

    fireClick(trigger);
    expect(surface.hidden).toBe(false);
    expect(document.activeElement).toBe(dayButton(container, "2024-02-15"));
  });

  it("stays open for the start, then closes and restores focus when the range completes", () => {
    const { container, endField, onChange, startField, surface, trigger } = renderPicker();

    fireClick(trigger);
    fireClick(dayButton(container, "2024-02-20"));
    expect(onChange).toHaveBeenLastCalledWith(["2024-02-20", ""]);
    expect(startField.value).toBe("2024-02-20");
    expect(endField.value).toBe("");
    expect(surface.hidden).toBe(false);

    fireClick(dayButton(container, "2024-02-18"));
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
    const { container } = render(
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

    fireClick(dayButton(container, "2024-02-20"));
    fireClick(dayButton(container, "2024-02-22"));
    expect(new FormData(form).get("trip-start")).toBe("2024-02-20");
    expect(new FormData(form).get("trip-end")).toBe("2024-02-22");

    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(new FormData(form).get("trip-start")).toBe("2024-02-12");
    expect(new FormData(form).get("trip-end")).toBe("2024-02-15");
  });
});
