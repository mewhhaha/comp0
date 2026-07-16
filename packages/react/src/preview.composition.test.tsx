import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { Preview } from "./components/Preview.js";
import { PreviewPopover } from "./components/PreviewPopover.js";
import { PreviewTrigger } from "./components/PreviewTrigger.js";

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

function advance(milliseconds: number) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

function Example(props: { open?: boolean; onToggle?: (open: boolean) => void }) {
  return (
    <Preview {...props}>
      <PreviewTrigger href="https://example.com/pkg">pkg</PreviewTrigger>
      <PreviewPopover>
        Package details
        <button type="button">Star</button>
      </PreviewPopover>
    </Preview>
  );
}

describe("preview composition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a link trigger with a hidden top-layer card", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    expect(trigger.getAttribute("href")).toBe("https://example.com/pkg");
    expect(trigger.dataset["slot"]).toBe("preview-trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
    const card = container.querySelector("[data-slot='preview-content']")!;
    expect(card.getAttribute("popover")).toBe("manual");
    expect(card.hasAttribute("hidden")).toBe(true);
  });

  it("opens after the hover intent delay and wires the expansion to the card", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    const card = container.querySelector("[data-slot='preview-content']")!;
    hoverStart(trigger);
    advance(599);
    expect(card.hasAttribute("hidden")).toBe(true);
    advance(1);
    expect(card.hasAttribute("hidden")).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(card.id);
    expect(trigger.dataset["open"]).toBe("");
    expect(card.getAttribute("data-open")).toBe("");
  });

  it("never opens from a pointer that passes over the trigger briefly", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    hoverStart(trigger);
    advance(300);
    hoverEnd(trigger);
    advance(2000);
    expect(container.querySelector("[data-slot='preview-content']")!.hasAttribute("hidden")).toBe(
      true,
    );
  });

  it("opens immediately on focus and closes on Escape", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    const card = container.querySelector("[data-slot='preview-content']")!;
    act(() => trigger.focus());
    expect(card.hasAttribute("hidden")).toBe(false);
    fireKeyDown(trigger, "Escape");
    expect(card.hasAttribute("hidden")).toBe(true);
  });

  it("stays open while the pointer travels onto the card", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    const card = container.querySelector("[data-slot='preview-content']")!;
    hoverStart(trigger);
    advance(600);
    hoverEnd(trigger);
    hoverStart(card);
    advance(2000);
    expect(card.hasAttribute("hidden")).toBe(false);
    hoverEnd(card);
    advance(299);
    expect(card.hasAttribute("hidden")).toBe(false);
    advance(1);
    expect(card.hasAttribute("hidden")).toBe(true);
  });

  it("stays open while focus is inside the card and closes after it leaves", () => {
    const { container } = render(<Example />);
    const trigger = container.querySelector("a")!;
    const card = container.querySelector("[data-slot='preview-content']")!;
    const star = card.querySelector("button")!;
    act(() => trigger.focus());
    act(() => star.focus());
    advance(2000);
    expect(card.hasAttribute("hidden")).toBe(false);
    act(() => star.blur());
    advance(300);
    expect(card.hasAttribute("hidden")).toBe(true);
  });

  it("reports the next state through onToggle while controlled open pins the card", () => {
    const onToggle = vi.fn();
    const { container, rerender } = render(<Example open onToggle={onToggle} />);
    const card = container.querySelector("[data-slot='preview-content']")!;
    expect(card.hasAttribute("hidden")).toBe(false);
    fireKeyDown(container.querySelector("a")!, "Escape");
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(card.hasAttribute("hidden")).toBe(false);
    rerender(<Example open={false} onToggle={onToggle} />);
    expect(card.hasAttribute("hidden")).toBe(true);
  });

  it("reports invalid delay configuration with the received values", () => {
    expect(() => render(<Preview openDelay={-1} />)).toThrow(
      "Preview delays must be non-negative; received openDelay -1 and closeDelay 300.",
    );
  });
});
