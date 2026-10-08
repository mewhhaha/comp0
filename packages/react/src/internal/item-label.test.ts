import { describe, expect, it } from "vitest";
import { resolveItemLabel } from "./item-label.js";

function element(text: string) {
  const node = document.createElement("div");
  node.innerHTML = text;
  return node;
}

describe("resolveItemLabel", () => {
  const base = { textValue: undefined, children: null, element: null, ariaLabel: undefined };

  it("prefers an explicit textValue over everything else", () => {
    expect(
      resolveItemLabel({
        ...base,
        textValue: "Explicit",
        children: "Child",
        element: element("Crawled"),
        ariaLabel: "Aria",
        fallback: "value",
      }),
    ).toBe("Explicit");
  });

  it("uses string children before crawling the element", () => {
    expect(
      resolveItemLabel({ ...base, children: "Child", element: element("Crawled"), fallback: "v" }),
    ).toBe("Child");
  });

  it("crawls the rendered element and collapses whitespace", () => {
    expect(
      resolveItemLabel({
        ...base,
        children: [],
        element: element("  New <strong>York</strong>\n  City "),
        fallback: "v",
      }),
    ).toBe("New York City");
  });

  it("falls back to the aria-label, then the value", () => {
    expect(
      resolveItemLabel({ ...base, element: element(""), ariaLabel: "Aria", fallback: "v" }),
    ).toBe("Aria");
    expect(resolveItemLabel({ ...base, element: element(" "), fallback: "value" })).toBe("value");
    expect(resolveItemLabel({ ...base, fallback: "value" })).toBe("value");
  });

  it("treats an empty textValue as absent", () => {
    expect(resolveItemLabel({ ...base, textValue: "", children: "Child", fallback: "v" })).toBe(
      "Child",
    );
  });
});
