import { act } from "react";
import { page } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import { render } from "../test/render.js";
import { Tour } from "./components/Tour.js";
import { TourOverlay } from "./components/TourOverlay.js";
import { TourTrigger } from "./components/TourTrigger.js";

describe("Tour browser behavior", () => {
  it("blocks pointer interaction with the application behind an open step", async () => {
    const activated = vi.fn();
    const { unmount } = render(
      <Tour steps={[{ target: "search", title: "Find anything" }]}>
        <TourTrigger>Start tour</TourTrigger>
        <button type="button" data-tour-target="search" style={{ width: 100, height: 40 }}>
          Search
        </button>
        <button type="button" onClick={activated} style={{ width: 100, height: 40 }}>
          Delete project
        </button>
        <TourOverlay aria-label="Product tour" style={{ width: 240 }}>
          {({ step }) => step.title}
        </TourOverlay>
      </Tour>,
    );
    const trigger = page.getByRole("button", { name: "Start tour" });
    const backgroundAction = page.getByRole("button", { name: "Delete project" });

    await act(async () => trigger.click());
    await expect.element(page.getByRole("dialog", { name: "Product tour" })).toBeInTheDocument();

    await act(async () => backgroundAction.click({ force: true }));
    expect(activated).not.toHaveBeenCalled();
    unmount();
  });
});
