import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Toast } from "./components/Toast.js";
import { ToastDismiss } from "./components/ToastDismiss.js";
import { ToastProvider } from "./components/ToastProvider.js";
import { ToastRegion } from "./components/ToastRegion.js";
import { useToast } from "./components/useToast.js";
import { type ToastOptions } from "./components/toast-shared.js";

function NotifyButton({
  content,
  options,
}: {
  content: ReactNode;
  options?: ToastOptions | undefined;
}) {
  const { notify } = useToast();
  return (
    <button type="button" data-testid="notify" onClick={() => notify(content, options)}>
      Notify
    </button>
  );
}

function App({
  content = "Saved",
  forceMount,
  options,
}: {
  content?: ReactNode | undefined;
  forceMount?: boolean | undefined;
  options?: ToastOptions | undefined;
}) {
  return (
    <ToastProvider>
      <NotifyButton content={content} options={options} />
      <ToastRegion forceMount={forceMount}>
        {(toast) => (
          <Toast toast={toast}>
            {toast.content}
            <ToastDismiss />
          </Toast>
        )}
      </ToastRegion>
    </ToastProvider>
  );
}

function notifyButton(container: HTMLElement) {
  return container.querySelector<HTMLButtonElement>('[data-testid="notify"]')!;
}

// React synthesizes onPointerEnter and onPointerLeave from pointerover and
// pointerout crossings, so hover simulation dispatches those primitives.
function hoverStart(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  });
}

function hoverEnd(element: Element) {
  act(() => {
    element.dispatchEvent(
      new MouseEvent("pointerout", { bubbles: true, relatedTarget: document.body }),
    );
  });
}

describe("toast composition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the region only while toasts exist, with role and label wired", () => {
    const { container } = render(<App />);
    expect(document.querySelector("[role='region']")).toBeNull();

    fireClick(notifyButton(container));

    const region = document.querySelector("[role='region']")!;
    expect(region.getAttribute("aria-label")).toBe("Notifications");
    expect(region.getAttribute("popover")).toBe("manual");
    const status = region.querySelector("[role='status']")!;
    expect(status.textContent).toContain("Saved");
    expect(status.getAttribute("data-kind")).toBe("status");
  });

  it("keeps an empty region rendered with forceMount", () => {
    render(<App forceMount />);
    expect(document.querySelector("[role='region']")).not.toBeNull();
  });

  it("renders kind alert as role=alert", () => {
    const { container } = render(<App content="Offline" options={{ kind: "alert" }} />);
    fireClick(notifyButton(container));

    const alert = document.querySelector("[role='alert']")!;
    expect(alert.textContent).toContain("Offline");
    expect(alert.getAttribute("data-kind")).toBe("alert");
  });

  it("auto-dismisses after the default timeout", () => {
    const { container } = render(<App />);
    fireClick(notifyButton(container));
    expect(document.querySelector("[role='status']")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(5999);
    });
    expect(document.querySelector("[role='status']")).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(document.querySelector("[role='status']")).toBeNull();
    expect(document.querySelector("[role='region']")).toBeNull();
  });

  it("keeps timeout null toasts until dismissed", () => {
    const { container } = render(<App options={{ timeout: null }} />);
    fireClick(notifyButton(container));

    act(() => {
      vi.advanceTimersByTime(600_000);
    });
    expect(document.querySelector("[role='status']")).not.toBeNull();

    fireClick(document.querySelector("[data-slot='toast-dismiss']")!);
    expect(document.querySelector("[role='status']")).toBeNull();
  });

  it("pauses the remaining time while hovered and resumes on leave", () => {
    const { container } = render(<App />);
    fireClick(notifyButton(container));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const region = document.querySelector("[role='region']")!;
    hoverStart(region);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(document.querySelector("[role='status']")).not.toBeNull();

    hoverEnd(region);
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(document.querySelector("[role='status']")).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(document.querySelector("[role='status']")).toBeNull();
  });

  it("pauses while the region contains focus", () => {
    const { container } = render(<App />);
    fireClick(notifyButton(container));

    const dismiss = document.querySelector<HTMLButtonElement>("[data-slot='toast-dismiss']")!;
    act(() => {
      dismiss.focus();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(document.querySelector("[role='status']")).not.toBeNull();

    act(() => {
      dismiss.blur();
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(document.querySelector("[role='status']")).toBeNull();
  });

  it("removes only its own toast through ToastDismiss with a default label", () => {
    const { container } = render(<App options={{ timeout: null }} />);
    fireClick(notifyButton(container));
    fireClick(notifyButton(container));

    const dismissButtons = document.querySelectorAll<HTMLButtonElement>(
      "[data-slot='toast-dismiss']",
    );
    expect(dismissButtons).toHaveLength(2);
    expect(dismissButtons[0]!.getAttribute("aria-label")).toBe("Dismiss notification");
    expect(dismissButtons[0]!.getAttribute("type")).toBe("button");

    fireClick(dismissButtons[0]!);
    expect(document.querySelectorAll("[role='status']")).toHaveLength(1);
  });

  it("moves focus to the next toast when dismissing a focused toast", () => {
    const { container } = render(<App options={{ timeout: null }} />);
    fireClick(notifyButton(container));
    fireClick(notifyButton(container));

    const dismissButtons = document.querySelectorAll<HTMLButtonElement>(
      "[data-slot='toast-dismiss']",
    );
    act(() => {
      dismissButtons[0]!.focus();
    });
    fireClick(dismissButtons[0]!);

    expect(document.querySelectorAll("[role='status']")).toHaveLength(1);
    expect(document.activeElement).toBe(dismissButtons[1]);
    expect(document.activeElement?.isConnected).toBe(true);
  });

  it("dismissing an unfocused toast leaves focus alone", () => {
    const { container } = render(<App options={{ timeout: null }} />);
    fireClick(notifyButton(container));

    const trigger = notifyButton(container);
    act(() => {
      trigger.focus();
    });
    fireClick(document.querySelector("[data-slot='toast-dismiss']")!);

    expect(document.activeElement).toBe(trigger);
  });

  it("throws a clear error when useToast is used outside ToastProvider", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useToast must be used inside a ToastProvider.");
    errorSpy.mockRestore();
  });
});
