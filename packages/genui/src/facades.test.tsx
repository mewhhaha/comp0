import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../react/test/axe.js";
import { kitchenSink } from "../test/fixtures.js";
import { renderResponse, renderStack } from "../test/render.js";

describe("layout", () => {
  it("emits token data attributes and no styles", () => {
    const { container } = renderResponse({
      type: "Stack",
      direction: "row",
      gap: "sm",
      align: "center",
      wrap: true,
      children: [
        {
          type: "Grid",
          columns: 3,
          gap: "lg",
          children: [
            { type: "Text", text: "a" },
            { type: "Text", text: "b" },
          ],
        },
      ],
    });
    const root = container.querySelector("[data-slot='stack']")!;
    const grid = container.querySelector("[data-slot='grid']")!;

    expect(root.getAttribute("data-direction")).toBe("row");
    expect(root.getAttribute("data-gap")).toBe("sm");
    expect(root.getAttribute("data-align")).toBe("center");
    expect(root.hasAttribute("data-wrap")).toBe(true);
    expect(grid.getAttribute("data-columns")).toBe("3");
    expect(grid.getAttribute("data-gap")).toBe("lg");
    expect(container.querySelector("[class]")).toBeNull();
    expect(root.hasAttribute("style")).toBe(false);
  });

  it("ignores token values outside the vocabulary and clamps numbers", () => {
    const { container } = renderResponse({
      type: "Stack",
      direction: "diagonal",
      gap: "xxl",
      align: "left",
      children: [
        { type: "Grid", columns: 99, gap: "huge", children: [{ type: "Text", text: "a" }] },
        { type: "Grid", columns: -4, children: [{ type: "Text", text: "b" }] },
      ],
    });
    const root = container.querySelector("[data-slot='stack']")!;
    const grids = container.querySelectorAll("[data-slot='grid']");

    expect(root.hasAttribute("data-direction")).toBe(false);
    expect(root.hasAttribute("data-gap")).toBe(false);
    expect(root.hasAttribute("data-align")).toBe(false);
    expect(grids[0]?.getAttribute("data-columns")).toBe("6");
    expect(grids[0]?.hasAttribute("data-gap")).toBe(false);
    expect(grids[1]?.getAttribute("data-columns")).toBe("1");
  });

  it("names a card by its title and lays out its content", () => {
    const { getByRole } = renderStack([
      {
        type: "Card",
        title: "Revenue",
        description: "Year to date",
        tone: "accent",
        children: [{ type: "Text", text: "$57k" }],
      },
    ]);
    const card = getByRole("region", { name: "Revenue" });

    expect(card.getAttribute("data-tone")).toBe("accent");
    expect(card.querySelector("h2")?.textContent).toBe("Revenue");
    expect(card.textContent).toContain("Year to date");
    expect(card.textContent).toContain("$57k");
  });

  it("keeps the heading outline valid in nested cards and accordions", () => {
    const { container } = renderStack([
      {
        type: "Card",
        title: "Outer",
        children: [
          {
            type: "Card",
            title: "Inner",
            children: [
              {
                type: "Accordion",
                items: [{ title: "Section", children: [{ type: "Text", text: "x" }] }],
              },
            ],
          },
        ],
      },
    ]);

    expect(
      [...container.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(
        (heading) => `${heading.tagName} ${heading.textContent}`,
      ),
    ).toEqual(["H2 Outer", "H3 Inner", "H4 Section"]);
  });

  it("renders headings at the requested level, clamped to 1 through 6", () => {
    const { container } = renderStack([
      { type: "Heading", text: "One", level: 1 },
      { type: "Heading", text: "Default" },
      { type: "Heading", text: "Three", level: 3 },
      { type: "Heading", text: "Six", level: 6 },
    ]);

    expect([...container.querySelectorAll("[data-slot='heading']")].map((h) => h.tagName)).toEqual([
      "H1",
      "H2",
      "H3",
      "H6",
    ]);
  });

  it("shows text literally with its tone and size", () => {
    const { container } = renderStack([
      { type: "Text", text: "**bold** <b>x</b>", tone: "danger", size: "sm" },
    ]);
    const text = container.querySelector("[data-slot='text']")!;

    expect(text.textContent).toBe("**bold** <b>x</b>");
    expect(text.querySelector("b")).toBeNull();
    expect(text.getAttribute("data-tone")).toBe("danger");
    expect(text.getAttribute("data-size")).toBe("sm");
  });

  it("renders images with alt text and a caption", () => {
    const { getByRole, getByText } = renderStack([
      { type: "Image", src: "https://example.com/a.png", alt: "A rising line", caption: "Growth" },
    ]);

    expect(getByRole("img", { name: "A rising line" }).getAttribute("src")).toBe(
      "https://example.com/a.png",
    );
    expect(getByText("Growth").tagName).toBe("FIGCAPTION");
  });

  it("renders bulleted and numbered lists", () => {
    const { container } = renderStack([
      { type: "List", items: ["a", "b"] },
      { type: "List", items: ["c"], ordered: true },
    ]);

    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
  });
});

describe("disclosure", () => {
  const tabs = {
    type: "Tabs",
    label: "Sections",
    tabs: [
      { label: "One", children: [{ type: "Text", text: "First" }] },
      { label: "Two", children: [{ type: "Text", text: "Second" }] },
    ],
  };

  it("switches tabs and keeps one panel visible", async () => {
    const { getByRole, user } = renderStack([tabs]);

    expect(getByRole("tablist", { name: "Sections" })).toBeTruthy();
    expect(getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("true");
    await user.click(getByRole("tab", { name: "Two" }));

    expect(getByRole("tab", { name: "Two" }).getAttribute("aria-selected")).toBe("true");
    expect(getByRole("tabpanel", { name: "Two" }).textContent).toBe("Second");
  });

  it("opens the sections the model marked open and toggles them", async () => {
    const { getByRole, user } = renderStack([
      {
        type: "Accordion",
        items: [
          { title: "Shipping", open: true, children: [{ type: "Text", text: "Two days" }] },
          { title: "Returns", children: [{ type: "Text", text: "Thirty days" }] },
        ],
      },
    ]);
    const shipping = getByRole("button", { name: "Shipping" });
    const returns = getByRole("button", { name: "Returns" });

    expect(shipping.getAttribute("aria-expanded")).toBe("true");
    expect(returns.getAttribute("aria-expanded")).toBe("false");
    await user.click(returns);
    expect(returns.getAttribute("aria-expanded")).toBe("true");
    expect(shipping.getAttribute("aria-expanded")).toBe("false");
    await user.click(returns);
    expect(returns.getAttribute("aria-expanded")).toBe("false");
  });

  it("lets several sections stay open with multiple", async () => {
    const { getByRole, user } = renderStack([
      {
        type: "Accordion",
        multiple: true,
        items: [
          { title: "A", open: true, children: [{ type: "Text", text: "a" }] },
          { title: "B", children: [{ type: "Text", text: "b" }] },
        ],
      },
    ]);

    await user.click(getByRole("button", { name: "B" }));

    expect(getByRole("button", { name: "A" }).getAttribute("aria-expanded")).toBe("true");
    expect(getByRole("button", { name: "B" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("shows a disclosure's details after the summary is pressed", async () => {
    const { getByText, container, user } = renderStack([
      { type: "Disclosure", summary: "More", children: [{ type: "Text", text: "Details" }] },
    ]);

    expect(container.querySelector("details")?.hasAttribute("open")).toBe(false);
    await user.click(getByText("More"));
    expect(container.querySelector("details")?.hasAttribute("open")).toBe(true);
  });
});

describe("data", () => {
  it("renders a table with a caption, headers, and a row header", () => {
    const { getByRole } = renderStack([
      {
        type: "Table",
        caption: "Revenue",
        columns: ["Quarter", "Revenue", "Beat"],
        rows: [
          ["Q1", 18, true],
          ["Q2", 31],
        ],
      },
    ]);
    const table = getByRole("grid", { name: "Revenue" });

    expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "Quarter",
      "Revenue",
      "Beat",
    ]);
    expect(table.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(table.querySelector("tbody th")?.textContent).toBe("Q1");
    expect(
      [...table.querySelectorAll("tbody tr")[0]!.querySelectorAll("td")].map(
        (td) => td.textContent,
      ),
    ).toEqual(["18", "Yes"]);
    // Short rows are padded to the column count.
    expect(table.querySelectorAll("tbody tr")[1]!.querySelectorAll("td")).toHaveLength(2);
    expect(table.querySelectorAll("td[data-numeric]")).toHaveLength(2);
  });

  const categories = [
    { label: "A", value: 3 },
    { label: "B", value: 5 },
  ];
  const points = [
    { x: 1, y: 3 },
    { x: 2, y: 5 },
  ];

  it.each([
    ["BarChart", "Bar chart", categories],
    ["ColumnChart", "Column chart", categories],
    ["PieChart", "Pie chart", categories],
    ["LineChart", "Line chart", points],
    ["AreaChart", "Area chart", points],
  ])("renders %s with a title, a text alternative, and a data table", (type, label, data) => {
    const { getByRole, container } = renderStack([
      { type, title: "Growth", data, description: "B is larger.", unit: "%" },
    ]);

    expect(getByRole("group", { name: `${label}: Growth` })).toBeTruthy();
    expect(container.querySelector("figcaption")?.textContent).toBe("Growth");
    expect(container.querySelector("[data-slot='chart-description']")?.textContent).toBe(
      "B is larger.",
    );
    const table = container.querySelector("table[data-slot='chart-table']")!;
    expect(table.querySelector("caption")?.textContent).toBe("Growth");
    expect(table.textContent).toContain("5%");
  });

  it("sorts line points and drops unusable ones", () => {
    const { container } = renderStack([
      {
        type: "LineChart",
        title: "T",
        data: [
          { x: 3, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: 9 },
        ],
      },
    ]);
    const cells = [...container.querySelectorAll("table[data-slot='chart-table'] tbody th")];

    expect(cells.map((cell) => cell.textContent)).toEqual(["1", "3"]);
  });

  it("shows an accessible empty state instead of a chart without data", () => {
    const { container, getByText } = renderStack([
      { type: "BarChart", title: "Nothing yet", data: [] },
      { type: "PieChart", title: "All zero", data: [{ label: "A", value: 0 }] },
    ]);

    expect(container.querySelectorAll("[data-slot='chart-empty']")).toHaveLength(2);
    expect(getByText("Nothing yet").tagName).toBe("FIGCAPTION");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders a meter and a progress bar named by their labels", () => {
    const { getByRole } = renderStack([
      { type: "Meter", label: "Disk used", value: 64, min: 0, max: 100, low: 50, high: 85 },
      { type: "ProgressBar", label: "Upload", value: 40 },
    ]);
    const meter = getByRole("meter", { name: "Disk used" });
    const progress = getByRole("progressbar", { name: "Upload" });

    expect(meter.getAttribute("aria-valuenow")).toBe("64");
    expect(progress.getAttribute("aria-valuenow")).toBe("40");
    expect(progress.getAttribute("aria-valuemax")).toBe("100");
  });

  it("renders an unknown amount as an indeterminate progress bar", () => {
    const { getByRole } = renderStack([{ type: "ProgressBar", label: "Preparing" }]);

    expect(getByRole("progressbar", { name: "Preparing" }).hasAttribute("aria-valuenow")).toBe(
      false,
    );
  });

  it("clamps meter and progress values into their ranges", () => {
    const { getByRole } = renderStack([
      { type: "Meter", label: "Score", value: 500, min: 0, max: 10 },
      { type: "ProgressBar", label: "Upload", value: 250 },
    ]);

    expect(getByRole("meter", { name: "Score" }).getAttribute("aria-valuenow")).toBe("10");
    expect(getByRole("progressbar", { name: "Upload" }).getAttribute("aria-valuenow")).toBe("100");
  });

  it("computes a meter and a progress bar from bound values", async () => {
    const { getByRole, user } = renderStack([
      {
        type: "NumberField",
        label: "Used",
        name: "used",
        min: 0,
        max: 100,
        value: { $bind: "used", initial: 20 },
      },
      { type: "Meter", label: "Disk", value: { $expr: "used" }, min: 0, max: 100 },
      { type: "ProgressBar", label: "Fill", value: { $expr: "used / 2" } },
    ]);

    expect(getByRole("meter", { name: "Disk" }).getAttribute("aria-valuenow")).toBe("20");
    expect(getByRole("progressbar", { name: "Fill" }).getAttribute("aria-valuenow")).toBe("10");
    const input = getByRole("spinbutton", { name: "Used" });
    await user.clear(input);
    await user.type(input, "40");
    expect(getByRole("meter", { name: "Disk" }).getAttribute("aria-valuenow")).toBe("40");
    expect(getByRole("progressbar", { name: "Fill" }).getAttribute("aria-valuenow")).toBe("20");
  });
});

describe("feedback", () => {
  it("announces warnings and errors at once and other messages politely", () => {
    const { getAllByRole } = renderStack([
      { type: "Alert", message: "Disk almost full.", tone: "warning", title: "Heads up" },
      { type: "Alert", message: "Payment failed.", tone: "danger" },
      { type: "Alert", message: "Saved.", tone: "success" },
      { type: "Alert", message: "FYI." },
    ]);

    expect(getAllByRole("alert").map((alert) => alert.textContent)).toEqual([
      "Heads upDisk almost full.",
      "Payment failed.",
    ]);
    expect(getAllByRole("status").map((status) => status.getAttribute("data-tone"))).toEqual([
      "success",
      "info",
    ]);
  });

  it("renders separators in either orientation", () => {
    const { getAllByRole } = renderStack([
      { type: "Separator" },
      { type: "Separator", orientation: "vertical" },
    ]);

    expect(
      getAllByRole("separator").map((separator) => separator.getAttribute("aria-orientation")),
    ).toEqual([null, "vertical"]);
  });
});

describe("forms render", () => {
  it("names every control by its label and marks required ones", () => {
    const { getByRole } = renderResponse(kitchenSink);

    for (const [role, name] of [
      ["textbox", "Email"],
      ["textbox", "Notes"],
      ["spinbutton", "Seats"],
      ["group", "Plan"],
      ["group", "Extras"],
      ["checkbox", "Accept terms"],
      ["switch", "Email alerts"],
      ["slider", "Volume"],
      ["form", "Sign up"],
    ] as const) {
      expect(getByRole(role, { name, hidden: true }), `${role} ${name}`).toBeTruthy();
    }
    expect((getByRole("textbox", { name: "Email" }) as HTMLInputElement).required).toBe(true);
    expect((getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement).required).toBe(false);
  });

  it("describes fields with their help text", () => {
    const { getByRole } = renderResponse(kitchenSink);

    const describedBy = getByRole("textbox", { name: "Email" }).getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toBe("We only send receipts.");
  });

  it("uses the label for the stepper buttons of a number field", () => {
    const { getByRole } = renderResponse(kitchenSink);

    expect(getByRole("button", { name: "Increase Seats" })).toBeTruthy();
    expect(getByRole("button", { name: "Decrease Seats" })).toBeTruthy();
  });

  it("types into the controls the model defined", async () => {
    const { getByRole, user } = renderStack([
      {
        type: "TextField",
        label: "Email",
        name: "email",
        placeholder: "you@x.io",
        inputType: "email",
      },
      { type: "TextArea", label: "Notes", name: "notes" },
    ]);

    expect(getByRole("textbox", { name: "Email" }).getAttribute("type")).toBe("email");
    expect(getByRole("textbox", { name: "Email" }).getAttribute("placeholder")).toBe("you@x.io");
    await user.type(getByRole("textbox", { name: "Notes" }), "hi");
    expect((getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement).value).toBe("hi");
  });

  it("falls back to text for an unknown field type", () => {
    const { getByRole } = renderStack([
      { type: "TextField", label: "Email", name: "email", inputType: "file" },
    ]);

    expect(getByRole("textbox", { name: "Email" }).getAttribute("type")).toBe("text");
  });

  it("chooses a select option", async () => {
    const { getByRole, user } = renderStack([
      {
        type: "Select",
        label: "Region",
        name: "region",
        options: ["North", { value: "s", label: "South" }],
      },
    ]);

    await user.click(getByRole("button", { name: /Region/ }));
    await user.click(getByRole("option", { name: "South", hidden: true }));

    expect(getByRole("button", { name: /Region/ }).textContent).toBe("South");
  });
});

describe("accessibility", () => {
  it("has no axe violations in the full catalog", async () => {
    const { container } = renderResponse(kitchenSink);

    await expectNoAxeViolations(container);
  }, 60_000);

  it("has no axe violations in every state of the empty facades", async () => {
    const { container } = renderStack([
      { type: "BarChart", title: "None", data: [] },
      { type: "Tabs", tabs: [] },
      { type: "Accordion", items: [] },
      { type: "Select", label: "L", name: "n", options: [] },
      { type: "Table", caption: "C", columns: [], rows: [] },
    ]);

    await expectNoAxeViolations(container);
  });
});
