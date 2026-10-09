import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { genuiPromptExamples } from "./prompt/prompt.js";
import { GenUI } from "./render/GenUI.js";
import { asJson } from "../test/answers/index.js";
import { kitchenSink } from "../test/fixtures.js";
import { renderResponse, renderStack } from "../test/render.js";

let consoleError: ReturnType<typeof vi.spyOn>;
let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

function reported() {
  return [...consoleError.mock.calls, ...consoleWarn.mock.calls].map((call) =>
    call.map(String).join(" ").slice(0, 300),
  );
}

const text = { type: "Stack", children: [{ type: "Text", text: "hi" }] };

describe("busy region", () => {
  it("marks the output busy while streaming and settled after", () => {
    const response = JSON.stringify(text);
    const { container, rerender } = renderResponse(response, { streaming: true });
    const region = container.querySelector("[data-slot='busy-region']");

    expect(region?.getAttribute("aria-busy")).toBe("true");
    expect(region?.hasAttribute("data-busy")).toBe(true);

    rerender(<GenUI response={response} streaming={false} />);

    const settled = container.querySelector("[data-slot='busy-region']");
    expect(settled?.hasAttribute("aria-busy")).toBe(false);
    expect(settled?.hasAttribute("data-busy")).toBe(false);
  });

  it("is not busy by default", () => {
    const { container } = renderResponse(text);

    expect(container.querySelector("[aria-busy]")).toBeNull();
  });

  it("renders an empty response", () => {
    for (const response of [null, "", undefined]) {
      const { container, unmount } = renderResponse(response as never);
      expect(container.querySelector("[data-slot='busy-region']")).not.toBeNull();
      expect(container.textContent).toBe("");
      unmount();
    }
  });

  it("takes an already parsed object as well as text", () => {
    const { container } = renderResponse(text);

    expect(container.textContent).toBe("hi");
  });
});

describe("streaming a response", () => {
  it("renders the interface top-down as the response grows, without errors", () => {
    const source = asJson(kitchenSink);
    const step = 23;
    const { container, rerender } = renderResponse("", { streaming: true });

    for (let end = step; end < source.length; end += step) {
      rerender(<GenUI response={source.slice(0, end)} streaming />);
    }
    expect(container.querySelector("form")).not.toBeNull();
    rerender(<GenUI response={source} streaming={false} />);

    expect(container.querySelector("[aria-busy]")).toBeNull();
    expect(container.querySelectorAll("figure").length).toBeGreaterThanOrEqual(5);
    expect(reported()).toEqual([]);
  }, 60_000);

  it("renders a response cut at any point without errors", () => {
    const source = asJson(kitchenSink);
    const cuts = new Set<number>();
    for (let index = 1; index < source.length; index += 97) cuts.add(index);
    // Cut inside every prop, string, and number of the first components.
    for (let index = 1; index < 600; index += 3) cuts.add(index);

    for (const end of cuts) {
      const { unmount } = renderResponse(source.slice(0, end), { streaming: true });
      unmount();
    }

    expect(reported()).toEqual([]);
  }, 120_000);

  it.each(genuiPromptExamples.map((example, index) => [index, asJson(example)] as const))(
    "renders prompt example %i cut at every character",
    (_index, example) => {
      for (let end = 1; end <= example.length; end += 1) {
        const { unmount } = renderResponse(example.slice(0, end), {
          streaming: end < example.length,
        });
        unmount();
      }

      expect(reported()).toEqual([]);
    },
    120_000,
  );

  it("renders every component with only its required props", () => {
    const minimal = [
      { type: "Stack", children: [] },
      { type: "Grid", children: [] },
      { type: "Card", title: "T", children: [] },
      { type: "Heading", text: "H" },
      { type: "Text", text: "t" },
      { type: "Image", src: "/a.png", alt: "Alt" },
      { type: "List", items: [] },
      { type: "Button", label: "B" },
      { type: "Link", label: "L", href: "/x" },
      { type: "Form", name: "f", title: "F", children: [] },
      { type: "TextField", label: "L", name: "n" },
      { type: "TextArea", label: "L", name: "n" },
      { type: "NumberField", label: "L", name: "n" },
      { type: "Select", label: "L", name: "n", options: [] },
      { type: "RadioGroup", label: "L", name: "n", options: [] },
      { type: "CheckboxGroup", label: "L", name: "n", options: [] },
      { type: "Checkbox", label: "L", name: "n" },
      { type: "Switch", label: "L", name: "n" },
      { type: "Slider", label: "L", name: "n" },
      { type: "DatePicker", label: "L", name: "n" },
      { type: "Tabs", tabs: [] },
      { type: "Accordion", items: [] },
      { type: "Disclosure", summary: "S", children: [] },
      { type: "Table", caption: "C", columns: [], rows: [] },
      { type: "BarChart", title: "T", data: [] },
      { type: "ColumnChart", title: "T", data: [] },
      { type: "LineChart", title: "T", data: [] },
      { type: "AreaChart", title: "T", data: [] },
      { type: "PieChart", title: "T", data: [] },
      { type: "Meter", label: "L", value: 5 },
      { type: "ProgressBar", label: "L" },
      { type: "Alert", message: "M" },
      { type: "Separator" },
      { type: "Output", label: "L", value: 1 },
      { type: "Comparison", caption: "C", options: ["A"], features: [] },
      { type: "CitedText", text: "t", sources: [] },
      { type: "Suggestions", label: "L", items: [] },
      { type: "CopyButton", label: "L", value: "v" },
    ];
    for (const component of minimal) {
      const { container, unmount } = renderStack([component]);
      expect(container.querySelector("[data-slot='stack']"), component.type).not.toBeNull();
      unmount();
    }

    expect(reported()).toEqual([]);
  }, 60_000);

  it("renders half-written props of every kind", () => {
    const halfWritten = [
      '{"type": "Select", "label": "Pl", "name": "pl", "options": ["a", {"value": "b", "label": "B"}, {"value": "',
      '{"type": "Select", "label": "Pl", "name": "pl", "options": ["x", "x", {"value": "x"',
      '{"type": "BarChart", "title": "T", "data": [{"label": "A", "value": 1}, {"label": "B"',
      '{"type": "Tabs", "tabs": [{"label": "One", "children": [{"type": "Text", "text": "a"}]}, {"label": "',
      '{"type": "Accordion", "items": [{"title": "T", "children": [{"type": "Text", "text": "a"}], "open": tru',
      '{"type": "Image", "src": "/a.png", "alt": "A", "caption": "Cap',
      '{"type": "Meter", "label": "L", "value": 5',
      '{"type": "Table", "caption": "C", "columns": ["A", "B"], "rows": [["x"], ["y", 1',
      '{"type": "Slider", "label": "S", "name": "s", "value": {"$bind": "s", "initial": 1',
      '{"type": "Output", "label": "O", "value": {"$expr": "s *',
    ];
    for (const component of halfWritten) {
      const { unmount } = renderResponse(`{"type": "Stack", "children": [${component}`, {
        streaming: true,
      });
      unmount();
    }

    expect(reported()).toEqual([]);
  }, 60_000);

  it("renders complete but unusual data without warnings", () => {
    const unusual = [
      {
        type: "Select",
        label: "Pl",
        name: "pl",
        options: ["x", "x", { value: "x", label: "Again" }, { value: "", label: "No value" }, ""],
      },
      {
        type: "BarChart",
        title: "T",
        data: [
          { label: "A", value: 1 },
          { label: "A", value: 2 },
          { label: "", value: 3 },
        ],
      },
      {
        type: "PieChart",
        title: "T",
        data: [
          { label: "A", value: 0 },
          { label: "B", value: 0 },
        ],
      },
      {
        type: "PieChart",
        title: "T",
        data: [
          { label: "A", value: -4 },
          { label: "B", value: 4 },
        ],
      },
      {
        type: "LineChart",
        title: "T",
        data: [
          { x: 2, y: 1 },
          { x: 1, y: 2 },
          { x: 1, y: 3 },
        ],
      },
      { type: "AreaChart", title: "T", data: [{ x: 1, y: 1 }] },
      {
        type: "Table",
        caption: "C",
        columns: ["A", "B"],
        rows: [["x"], ["y", 1, 2, 3], [], [null, true]],
      },
      { type: "Meter", label: "L", value: 500, min: 0, max: 10, low: 20, high: 5 },
      { type: "Meter", label: "L", value: 5, min: 10, max: 0 },
      { type: "Slider", label: "L", name: "n", min: 10, max: 0, value: 50 },
      { type: "NumberField", label: "L", name: "n", value: 5, min: 10, max: 1 },
      { type: "DatePicker", label: "L", name: "n", value: "not a date" },
      { type: "Grid", children: [{ type: "Text", text: "a" }], columns: 99 },
      { type: "Heading", text: "H", level: 9 },
      { type: "Tabs", tabs: [{ label: "", children: [{ type: "Text", text: "a" }] }] },
      {
        type: "Accordion",
        items: [
          { title: "A", open: true, children: [] },
          { title: "B", open: true, children: [] },
        ],
      },
      { type: "ProgressBar", label: "L", value: 250 },
    ];
    for (const component of unusual) {
      const { unmount } = renderStack([component]);
      unmount();
    }

    expect(reported()).toEqual([]);
  }, 60_000);

  it("keeps a typed value, focus, and the elements already drawn while more of the response arrives", async () => {
    const head =
      '{"type": "Stack", "children": [{"type": "Form", "name": "f", "title": "F", "children": [{"type": "TextField", "label": "Name", "name": "name"}, {"type": "TextField", "label": "Email", "name": "email"}';
    const { getByRole, user, rerender, container } = renderResponse(`${head}]}]}`, {
      streaming: true,
    });
    const input = getByRole("textbox", { name: "Name" }) as HTMLInputElement;
    const form = container.querySelector("form");

    await user.type(input, "Ada");
    expect(document.activeElement).toBe(input);
    await act(async () => {
      rerender(
        <GenUI
          response={`${head}, {"type": "TextField", "label": "Phone", "name": "phone", "inputType": "tel"}]}]}`}
          streaming
        />,
      );
    });

    expect(getByRole("textbox", { name: "Name" })).toBe(input);
    expect(container.querySelector("form")).toBe(form);
    expect(input.value).toBe("Ada");
    expect(document.activeElement).toBe(input);
    expect(getByRole("textbox", { name: "Phone" })).toBeTruthy();
  });
});
