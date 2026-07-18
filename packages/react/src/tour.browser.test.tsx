import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Tour } from "./components/Tour.js";
import { TourOverlay } from "./components/TourOverlay.js";
import { TourTrigger } from "./components/TourTrigger.js";

describe("Tour browser behavior", () => {
  it("blocks pointer interaction with the application behind an open step", async () => {
    const activated = vi.fn();
    const { container, unmount } = render(
      <Tour steps={[{ target: "search", title: "Find anything" }]}>
        <TourTrigger>Start tour</TourTrigger>
        <button type="button" data-tour-target="search" style={{ width: 100, height: 40 }}>
          Search
        </button>
        <button
          type="button"
          data-testid="background-action"
          onClick={activated}
          style={{ width: 100, height: 40 }}
        >
          Delete project
        </button>
        <TourOverlay aria-label="Product tour" style={{ width: 240 }}>
          {({ step }) => step.title}
        </TourOverlay>
      </Tour>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='tour-trigger']")!;
    const backgroundAction = container.querySelector<HTMLButtonElement>(
      "[data-testid='background-action']",
    )!;

    await act(async () => userEvent.click(trigger));
    expect(document.querySelector("dialog:modal")).not.toBeNull();

    await page.elementLocator(backgroundAction).click({ force: true });
    expect(activated).not.toHaveBeenCalled();
    unmount();
  });
});
