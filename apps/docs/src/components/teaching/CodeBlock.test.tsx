import { ToastProvider } from "@comp0/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./CodeBlock.js";

const examples = [
  ["bash", "pnpm add @comp0/react"],
  ["css", ".button { color: rebeccapurple; }"],
  [
    "tsx",
    `import { Button } from "./Button";

export function Example() {
  return <Button variant="primary">Save</Button>;
}`,
  ],
] as const;

describe("CodeBlock", () => {
  it.each(examples)("highlights %s on the server", async (language, source) => {
    const block = await CodeBlock({ code: source, language });
    const markup = renderToStaticMarkup(<ToastProvider>{block}</ToastProvider>);
    const container = document.createElement("div");
    container.innerHTML = markup;

    const code = container.querySelector<HTMLElement>("code");
    const pre = container.querySelector<HTMLPreElement>("pre");
    expect(code).not.toBeNull();
    expect(pre).not.toBeNull();
    expect(code!.dataset.language).toBe(language);
    expect(code!.hasAttribute("data-highlighted")).toBe(true);
    expect(code!.textContent).toBe(source);
    expect(code!.querySelector("button")).toBeNull();
    expect(code!.querySelectorAll(".line > span").length).toBeGreaterThan(1);
    expect(pre!.tabIndex).toBe(0);
  });
});
