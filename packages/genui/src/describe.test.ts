import { describe, expect, it } from "vitest";
import { describeFormValues, type FormFieldDescriptor } from "./describe.js";

const fields: FormFieldDescriptor[] = [
  {
    name: "plan",
    label: "Plan",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ],
  },
  { name: "seats", label: "Seats" },
];

describe("describeFormValues", () => {
  it("joins visible labels and values in field order", () => {
    expect(describeFormValues(fields, { seats: 5, plan: "pro" })).toBe("Plan: Pro; Seats: 5");
  });

  it("uses the option label rather than the stored value", () => {
    expect(describeFormValues(fields, { plan: "free" })).toBe("Plan: Free");
  });

  it("falls back to the value when no option matches", () => {
    expect(describeFormValues(fields, { plan: "enterprise" })).toBe("Plan: enterprise");
  });

  it("leaves out controls without a value", () => {
    expect(describeFormValues(fields, { plan: "", seats: undefined })).toBe("");
    expect(describeFormValues(fields, { seats: null })).toBe("");
    expect(describeFormValues(fields, { seats: Number.NaN })).toBe("");
    expect(describeFormValues(fields, { seats: 0 })).toBe("Seats: 0");
  });

  it("writes booleans as Yes and No", () => {
    const toggles: FormFieldDescriptor[] = [
      { name: "terms", label: "Accept terms" },
      { name: "alerts", label: "Email alerts" },
    ];
    expect(describeFormValues(toggles, { terms: true, alerts: false })).toBe(
      "Accept terms: Yes; Email alerts: No",
    );
  });

  it("lists several choices with their option labels", () => {
    const extras: FormFieldDescriptor = {
      name: "extras",
      label: "Extras",
      options: [
        { value: "s", label: "Support" },
        { value: "t", label: "Training" },
      ],
    };
    expect(describeFormValues([extras], { extras: ["s", "t"] })).toBe("Extras: Support, Training");
    expect(describeFormValues([extras], { extras: [] })).toBe("");
  });

  it("falls back to the field name when the label is empty", () => {
    expect(describeFormValues([{ name: "email", label: "  " }], { email: "a@b.c" })).toBe(
      "email: a@b.c",
    );
  });

  it("ignores values for unknown fields", () => {
    expect(describeFormValues(fields, { other: "x" })).toBe("");
    expect(describeFormValues([], { plan: "pro" })).toBe("");
  });
});
