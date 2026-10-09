import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../react/test/axe.js";
import { renderResponse, renderStack } from "../test/render.js";

function result(container: HTMLElement) {
  return container.querySelector("[data-slot=output]")?.textContent;
}

describe("Output", () => {
  it("is labelled by its visible label", () => {
    const { getByLabelText } = renderStack([
      { type: "Output", label: "Monthly total", value: 12, unit: " USD" },
    ]);

    expect(getByLabelText("Monthly total").tagName).toBe("OUTPUT");
    expect(getByLabelText("Monthly total").textContent).toBe("12 USD");
  });

  it("formats numbers for reading and shows strings as written", () => {
    expect(
      result(renderStack([{ type: "Output", label: "Total", value: 1234.56789 }]).container),
    ).toBe("1,234.5679");
    expect(
      result(renderStack([{ type: "Output", label: "Total", value: "about 5" }]).container),
    ).toBe("about 5");
    expect(
      result(
        renderStack([{ type: "Output", label: "Total", value: { $expr: "nothing" } }]).container,
      ),
    ).toBe("");
  });

  it("recalculates from a number field bound to a name", async () => {
    const { container, getByRole, user } = renderStack([
      {
        type: "NumberField",
        label: "Seats",
        name: "seats",
        min: 1,
        max: 10,
        value: { $bind: "seats", initial: 3 },
      },
      { type: "Output", label: "Yearly cost", value: { $expr: "seats * 12" }, unit: " USD" },
    ]);
    expect(result(container)).toBe("36 USD");

    const input = getByRole("spinbutton", { name: "Seats" });
    await user.clear(input);
    await user.type(input, "4");

    expect(result(container)).toBe("48 USD");
  });

  it("recalculates from a text field and a switch", async () => {
    const { container, getByRole, user } = renderStack([
      { type: "TextField", label: "Name", name: "name", value: { $bind: "name", initial: "Ada" } },
      {
        type: "Switch",
        label: "Express",
        name: "express",
        checked: { $bind: "express", initial: false },
      },
      {
        type: "Output",
        label: "Summary",
        value: { $expr: 'name + (express ? " (express)" : "")' },
      },
    ]);
    expect(result(container)).toBe("Ada");

    await user.click(getByRole("switch", { name: "Express" }));
    await user.type(getByRole("textbox", { name: "Name" }), "m");

    expect(result(container)).toBe("Adam (express)");
  });

  it("recalculates from a radio group and a select", async () => {
    const { container, getByRole, user } = renderStack([
      {
        type: "RadioGroup",
        label: "Plan",
        name: "plan",
        options: ["free", "pro"],
        value: { $bind: "plan", initial: "free" },
      },
      { type: "Output", label: "Price", value: { $expr: 'plan == "pro" ? 12 : 0' }, unit: " USD" },
    ]);
    expect(result(container)).toBe("0 USD");

    await user.click(getByRole("radio", { name: "pro" }));

    expect(result(container)).toBe("12 USD");
  });

  it("shares one value between controls bound to the same name", async () => {
    const { getByRole, user } = renderStack([
      { type: "TextField", label: "First", name: "a", value: { $bind: "shared", initial: "x" } },
      { type: "TextField", label: "Second", name: "b", value: { $bind: "shared" } },
    ]);

    await user.type(getByRole("textbox", { name: "First" }), "yz");

    expect((getByRole("textbox", { name: "Second" }) as HTMLInputElement).value).toBe("xyz");
  });

  it("still submits the bound value with its form", async () => {
    const onAction = vi.fn();
    const { getByRole, user } = renderStack(
      [
        {
          type: "Form",
          name: "f",
          title: "Order",
          submitLabel: "Order",
          children: [
            {
              type: "NumberField",
              label: "Seats",
              name: "seats",
              value: { $bind: "seats", initial: 3 },
            },
            { type: "Output", label: "Total", value: { $expr: "seats * 12" } },
          ],
        },
      ],
      { onAction },
    );

    await user.click(getByRole("button", { name: "Order" }));

    expect(onAction.mock.calls[0]?.[0]).toMatchObject({
      type: "form",
      name: "f",
      message: "Seats: 3",
      values: { seats: 3 },
    });
  });

  it("works without a binding", () => {
    const { container } = renderStack([
      { type: "Slider", label: "Seats", name: "seats", min: 1, max: 10, value: 4 },
      { type: "Output", label: "Total", value: 48 },
    ]);

    expect(result(container)).toBe("48");
  });

  it("computes with text that comes from an expression in a Text", async () => {
    const { container, getByRole, user } = renderStack([
      { type: "NumberField", label: "Seats", name: "seats", value: { $bind: "seats", initial: 2 } },
      { type: "Text", text: { $expr: '"Seats: " + seats' } },
    ]);
    expect(container.querySelector("[data-slot=text]")?.textContent).toBe("Seats: 2");

    await user.type(getByRole("spinbutton", { name: "Seats" }), "5");

    expect(container.querySelector("[data-slot=text]")?.textContent).toBe("Seats: 25");
  });

  it("shows nothing for an expression that cannot be computed", () => {
    const { container } = renderStack([
      { type: "Output", label: "Ratio", value: { $expr: "1 / 0" }, unit: "%" },
    ]);

    expect(result(container)).toBe("");
  });
});

describe("Comparison", () => {
  const plans = {
    type: "Comparison",
    caption: "Plans compared",
    options: ["Free", "Pro"],
    features: [
      { name: "Projects", values: [3, "Unlimited"] },
      { name: "Priority support", values: [false, true] },
      { name: "Notes", values: ["Basic"] },
    ],
    recommended: "pro",
  };

  it("is a named table announced by option and feature", () => {
    const { getByRole, getAllByRole } = renderStack([plans]);

    expect(getByRole("table", { name: "Plans compared" })).not.toBeNull();
    expect(getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Feature",
      "Free",
      "Pro, Recommended",
    ]);
    expect(getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([
      "Projects",
      "Priority support",
      "Notes",
    ]);
  });

  it("marks the recommended option regardless of case and gives yes/no values a text alternative", () => {
    const { container } = renderStack([plans]);

    expect(
      container.querySelector("[data-slot=comparison-option][data-recommended]")?.textContent,
    ).toContain("Pro");
    const cells = [...container.querySelectorAll("[data-slot=comparison-value]")].map(
      (cell) => cell.textContent,
    );
    expect(cells.some((text) => text?.includes("Not included"))).toBe(true);
    expect(cells.some((text) => text?.includes("Included") && !text.includes("Not"))).toBe(true);
  });

  it("tolerates missing values, extra values, and no options", () => {
    const { container, unmount } = renderStack([
      {
        type: "Comparison",
        caption: "c",
        options: ["A"],
        features: [
          { name: "x", values: ["1", "2", "3"] },
          { name: "y", values: [] },
        ],
      },
    ]);
    expect(container.querySelectorAll("[data-slot=comparison-value]")).toHaveLength(2);
    unmount();

    const empty = renderStack([
      { type: "Comparison", caption: "c", options: [], features: [{ name: "x", values: ["1"] }] },
    ]);
    expect(empty.container.querySelector("table")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = renderStack([plans]);

    await expectNoAxeViolations(container);
  });
});

describe("CitedText", () => {
  const answer = {
    type: "CitedText",
    text: "Tea grows high [1]. It also grows low [2][1] and nowhere else [9].\n\nSecond paragraph [2].",
    sources: [
      { title: "Tea atlas", href: "https://example.com/atlas", note: "Atlas Press" },
      { title: "Farms", href: "javascript:alert(1)" },
    ],
  };

  it("turns markers into links to the numbered sources", () => {
    const { getAllByRole, getByRole, container } = renderStack([answer]);

    const links = getAllByRole("link", { name: /^Source \d/ });
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "Source 1: Tea atlas",
      "Source 2: Farms",
      "Source 1: Tea atlas",
      "Source 2: Farms",
    ]);
    expect(container.querySelectorAll("p")).toHaveLength(2);
    expect(getByRole("list", { name: "Sources" }).querySelectorAll("li")).toHaveLength(2);
    const target = document.getElementById(links[0]!.getAttribute("href")!.slice(1));
    expect(target?.getAttribute("data-value")).toBe("0");
  });

  it("leaves markers without a source as written and never links unsafe sources", () => {
    const { container, getByRole } = renderStack([answer]);

    expect(container.textContent).toContain("[9]");
    expect(getByRole("link", { name: "Tea atlas" }).getAttribute("href")).toBe(
      "https://example.com/atlas",
    );
    expect(container.querySelector("a[href^=javascript]")).toBeNull();
    expect(container.textContent).toContain("Farms");
  });

  it("renders text alone when there are no sources yet", () => {
    const { container } = renderStack([{ type: "CitedText", text: "Claim [1].", sources: [] }]);

    expect(container.textContent).toBe("Claim [1].");
    expect(container.querySelector("ol")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = renderStack([answer]);

    await expectNoAxeViolations(container);
  });
});

describe("Suggestions", () => {
  it("sends the suggestion text as the next message", async () => {
    const onAction = vi.fn();
    const { getByRole, user } = renderStack(
      [
        {
          type: "Suggestions",
          label: "Next steps",
          items: ["Compare with Team", "Show annual billing", ""],
        },
      ],
      { onAction },
    );

    expect(getByRole("group", { name: "Next steps" }).querySelectorAll("button")).toHaveLength(2);
    await user.click(getByRole("button", { name: "Show annual billing" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0]?.[0]).toEqual({
      type: "suggestion",
      message: "Show annual billing",
    });
  });

  it("waits while the response streams and renders nothing without replies", () => {
    const streaming = renderStack([{ type: "Suggestions", label: "Next", items: ["A"] }], {
      streaming: true,
    });
    expect(streaming.getByRole("button", { name: "A" }).hasAttribute("disabled")).toBe(true);
    streaming.unmount();

    const empty = renderStack([{ type: "Suggestions", label: "Next", items: [] }]);
    expect(empty.container.querySelector("[data-slot=suggestions]")).toBeNull();
  });
});

describe("CopyButton", () => {
  it("copies its value and announces it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const { getByRole, user, container } = renderStack([
      { type: "CopyButton", label: "Copy install command", value: "npm install @comp0/react" },
    ]);
    // userEvent installs its own clipboard stub; replace it after setup.
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await user.click(getByRole("button", { name: "Copy install command" }));

    expect(writeText).toHaveBeenCalledWith("npm install @comp0/react");
    expect(container.textContent).toContain("Copied");
  });

  it("is disabled without text to copy", () => {
    const { getByRole } = renderStack([{ type: "CopyButton", label: "Copy", value: "" }]);

    expect(getByRole("button", { name: "Copy" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("Form nesting", () => {
  it("turns a form inside a form into a labelled group, never a nested form", async () => {
    const onAction = vi.fn();
    const { container, getByRole, user } = renderStack(
      [
        {
          type: "Form",
          name: "outer",
          title: "Order",
          submitLabel: "Order",
          children: [
            { type: "TextField", label: "Name", name: "name", value: "Ada" },
            {
              type: "Form",
              name: "inner",
              title: "Delivery",
              children: [{ type: "TextField", label: "City", name: "city", value: "Oslo" }],
            },
          ],
        },
      ],
      { onAction },
    );

    expect(container.querySelectorAll("form")).toHaveLength(1);
    expect(getByRole("group", { name: "Delivery" })).not.toBeNull();
    await user.click(getByRole("button", { name: "Order" }));

    expect(onAction.mock.calls[0]?.[0].message).toBe("Name: Ada; City: Oslo");
  });
});

describe("limits", () => {
  it("cuts off tables that would lock the page", () => {
    const tall = renderStack([
      {
        type: "Table",
        caption: "Tall",
        columns: ["Name"],
        rows: Array.from({ length: 700 }, (_, index) => [`row ${index}`]),
      },
    ]);
    expect(tall.container.querySelectorAll("tbody tr")).toHaveLength(500);
    tall.unmount();

    const broad = renderStack([
      {
        type: "Table",
        caption: "Wide",
        columns: Array.from({ length: 30 }, (_, index) => `C${index}`),
        rows: Array.from({ length: 100 }, (_, index) =>
          Array.from({ length: 30 }, () => `c${index}`),
        ),
      },
    ]);
    expect(broad.container.querySelectorAll("thead th")).toHaveLength(24);
    expect(broad.container.querySelectorAll("tbody tr")).toHaveLength(33);
  });

  it("lists at most 200 choices", () => {
    const { container } = renderResponse({
      type: "Stack",
      children: [
        {
          type: "RadioGroup",
          label: "Many",
          name: "many",
          options: Array.from({ length: 300 }, (_, index) => `option ${index}`),
        },
      ],
    });

    expect(container.querySelectorAll("input[type=radio]")).toHaveLength(200);
  });
});
