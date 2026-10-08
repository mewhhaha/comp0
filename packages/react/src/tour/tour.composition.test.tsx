import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Tour } from "./Tour.js";
import { TourContent } from "./TourContent.js";
import { TourTrigger } from "./TourTrigger.js";

const steps = [
  { target: "search", title: "Find anything", placement: "bottom" as const },
  { target: "create", title: "Create a project", placement: "right" as const },
];

function TourExample({ onStepChange }: { onStepChange?: (step: number | null) => void }) {
  return (
    <Tour steps={steps} onChange={onStepChange}>
      <TourTrigger>Start tour</TourTrigger>
      <button type="button" data-tour-target="search">
        Search
      </button>
      <button type="button" data-tour-target="create">
        Create
      </button>
      <TourContent aria-label="Project tour">
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
      </TourContent>
    </Tour>
  );
}

describe("Tour composition", () => {
  it("anchors each step to its named target and restores target attributes", async () => {
    const changed = vi.fn();
    const { container, user } = setup(<TourExample onStepChange={changed} />);
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='tour-trigger']")!;
    const search = container.querySelector<HTMLElement>("[data-tour-target='search']")!;
    const create = container.querySelector<HTMLElement>("[data-tour-target='create']")!;
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-content']")!;

    await user.click(trigger);
    expect(changed).toHaveBeenLastCalledWith(0);
    expect(search.hasAttribute("data-tour-active")).toBe(true);
    expect(search.style.getPropertyValue("anchor-name")).toMatch(/^--comp0-anchor-/);
    expect(overlay.open).toBe(true);
    expect(overlay.dataset["target"]).toBe("search");
    expect(overlay.dataset["step"]).toBe("0");
    expect(overlay.style.getPropertyValue("position-area")).toBe("block-end");

    await user.click(
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

  it("finishes on the last step and restores focus to the tour trigger", async () => {
    const { container, user } = setup(<TourExample />);
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='tour-trigger']")!;
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-content']")!;

    await user.click(trigger);
    await user.click(
      Array.from(overlay.querySelectorAll("button")).find(
        (button) => button.textContent === "Next",
      )!,
    );
    await user.click(
      Array.from(overlay.querySelectorAll("button")).find(
        (button) => button.textContent === "Next",
      )!,
    );

    expect(overlay.open).toBe(false);
    expect(container.querySelector("[data-tour-active]")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("stays open when a controlled owner rejects a close request", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <Tour steps={steps} value={0} onChange={changed}>
        <TourTrigger>Start tour</TourTrigger>
        <button type="button" data-tour-target="search">
          Search
        </button>
        <TourContent aria-label="Project tour">
          {({ close }) => (
            <button type="button" onClick={close}>
              Close
            </button>
          )}
        </TourContent>
      </Tour>,
    );
    const overlay = document.querySelector<HTMLDialogElement>("[data-slot='tour-content']")!;
    const close = overlay.querySelector<HTMLButtonElement>("button")!;

    await user.click(close);

    expect(changed).toHaveBeenLastCalledWith(null);
    expect(overlay.open).toBe(true);
    expect(
      container.querySelector("[data-tour-target='search']")?.hasAttribute("data-tour-active"),
    ).toBe(true);
  });

  it("warns about empty and duplicate step definitions and keeps rendering", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const empty = render(<Tour steps={[]} />);
    expect(error).toHaveBeenCalledWith(
      "Tour requires at least one step; received 0. The tour stays closed.",
    );
    empty.unmount();

    render(
      <Tour
        steps={[
          { target: "dup-target", title: "First" },
          { target: "dup-target", title: "Again" },
        ]}
      />,
    );
    expect(error).toHaveBeenCalledWith('Tour target "dup-target" is used by more than one step.');
    error.mockRestore();
  });

  it("keeps the step hidden when its target is missing and ignores an out-of-range step", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { user } = setup(
      <Tour steps={[{ target: "missing-target", title: "Nowhere" }]}>
        <TourTrigger>Start tour</TourTrigger>
        <TourContent aria-label="Missing tour">Body</TourContent>
      </Tour>,
    );

    await user.click(document.querySelector("[data-slot='tour-trigger']")!);

    expect(error).toHaveBeenCalledWith(
      'Tour target "missing-target" must match exactly one element; found 0. The step stays hidden.',
    );
    expect(document.querySelector<HTMLDialogElement>("[data-slot='tour-content']")!.open).toBe(
      false,
    );

    render(
      <Tour steps={[{ target: "range-target", title: "Only" }]} value={4}>
        <TourContent aria-label="Range tour">Body</TourContent>
      </Tour>,
    );
    expect(error).toHaveBeenCalledWith(
      "Tour step must be null or an index from 0 to 0; received 4. The tour stays closed.",
    );
    error.mockRestore();
  });
});
