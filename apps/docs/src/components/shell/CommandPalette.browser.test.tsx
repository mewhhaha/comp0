import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { docsNavigation, paletteEntries } from "../../content/navigation.js";
import { DocsShell } from "./DocsShell.js";
import { fuzzyMatch } from "./CommandPalette.js";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function Harness() {
  return (
    <DocsShell navigation={docsNavigation} paletteEntries={paletteEntries}>
      <LocationProbe />
    </DocsShell>
  );
}

type MountedApp = {
  container: HTMLDivElement;
  root: Root;
  unmount: () => void;
};

function mount(): MountedApp {
  const container = document.createElement("div");
  document.body.append(container);
  const router = createMemoryRouter([{ path: "*", Component: Harness }]);
  const root = createRoot(container);
  act(() => root.render(<RouterProvider router={router} />));
  return {
    container,
    root,
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function paletteDialog() {
  return document.querySelector<HTMLDialogElement>('dialog[aria-label="Search documentation"]');
}

function paletteInput() {
  return document.querySelector<HTMLInputElement>('input[aria-label="Search docs"]');
}

function visibleOptionTitles() {
  const listbox = document.querySelector('[aria-label="Search results"]');
  return [...(listbox?.querySelectorAll("[role='option'] > span:first-child") ?? [])].map(
    (option) => option.textContent,
  );
}

function currentPath(container: HTMLElement) {
  return container.querySelector("[data-testid='location']")?.textContent;
}

async function openFromHeaderButton(container: HTMLElement) {
  const buttons = [...container.querySelectorAll<HTMLButtonElement>("header button")];
  const search = buttons.find((button) => button.textContent?.includes("Search docs"));
  if (!search) throw new Error("Missing header search button");
  await act(async () => userEvent.click(search));
}

function pressEscape(target: HTMLElement) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
  });
}

describe("CommandPalette", () => {
  it("matches subsequences case-insensitively", () => {
    expect(fuzzyMatch("Calendar", "clnd")).toBe(true);
    expect(fuzzyMatch("Calendar", "CAL")).toBe(true);
    expect(fuzzyMatch("Calendar", "dnlc")).toBe(false);
    expect(fuzzyMatch("Button", "clnd")).toBe(false);
  });

  it("opens from the header button and filters fuzzily", async () => {
    const app = mount();
    try {
      expect(paletteDialog()?.open).not.toBe(true);
      await openFromHeaderButton(app.container);

      const dialog = paletteDialog();
      expect(dialog?.open).toBe(true);
      expect(document.activeElement).toBe(paletteInput());
      expect(visibleOptionTitles().length).toBeGreaterThan(47);

      await act(async () => userEvent.fill(paletteInput()!, "clnd"));
      expect(visibleOptionTitles()).toEqual(["Calendar", "Range Calendar"]);
    } finally {
      app.unmount();
    }
  });

  it("navigates to the active option with Enter and closes", async () => {
    const app = mount();
    try {
      await openFromHeaderButton(app.container);
      const input = paletteInput()!;
      await act(async () => userEvent.fill(input, "clnd"));
      await act(async () => userEvent.keyboard("{ArrowDown}"));
      const activeId = input.getAttribute("aria-activedescendant");
      expect(document.getElementById(activeId!)?.textContent).toContain("Range Calendar");
      await act(async () => userEvent.keyboard("{Enter}"));

      expect(currentPath(app.container)).toBe("/components/range-calendar");
      await vi.waitFor(() => expect(paletteDialog()?.open).not.toBe(true));
    } finally {
      app.unmount();
    }
  });

  it("automatically activates and navigates to the first filtered result", async () => {
    const app = mount();
    try {
      await openFromHeaderButton(app.container);
      const input = paletteInput()!;
      await act(async () => userEvent.fill(input, "instl"));
      const activeId = input.getAttribute("aria-activedescendant");
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)?.textContent).toContain("Installation");
      expect(document.getElementById(activeId!)?.hasAttribute("data-active")).toBe(true);
      await act(async () => userEvent.keyboard("{Enter}"));

      expect(currentPath(app.container)).toBe("/learn/installation");
      await vi.waitFor(() => expect(paletteDialog()?.open).not.toBe(true));
    } finally {
      app.unmount();
    }
  });

  it("navigates when an option is clicked", async () => {
    const app = mount();
    try {
      await openFromHeaderButton(app.container);
      await act(async () => userEvent.fill(paletteInput()!, "clnd"));
      const option = document.querySelector<HTMLElement>(
        '[aria-label="Search results"] [role="option"]',
      );
      expect(option?.textContent).toContain("Calendar");
      await act(async () => userEvent.click(option!));

      expect(currentPath(app.container)).toBe("/components/calendar");
      await vi.waitFor(() => expect(paletteDialog()?.open).not.toBe(true));
    } finally {
      app.unmount();
    }
  });

  it("toggles with Ctrl+K and closes on a single Escape press", async () => {
    const app = mount();
    try {
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            key: "k",
          }),
        );
      });
      await vi.waitFor(() => expect(paletteDialog()?.open).toBe(true));

      const input = paletteInput()!;
      expect(document.activeElement).toBe(input);
      pressEscape(input);
      await vi.waitFor(() => expect(paletteDialog()?.open).not.toBe(true));
      // Reset for the next open: the query is cleared once closed.
      await act(async () => Promise.resolve());

      act(() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            key: "k",
          }),
        );
      });
      await vi.waitFor(() => expect(paletteDialog()?.open).toBe(true));
      expect(paletteInput()?.value).toBe("");
    } finally {
      app.unmount();
    }
  });
});
