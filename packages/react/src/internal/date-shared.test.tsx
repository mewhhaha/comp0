import { describe, expect, it } from "vitest";
import {
  DatePickerContext,
  useDatePickerContext,
  useOptionalDatePickerContext,
} from "./date-shared.js";
import { render } from "../../test/render.js";

function Required() {
  return <span>{useDatePickerContext("Reader").value}</span>;
}

function Optional() {
  return <span>{useOptionalDatePickerContext()?.value ?? "none"}</span>;
}

describe("date picker context", () => {
  it("shares the picker value with its parts", () => {
    const { container } = render(
      <DatePickerContext
        value={{ value: "2024-02-15", setValue: () => undefined, disabled: false }}
      >
        <Required />
        <Optional />
      </DatePickerContext>,
    );

    expect(container.textContent).toBe("2024-02-152024-02-15");
  });

  it("names the missing DatePicker when a required read has no provider", () => {
    expect(() => render(<Required />)).toThrow("Reader must be rendered inside DatePicker.");
  });

  it("lets standalone fields read no picker", () => {
    const { container } = render(<Optional />);

    expect(container.textContent).toBe("none");
  });
});
