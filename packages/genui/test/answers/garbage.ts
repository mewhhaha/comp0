import { type JsonValue } from "../../src/json/parse.js";

/**
 * What a confused or hostile model writes: unknown components, wrong prop types, markup, unsafe
 * URLs, missing names, undeclared props, and broken expressions. Nothing here may throw, warn,
 * or reach the DOM as anything but inert text.
 */
export const garbage: JsonValue = {
  type: "Stack",
  children: [
    { type: "Text", text: "Here is what I found." },
    { type: "Carousel", children: [{ type: "Text", text: "slide" }], autoplay: true },
    {
      type: "Stack",
      children: [
        { type: "Text", text: "<img src=x onerror=alert(1)>" },
        { type: "Text", text: "<script>alert(1)</script>" },
        { type: "Heading", text: "<b>bold</b>", level: 99 },
        {
          type: "Alert",
          message: "<a href='javascript:alert(1)'>click</a>",
          tone: "explosive",
          title: "<i>title</i>",
        },
      ],
    },
    {
      type: "Stack",
      children: [
        { type: "Link", label: "Evil", href: "javascript:alert(1)" },
        { type: "Link", label: "Data", href: "data:text/html,<script>alert(1)</script>" },
        { type: "Link", label: "Spaced", href: " java\tscript:alert(1)" },
        { type: "Link", label: "Protocol relative", href: "//evil.example/x" },
        { type: "Link", label: "Fine", href: "https://example.com" },
        { type: "Image", src: "javascript:alert(1)", alt: "bad" },
        { type: "Image", src: "data:image/svg+xml,<svg onload=alert(1)>", alt: "also bad" },
        { type: "Image", src: "/ok.png", alt: "A good image" },
      ],
    },
    {
      type: "Stack",
      children: [
        { type: "Slider", label: 5, name: "n" },
        { type: "NumberField", label: "N", name: "n", value: "lots", min: "min", max: {} },
        { type: "Select", label: "S", name: "s", options: "not a list" },
        { type: "RadioGroup", label: "R", name: "r", options: [1, 2, null, [3]] },
        { type: "BarChart", title: 42, data: "data" },
        {
          type: "LineChart",
          title: "L",
          data: [
            { x: "a", y: "b" },
            { x: 1, y: 1 },
          ],
        },
        { type: "Table", caption: 1, columns: "cols", rows: "rows" },
        { type: "Meter", label: "M", value: "big", min: 10, max: 0 },
        { type: "ProgressBar", label: "P", value: 1e308 },
        { type: "Comparison", caption: "C", options: "options", features: "features" },
        { type: "CitedText", text: 7, sources: "sources" },
        { type: "Suggestions", label: 1, items: 2 },
        { type: "CopyButton", label: null, value: 3 },
        { type: "Output", label: 9, value: [1] },
        { type: "Select", name: "no-label" },
        { type: "Button" },
        { type: "Output", label: "Broken", value: { $expr: "1 +" } },
        { type: "Output", label: "Hidden", value: { $expr: "constructor" } },
        { type: "Output", label: "Call", value: { $expr: "alert(1)" } },
        { type: "Output", label: "Access", value: { $expr: "seats.length" } },
        { type: "TextField", label: "Name", name: "name", value: { $bind: "not a name!" } },
        { type: "Text", text: "x", onClick: "alert(1)", style: "color:red", className: "evil" },
        { type: "Text", text: "y", children: [{ type: "Text", text: "nested under text" }] },
      ],
    },
    {
      type: "Stack",
      children: [
        { type: "Text", text: "" },
        { type: "Heading", text: "" },
        { type: "Card", title: "", children: [] },
        { type: "Grid", children: [], columns: 0 },
        { type: "Tabs", tabs: [] },
        { type: "Accordion", items: [] },
        { type: "Table", caption: "", columns: [], rows: [] },
        { type: "PieChart", title: "", data: [] },
        { type: "Form", name: "", title: "", children: [] },
        { type: "List", items: [] },
        { type: "Alert", message: "" },
        "a bare string",
        null,
        [1, 2, 3],
        { children: [] },
        { type: 7 },
        { type: "Script", src: "alert(1)" },
        { type: "Iframe", src: "https://evil.example" },
        { type: "__proto__" },
        { type: "constructor" },
      ],
    },
  ],
};
