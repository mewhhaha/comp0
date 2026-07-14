import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Description, FieldError, Label, TextField } from "./index.js";
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
  TimeField,
} from "./date.js";
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

function renderCalendar(props: Partial<Parameters<typeof Calendar>[0]> = {}) {
  const onChange = vi.fn();
  const result = render(
    <Calendar defaultValue="2024-02-15" locale="en-GB" onChange={onChange} {...props}>
      <CalendarHeader />
      <CalendarGrid />
    </Calendar>,
  );
  const grid = result.container.querySelector<HTMLTableElement>("[role='grid']")!;
  const header = result.container.querySelector<HTMLElement>("[aria-live='polite']")!;
  return { ...result, grid, header, onChange };
}

describe("date and time fields", () => {
  it("wires DateField into the field context and participates in the field value", () => {
    const changed = vi.fn();
    const { container } = render(
      <TextField id="departure" defaultValue="2024-05-10" onChange={changed} invalid>
        <Label>Departure</Label>
        <Description>Weekdays only.</Description>
        <FieldError>Pick a date.</FieldError>
        <DateField min="2024-05-01" max="2024-05-31" />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const label = container.querySelector<HTMLLabelElement>("label")!;

    expect(input.type).toBe("date");
    expect(input.id).toBe("departure");
    expect(label.htmlFor).toBe("departure");
    expect(input.getAttribute("aria-describedby")).toBe("departure-description departure-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("min")).toBe("2024-05-01");
    expect(input.getAttribute("max")).toBe("2024-05-31");
    expect(input.value).toBe("2024-05-10");
    expect(input.dataset["value"]).toBe("2024-05-10");

    fireInput(input, "2024-05-11");
    expect(changed).toHaveBeenLastCalledWith("2024-05-11");
    expect(input.value).toBe("2024-05-11");
  });

  it("wires TimeField with a step passthrough and field value participation", () => {
    const changed = vi.fn();
    const { container } = render(
      <TextField id="alarm" defaultValue="08:30" onChange={changed}>
        <Label>Alarm</Label>
        <TimeField step={1} required />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    expect(input.type).toBe("time");
    expect(input.id).toBe("alarm");
    expect(container.querySelector("label")?.htmlFor).toBe("alarm");
    expect(input.getAttribute("step")).toBe("1");
    expect(input.required).toBe(true);
    expect(input.value).toBe("08:30");
    fireInput(input, "09:15");
    expect(changed).toHaveBeenLastCalledWith("09:15");
    expect(input.value).toBe("09:15");
  });
});

describe("calendar", () => {
  it("renders a labelled grid with localized weekday headers and month label", () => {
    const { container, grid, header } = renderCalendar();

    expect(header.textContent).toBe("February 2024");
    expect(grid.getAttribute("aria-labelledby")).toBe(header.id);
    const headers = [...grid.querySelectorAll("th")];
    expect(headers).toHaveLength(7);
    expect(headers.every((cell) => cell.scope === "col")).toBe(true);
    expect(headers[0]?.getAttribute("abbr")).toBe("Monday");
    expect(headers[0]?.textContent).toBe("M");
    expect(headers[6]?.getAttribute("abbr")).toBe("Sunday");
    expect(grid.querySelectorAll("tbody tr")).toHaveLength(5);

    const outside = container.querySelector("td[data-value='2024-01-29']")!;
    expect(outside.hasAttribute("data-outside-month")).toBe(true);
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.hasAttribute("data-outside-month"),
    ).toBe(false);

    expect(dayButton(container, "2024-02-15").tabIndex).toBe(0);
    expect(grid.querySelectorAll("button[tabindex='0']")).toHaveLength(1);
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.hasAttribute("data-selected"),
    ).toBe(true);
  });

  it("moves the roving focus with arrows, Home, End, and page keys", () => {
    const { container, header } = renderCalendar();
    const start = dayButton(container, "2024-02-15");
    act(() => {
      start.focus();
    });

    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-16"));
    expect(dayButton(container, "2024-02-16").tabIndex).toBe(0);
    expect(dayButton(container, "2024-02-15").tabIndex).toBe(-1);

    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-23"));

    fireKeyDown(document.activeElement!, "Home");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-19"));

    fireKeyDown(document.activeElement!, "End");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-25"));

    fireKeyDown(document.activeElement!, "PageUp");
    expect(header.textContent).toBe("January 2024");
    expect(document.activeElement).toBe(dayButton(container, "2024-01-25"));

    fireKeyDown(document.activeElement!, "PageDown", { shiftKey: true });
    expect(header.textContent).toBe("January 2025");
    expect(document.activeElement).toBe(dayButton(container, "2025-01-25"));
  });

  it("shifts the visible month when focus crosses the month edge", () => {
    const { container, header } = renderCalendar({ defaultValue: "2024-03-01" });
    const start = dayButton(container, "2024-03-01");
    act(() => {
      start.focus();
    });

    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(header.textContent).toBe("February 2024");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-29"));
  });

  it("disables dates outside min/max and clamps keyboard navigation to them", () => {
    const { container } = renderCalendar({ min: "2024-02-10", max: "2024-02-20" });

    expect(dayButton(container, "2024-02-09").disabled).toBe(true);
    expect(dayButton(container, "2024-02-10").disabled).toBe(false);
    expect(dayButton(container, "2024-02-20").disabled).toBe(false);
    expect(dayButton(container, "2024-02-21").disabled).toBe(true);

    act(() => {
      dayButton(container, "2024-02-15").focus();
    });
    fireKeyDown(document.activeElement!, "End");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-18"));
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-20"));
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(dayButton(container, "2024-02-20"));
  });

  it("selects the focused date with Enter when uncontrolled", () => {
    const { container, onChange } = renderCalendar();
    act(() => {
      dayButton(container, "2024-02-15").focus();
    });

    fireKeyDown(document.activeElement!, "ArrowRight");
    fireKeyDown(document.activeElement!, "Enter");

    expect(onChange).toHaveBeenLastCalledWith("2024-02-16");
    expect(
      container.querySelector("td[data-value='2024-02-16']")?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.hasAttribute("aria-selected"),
    ).toBe(false);
  });

  it("reports controlled selection without moving it until the owner updates", () => {
    const { container, onChange } = renderCalendar({ value: "2024-02-15" });

    fireClick(dayButton(container, "2024-02-16"));

    expect(onChange).toHaveBeenLastCalledWith("2024-02-16");
    expect(
      container.querySelector("td[data-value='2024-02-15']")?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      container.querySelector("td[data-value='2024-02-16']")?.hasAttribute("aria-selected"),
    ).toBe(false);
  });

  it("steps months from the header buttons and disables them past min/max", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        defaultValue="2024-02-15"
        locale="en-GB"
        min="2024-01-05"
        max="2024-03-20"
        onChange={onChange}
      >
        <CalendarHeader />
        <CalendarPreviousButton />
        <CalendarNextButton />
        <CalendarGrid />
      </Calendar>,
    );
    const header = container.querySelector<HTMLElement>("[aria-live='polite']")!;
    const previous = container.querySelector<HTMLButtonElement>("[aria-label='Previous month']")!;
    const next = container.querySelector<HTMLButtonElement>("[aria-label='Next month']")!;

    fireClick(previous);
    expect(header.textContent).toBe("January 2024");
    expect(previous.disabled).toBe(true);
    fireClick(next);
    fireClick(next);
    expect(header.textContent).toBe("March 2024");
    expect(next.disabled).toBe(true);
  });

  it("clamps keyboard focus when bounds change without a selection", () => {
    const view = (min?: string) => (
      <Calendar locale="en-GB" min={min}>
        <CalendarHeader />
        <CalendarGrid />
      </Calendar>
    );
    const { container, rerender } = render(view());

    rerender(view("2099-01-01"));

    const firstAllowed = dayButton(container, "2099-01-01");
    expect(firstAllowed.disabled).toBe(false);
    expect(firstAllowed.tabIndex).toBe(0);
    expect(container.querySelector("button[tabindex='0']:disabled")).toBeNull();
  });
});

describe("date picker composition", () => {
  function renderPicker() {
    const onChange = vi.fn();
    const result = render(
      <DatePicker id="trip" defaultValue="2024-02-15" onChange={onChange}>
        <Label>Trip date</Label>
        <DateField />
        <DatePickerTrigger />
        <DatePickerPopover>
          <Calendar locale="en-GB">
            <CalendarHeader />
            <CalendarGrid />
          </Calendar>
        </DatePickerPopover>
      </DatePicker>,
    );
    const input = result.container.querySelector<HTMLInputElement>("input")!;
    const trigger = result.container.querySelector<HTMLButtonElement>(
      "button[aria-haspopup='dialog']",
    )!;
    const surface = result.container.querySelector<HTMLElement>("[role='dialog']")!;
    return { ...result, input, onChange, surface, trigger };
  }

  it("labels the parts and opens onto the focused calendar date", () => {
    const { container, input, surface, trigger } = renderPicker();

    expect(input.value).toBe("2024-02-15");
    expect(input.id).toBe("trip");
    expect(container.querySelector("label")?.htmlFor).toBe("trip");
    expect(trigger.getAttribute("aria-label")).toBe("Choose date");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(surface.id);
    expect(surface.getAttribute("aria-label")).toBe("Calendar");
    expect(surface.hidden).toBe(true);

    fireClick(trigger);
    expect(surface.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.hasAttribute("data-open")).toBe(true);
    expect(document.activeElement).toBe(dayButton(container, "2024-02-15"));
  });

  it("keeps the explicit id on the field when the picker renders a wrapper", () => {
    const { container } = render(
      <DatePicker as="div" id="trip">
        <DateField />
        <DatePickerTrigger />
      </DatePicker>,
    );

    expect(container.querySelectorAll("#trip")).toHaveLength(1);
    expect(container.querySelector("#trip")?.tagName).toBe("INPUT");
  });

  it("disables the open calendar from the picker root", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker disabled defaultOpen defaultValue="2024-02-15" onChange={onChange}>
        <DatePickerTrigger />
        <DatePickerPopover>
          <Calendar locale="en-GB">
            <CalendarPreviousButton />
            <CalendarNextButton />
            <CalendarGrid />
          </Calendar>
        </DatePickerPopover>
      </DatePicker>,
    );

    const selectedDay = dayButton(container, "2024-02-15");
    expect(selectedDay.disabled).toBe(true);
    expect(
      container.querySelector<HTMLButtonElement>("[aria-label='Previous month']")?.disabled,
    ).toBe(true);
    fireClick(selectedDay);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes on selection, updates the DateField, and restores trigger focus", () => {
    const { container, input, onChange, surface, trigger } = renderPicker();

    fireClick(trigger);
    fireClick(dayButton(container, "2024-02-16"));

    expect(onChange).toHaveBeenLastCalledWith("2024-02-16");
    expect(surface.hidden).toBe(true);
    expect(input.value).toBe("2024-02-16");
    expect(document.activeElement).toBe(trigger);
  });

  it("serializes and resets an uncontrolled date picker", async () => {
    const { container } = render(
      <form>
        <DatePicker name="trip" defaultValue="2024-02-15">
          <DateField />
          <DatePickerPopover>
            <Calendar locale="en-GB">
              <CalendarGrid />
            </Calendar>
          </DatePickerPopover>
        </DatePicker>
      </form>,
    );
    const form = container.querySelector("form")!;
    const field = container.querySelector<HTMLInputElement>("input:not([aria-hidden])")!;

    fireClick(dayButton(container, "2024-02-16"));
    expect(new FormData(form).get("trip")).toBe("2024-02-16");

    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(field.value).toBe("2024-02-15");
    expect(new FormData(form).get("trip")).toBe("2024-02-15");
  });

  it("closes on Escape without changing the value", () => {
    const { input, onChange, surface, trigger } = renderPicker();

    fireClick(trigger);
    fireKeyDown(document.activeElement!, "Escape");

    expect(surface.hidden).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("2024-02-15");
    expect(document.activeElement).toBe(trigger);
  });

  it("follows a date typed into the DateField when the calendar opens", () => {
    const { container, input, onChange, trigger } = renderPicker();
    const liveHeader = container.querySelector<HTMLElement>("[aria-live='polite']")!;

    fireInput(input, "2024-03-05");
    expect(onChange).toHaveBeenLastCalledWith("2024-03-05");
    fireClick(trigger);

    expect(liveHeader.textContent).toBe("March 2024");
    expect(document.activeElement).toBe(dayButton(container, "2024-03-05"));
  });
});
