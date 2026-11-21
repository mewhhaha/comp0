import { act, useState } from "react";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTrigger } from "./index.js";
import { cleanupRoots, render } from "../test/render.js";

// Focus contracts of a modal dialog in a real browser: focus returns to the opener, Tab stays
// inside the open layer, and content added while open is handled. Shown with Dialog because it owns the modal `<dialog>` and its focus restore.

/** Names the element each Tab lands on; the browser UI (no body focus in a real page) is "(outside page)". */
async function tabStops(count: number) {
  const stops: string[] = [];
  for (let index = 0; index < count; index++) {
    await userEvent.tab();
    const active = document.activeElement;
    stops.push(active === document.body ? "(outside page)" : active!.textContent!.trim());
  }
  return stops;
}

describe("modal dialog focus", () => {
  afterEach(() => {
    cleanupRoots();
  });

  it("returns focus to the opener on Escape, even when a child autofocuses", async () => {
    const { container, unmount } = render(
      <Dialog>
        <DialogTrigger>Open details</DialogTrigger>
        <DialogContent aria-label="Details">
          {/* oxlint-disable-next-line jsx-a11y/no-autofocus -- the contract under test is that focus still returns to the opener when a child autofocuses */}
          <input aria-label="Name" autoFocus />
          <button type="button">Done</button>
        </DialogContent>
      </Dialog>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    await act(async () => userEvent.click(trigger));
    expect(document.querySelector("dialog[open]")).not.toBeNull();

    await act(async () => userEvent.keyboard("{Escape}"));
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    unmount();
  });

  it("keeps Tab inside the dialog, skipping disabled, tabIndex -1 and hidden controls", async () => {
    const { unmount } = render(
      <>
        <button type="button">Outside</button>
        <Dialog defaultOpen>
          <DialogContent aria-label="Details">
            <button type="button">First</button>
            <button type="button" disabled>
              Disabled
            </button>
            <button type="button" tabIndex={-1}>
              Skipped
            </button>
            <div hidden>
              <button type="button">Hidden</button>
            </div>
            <button type="button">Last</button>
          </DialogContent>
        </Dialog>
      </>,
    );
    const stops = await tabStops(8);
    expect(new Set(stops.filter((stop) => stop !== "(outside page)"))).toEqual(
      new Set(["First", "Last"]),
    );
    unmount();
  });

  it("keeps content added while open inside the trap", async () => {
    function Harness() {
      const [added, setAdded] = useState(false);
      return (
        <Dialog defaultOpen>
          <DialogContent aria-label="Details">
            <button type="button" onClick={() => setAdded(true)}>
              Add
            </button>
            {added ? <button type="button">Late</button> : null}
          </DialogContent>
        </Dialog>
      );
    }
    const { unmount } = render(
      <>
        <button type="button">Outside</button>
        <Harness />
      </>,
    );
    await act(async () => userEvent.click(buttonNamed("Add")));
    const stops = await tabStops(4);
    expect(stops).toContain("Late");
    expect(stops).not.toContain("Outside");
    unmount();
  });
});

function buttonNamed(name: string) {
  return [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent?.trim() === name,
  )!;
}
