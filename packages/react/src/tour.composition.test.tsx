import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Tour } from "./components/Tour.js";
import { TourOverlay } from "./components/TourOverlay.js";
import { TourTrigger } from "./components/TourTrigger.js";

const steps = [
  { target: "search", title: "Find anything", placement: "bottom" as const },
  { target: "create", title: "Create a project", placement: "right" as const },
];

function TourExample({ onStepChange }: { onStepChange?: (step: number | null) => void }) {
  return (
    <Tour steps={steps} onStepChange={onStepChange}>
      <TourTrigger>Start tour</TourTrigger>
      <button type="button" data-tour-target="search">
        Search
      </button>
      <button type="button" data-tour-target="create">
        Create
      </button>
      <TourOverlay aria-label="Project tour">
        {({ step, stepIndex, next, previous, close }) => (
          <>
            <p>{step.title}</p>
            <output>{stepIndex}</output>
            <button type="button" onClick={previous}>
              Previous
            </button>
            <button type="button" onClick={next}>
              Next
            </button>
            <button type="button" onClick={close}>
              Close
            </button>
          </>
        )}
      </TourOverlay>
    </Tour>
  );
}

describe("Tour composition", () => {
  it("anchors each step to its named target and restores target attributes", () => {
    const changed = vi.fn();
    const { container } = render(<TourExample onStepChange={changed} />);
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='tour-trigger']")!;
    const search = container.querySelector<HTMLElement>("[data-tour-target='search']")!;
    const create = container.querySelector<HTMLElement>("[data-tour-target='create']")!;
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-overlay']")!;

    fireClick(trigger);
    expect(changed).toHaveBeenLastCalledWith(0);
    expect(search.hasAttribute("data-tour-active")).toBe(true);
    expect(search.style.getPropertyValue("anchor-name")).toMatch(/^--comp0-anchor-/);
    expect(overlay.open).toBe(true);
    expect(overlay.dataset["target"]).toBe("search");
    expect(overlay.dataset["step"]).toBe("0");
    expect(overlay.style.getPropertyValue("position-area")).toBe("block-end");

    fireClick(
      Array.from(overlay.querySelectorAll("button")).find(
        (button) => button.textContent === "Next",
      )!,
    );
    expect(search.hasAttribute("data-tour-active")).toBe(false);
    expect(search.style.getPropertyValue("anchor-name")).toBe("");
    expect(create.hasAttribute("data-tour-active")).toBe(true);
    expect(overlay.dataset["target"]).toBe("create");
    expect(overlay.dataset["step"]).toBe("1");
    expect(overlay.style.getPropertyValue("position-area")).toBe("right");
  });

  it("finishes on the last step and restores focus to the tour trigger", () => {
    const { container } = render(<TourExample />);
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='tour-trigger']")!;
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-overlay']")!;

    trigger.focus();
    fireClick(trigger);
    fireClick(
      Array.from(overlay.querySelectorAll("button")).find(
        (button) => button.textContent === "Next",
      )!,
    );
    fireClick(
      Array.from(overlay.querySelectorAll("button")).find(
        (button) => button.textContent === "Next",
      )!,
    );

    expect(overlay.open).toBe(false);
    expect(container.querySelector("[data-tour-active]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("stays open when a controlled owner rejects a close request", () => {
    const changed = vi.fn();
    const { container } = render(
      <Tour steps={steps} step={0} onStepChange={changed}>
        <TourTrigger>Start tour</TourTrigger>
        <button type="button" data-tour-target="search">
          Search
        </button>
        <TourOverlay aria-label="Project tour">
          {({ close }) => (
            <button type="button" onClick={close}>
              Close
            </button>
          )}
        </TourOverlay>
      </Tour>,
    );
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-overlay']")!;
    const close = overlay.querySelector<HTMLButtonElement>("button")!;

    fireClick(close);

    expect(changed).toHaveBeenLastCalledWith(null);
    expect(overlay.open).toBe(true);
    expect(
      container.querySelector("[data-tour-target='search']")?.hasAttribute("data-tour-active"),
    ).toBe(true);
  });

  it("rejects empty and duplicate step definitions", () => {
    expect(() => render(<Tour steps={[]} />)).toThrow(
      "Tour requires at least one step; received 0.",
    );
    expect(() =>
      render(
        <Tour
          steps={[
            { target: "search", title: "First" },
            { target: "search", title: "Again" },
          ]}
        />,
      ),
    ).toThrow('Tour target "search" is used by more than one step.');
  });
});
