import { Toast, ToastProvider, ToastRegion } from "@comp0/react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { CodeBlockCopyButton } from "./CodeBlockCopyButton.js";

describe("CodeBlockCopyButton", () => {
  it("copies the server-rendered code and announces a toast", async () => {
    const source = "pnpm add @comp0/react";
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      act(() => {
        root.render(
          <ToastProvider>
            <CodeBlockCopyButton code={source} />
            <ToastRegion>{(toast) => <Toast toast={toast} />}</ToastRegion>
          </ToastProvider>,
        );
      });

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
      vi.restoreAllMocks();
    }
  });
});
