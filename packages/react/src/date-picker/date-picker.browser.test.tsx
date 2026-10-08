import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import {
  Calendar,
  CalendarGrid,
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
  DateField,
  DatePicker,
  DatePickerPopover,
  DatePickerTrigger,
  DateRangePicker,
  DateRangePickerEndField,
  DateRangePickerPopover,
  DateRangePickerStartField,
  DateRangePickerTrigger,
  Label,
  RangeCalendar,
  RangeCalendarGrid,
} from "../index.js";

describe("date picker browser interactions", () => {
  it("focuses the selected day on open, passes axe, and restores trigger focus on Escape", async () => {
    const { unmount } = render(
      <DatePicker defaultValue="2024-02-15">
        <Label>Trip date</Label>
        <DateField />
        <DatePickerTrigger />
        <DatePickerPopover>
          <Calendar locale="en-GB">
            <CalendarHeader />
            <CalendarPreviousButton />
            <CalendarNextButton />
            <CalendarGrid />
          </Calendar>
        </DatePickerPopover>
      </DatePicker>,
    );
    const trigger = page.getByRole("button", { name: "Choose date" }).element();

    await act(async () => userEvent.click(trigger));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.getAttribute("aria-label")).toContain("15 February 2024");
    await expectNoAxeViolations(document.body, "open date picker");

    await act(async () => userEvent.keyboard("{Escape}"));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    unmount();
  });

  it("opens the range picker onto the range end and passes axe", async () => {
    const { unmount } = render(
      <DateRangePicker defaultValue={["2024-02-12", "2024-02-15"]}>
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
    const trigger = page.getByRole("button", { name: "Choose dates" }).element();

    await act(async () => userEvent.click(trigger));
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.getAttribute("aria-label")).toContain("15 February 2024");
    await expectNoAxeViolations(document.body, "open date range picker");

    await act(async () => userEvent.keyboard("{Escape}"));
    expect(document.activeElement).toBe(trigger);
    unmount();
  });
});
