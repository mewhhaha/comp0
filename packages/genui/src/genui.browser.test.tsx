import { page, userEvent } from "vitest/browser";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../react/test/axe.js";
import { render } from "../../react/test/render.js";
import { GenUI } from "./render/GenUI.js";

const response = JSON.stringify({
  type: "Stack",
  children: [
    {
      type: "Form",
      name: "f",
      title: "Booking",
      submitLabel: "Book",
      children: [
        {
          type: "Select",
          label: "Region",
          name: "region",
          options: ["North", "South"],
          value: "North",
        },
        { type: "DatePicker", label: "Start date", name: "start", value: "2026-07-14" },
        { type: "NumberField", label: "Seats", name: "seats", value: 2, min: 1, max: 9 },
      ],
    },
    {
      type: "Tabs",
      label: "Sections",
      tabs: [
        { label: "One", children: [{ type: "Text", text: "First" }] },
        { label: "Two", children: [{ type: "Text", text: "Second" }] },
      ],
    },
    {
      type: "Accordion",
      items: [{ title: "Shipping", children: [{ type: "Text", text: "Two days" }] }],
    },
  ],
});

describe("model-composed interface accessibility", () => {
  it("has no violations with the select and the calendar open", async () => {
    const { container, unmount } = render(<GenUI response={response} />);

    await expectNoAxeViolations(container, "initial");
    await page.getByRole("button", { name: /Region/ }).click();
    await expectNoAxeViolations(document.body, "select open");
    await page.getByRole("option", { name: "South" }).click();
    await page.getByRole("button", { name: "Choose date" }).click();
    await expectNoAxeViolations(document.body, "calendar open");
    unmount();
  });

  it("has no violations with another tab and a section expanded", async () => {
    const { container, unmount } = render(<GenUI response={response} />);

    await page.getByRole("tab", { name: "Two" }).click();
    await page.getByRole("button", { name: "Shipping" }).click();
    await expectNoAxeViolations(container, "tab and accordion");
    unmount();
  });

  it("has no violations at every stage of a streamed response", async () => {
    const { container, rerender, unmount } = render(<GenUI response="" streaming />);

    for (let end = 40; end < response.length; end += 160) {
      rerender(<GenUI response={response.slice(0, end)} streaming />);
      await expectNoAxeViolations(container, `streaming at ${end}`);
    }
    rerender(<GenUI response={response} />);
    await expectNoAxeViolations(container, "streamed");
    unmount();
  });
});

const computed = JSON.stringify({
  type: "Stack",
  children: [
    {
      type: "Slider",
      label: "Seats",
      name: "seats",
      min: 1,
      max: 10,
      value: { $bind: "seats", initial: 3 },
    },
    {
      type: "NumberField",
      label: "Extra seats",
      name: "extra",
      min: 0,
      max: 5,
      value: { $bind: "extra", initial: 0 },
    },
    {
      type: "Output",
      label: "Yearly cost",
      value: { $expr: "seats * 12 + extra * 12" },
      unit: " USD",
    },
    {
      type: "Comparison",
      caption: "Plans compared",
      options: ["Free", "Pro"],
      features: [
        { name: "Projects", values: [3, "Unlimited"] },
        { name: "Priority support", values: [false, true] },
      ],
      recommended: "Pro",
    },
    {
      type: "CitedText",
      text: "Pro suits teams [1].",
      sources: [{ title: "Pricing page", href: "https://example.com/pricing" }],
    },
    { type: "Suggestions", label: "Next steps", items: ["Show annual billing"] },
    { type: "CopyButton", label: "Copy plan name", value: "Pro" },
  ],
});

describe("computed results", () => {
  it("recalculates the output when the slider moves with the keyboard", async () => {
    const { container, unmount } = render(<GenUI response={computed} />);
    const result = () => container.querySelector("[data-slot='output']")?.textContent;

    expect(result()).toBe("36 USD");
    (page.getByRole("slider", { name: "Seats" }).element() as HTMLElement).focus();
    await act(async () => userEvent.keyboard("{ArrowRight}"));
    expect(result()).toBe("48 USD");
    await act(async () => userEvent.keyboard("{ArrowLeft}{ArrowLeft}"));
    expect(result()).toBe("24 USD");
    await expectNoAxeViolations(container, "computed answer");
    unmount();
  });

  it("keeps a bound value, focus, and the output in step while the response keeps streaming", async () => {
    const head = computed.slice(0, computed.indexOf('{"type":"Comparison"'));
    const { container, rerender, unmount } = render(<GenUI response={`${head}]}`} streaming />);
    const result = () => container.querySelector("[data-slot='output']")?.textContent;

    const slider = page.getByRole("slider", { name: "Seats" }).element() as HTMLElement;
    slider.focus();
    await act(async () => userEvent.keyboard("{ArrowRight}"));
    expect(result()).toBe("48 USD");
    rerender(<GenUI response={computed} streaming />);

    expect(document.activeElement).toBe(slider);
    expect(result()).toBe("48 USD");
    rerender(<GenUI response={computed} />);
    expect(result()).toBe("48 USD");
    unmount();
  });
});
