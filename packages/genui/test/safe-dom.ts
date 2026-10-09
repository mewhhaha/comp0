import { expect } from "vitest";

const forbiddenTags =
  "script, iframe, frame, object, embed, applet, base, meta, link, style, svg script";
const urlAttributes = [
  "href",
  "src",
  "action",
  "formaction",
  "poster",
  "srcset",
  "xlink:href",
  "data",
];
const safeSchemes = new Set(["http", "https", "mailto", "tel"]);

function schemeOf(value: string): string | undefined {
  // Browsers drop tabs, newlines, and leading controls before reading a scheme.
  // oxlint-disable-next-line no-control-regex -- matching control characters is the point.
  const cleaned = value.replace(/[\u0000- ]/g, "").toLowerCase();
  return /^([a-z][a-z0-9+.-]*):/.exec(cleaned)?.[1];
}

/**
 * Asserts that nothing a model wrote reached the DOM as anything but inert content: no active
 * elements, no inline event handlers, no styles that load resources, and only safe URL schemes.
 * Problems are collected and asserted once, so large documents stay fast.
 */
export function expectSafeDom(container: Element) {
  const problems: string[] = [];
  for (const element of container.querySelectorAll(forbiddenTags)) {
    problems.push(`forbidden element <${element.tagName.toLowerCase()}>`);
  }
  for (const element of container.querySelectorAll("*")) {
    for (const name of element.getAttributeNames()) {
      const value = element.getAttribute(name) ?? "";
      const where = `<${element.tagName.toLowerCase()} ${name}="${value.slice(0, 80)}">`;
      if (name.startsWith("on")) problems.push(`event handler ${where}`);
      if (name === "srcdoc") problems.push(`srcdoc ${where}`);
      if (name === "style" && /url\(|expression\(|javascript:|@import/i.test(value)) {
        problems.push(`style that loads a resource ${where}`);
      }
      if (urlAttributes.includes(name)) {
        const scheme = schemeOf(value);
        if (scheme !== undefined && !safeSchemes.has(scheme)) problems.push(`unsafe URL ${where}`);
        if (value.trim().startsWith("//")) problems.push(`protocol-relative URL ${where}`);
      }
    }
  }
  expect(problems, "unsafe DOM").toEqual([]);
}
