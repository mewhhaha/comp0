import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { Toast } from "./Toast.js";
import { ToastClose } from "./ToastClose.js";
import { ToastProvider } from "./ToastProvider.js";
import { ToastRegion } from "./ToastRegion.js";
import { useToast } from "./useToast.js";

function NotifyButton({ content }: { content: ReactNode }) {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify(content, { timeout: null })}>
      Notify
    </button>
  );
}

function App() {
  return (
    <ToastProvider>
      <NotifyButton content="Saved" />
      <ToastRegion>
        {(toast) => (
          <Toast toast={toast}>
            {toast.content}
            <ToastClose />
          </Toast>
        )}
      </ToastRegion>
    </ToastProvider>
  );
}

function dismissButtons() {
  return document.querySelectorAll<HTMLButtonElement>("[data-slot='toast-close']");
}

describe("toast dismissal", () => {
  it("removes only its own toast through ToastClose with a default label", async () => {
    const { getByRole, user } = setup(<App />);
    await user.click(getByRole("button", { name: "Notify" }));
    await user.click(getByRole("button", { name: "Notify" }));

    const buttons = dismissButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.getAttribute("aria-label")).toBe("Dismiss notification");
    expect(buttons[0]!.getAttribute("type")).toBe("button");

    await user.click(buttons[0]!);
    expect(document.querySelectorAll("[role='status']")).toHaveLength(1);
  });

  it("moves focus to the next toast when dismissing a focused toast", async () => {
    const { getByRole, user } = setup(<App />);
    await user.click(getByRole("button", { name: "Notify" }));
    await user.click(getByRole("button", { name: "Notify" }));

    const buttons = dismissButtons();
    await user.click(buttons[0]!);

    expect(document.querySelectorAll("[role='status']")).toHaveLength(1);
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("dismissing an unfocused toast leaves focus alone", async () => {
    const { getByRole, user } = setup(<App />);
    const notify = getByRole("button", { name: "Notify" });
    await user.click(notify);

    // Dismiss through the keyboard-free path: focus stays on Notify.
    notify.focus();
    document.querySelector<HTMLButtonElement>("[data-slot='toast-close']")!.click();

    expect(document.activeElement).toBe(notify);
  });
});
