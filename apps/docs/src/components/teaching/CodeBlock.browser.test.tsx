import { act } from "react";
import { createRoot } from "react-dom/client";
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
  it.each(examples)(
    "highlights %s without turning literal markup into live elements",
    async (language, source) => {
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);

      try {
        act(() => {
          root.render(<CodeBlock code={source} language={language} />);
        });

        const code = container.querySelector<HTMLElement>("code");
        const pre = container.querySelector<HTMLPreElement>("pre");
        expect(code).not.toBeNull();
        expect(pre).not.toBeNull();

        await act(async () => {
          for (
            let attempt = 0;
            attempt < 100 && !code!.hasAttribute("data-highlighted");
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        });

        expect(code!.dataset.language).toBe(language);
        expect(code!.dataset.highlighted).toBe("true");
        expect(code!.textContent).toBe(source);
        expect(code!.querySelector("button")).toBeNull();

        const tokenSpans = code!.querySelectorAll(".line > span");
        expect(tokenSpans.length).toBeGreaterThan(1);
        expect(Array.from(tokenSpans).some((span) => span.hasAttribute("style"))).toBe(true);
        expect(pre!.tabIndex).toBe(0);
      } finally {
        act(() => root.unmount());
        container.remove();
      }
    },
  );
});
