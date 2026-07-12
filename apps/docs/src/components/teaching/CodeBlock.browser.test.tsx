import { Toast, ToastProvider, ToastRegion } from "@comp0/react";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
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

function renderWithToasts(root: Root, children: ReactNode) {
  act(() => {
    root.render(
      <ToastProvider>
        {children}
        <ToastRegion>{(toast) => <Toast toast={toast} />}</ToastRegion>
      </ToastProvider>,
    );
  });
}

describe("CodeBlock", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(examples)(
    "highlights %s without turning literal markup into live elements",
    async (language, source) => {
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);

      try {
        renderWithToasts(root, <CodeBlock code={source} language={language} />);

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

  it("copies the code and announces a toast", async () => {
    const source = "pnpm add @comp0/react";
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      renderWithToasts(root, <CodeBlock code={source} language="bash" />);

      const copyButton = container.querySelector<HTMLButtonElement>('[aria-label="Copy code"]');
      expect(copyButton).not.toBeNull();
      expect(document.querySelector('[data-slot="toast"]')).toBeNull();

      await act(async () => {
        copyButton!.click();
      });

      expect(writeText).toHaveBeenCalledExactlyOnceWith(source);
      const toast = document.querySelector<HTMLElement>('[data-slot="toast"]');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toBe("Copied to clipboard");
      expect(toast!.getAttribute("role")).toBe("status");
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  });
});
