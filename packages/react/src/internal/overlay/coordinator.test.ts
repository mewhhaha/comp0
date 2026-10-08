import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  noteAutoPopoverToggle,
  prioritizeAutoPopover,
  registerAutoPopover,
  unregisterAutoPopover,
  type CoordinatedAutoPopover,
  type PopoverSurfaceElement,
} from "./coordinator.js";

/** jsdom has no popover support, so the surface is a stub that tracks `:popover-open` itself. */
function popoverStub() {
  const element = document.createElement("div") as PopoverSurfaceElement;
  let shown = false;
  element.setAttribute("popover", "auto");
  element.showPopover = vi.fn(() => {
    shown = true;
  });
  element.hidePopover = vi.fn(() => {
    shown = false;
  });
  const matches = element.matches.bind(element);
  vi.spyOn(element, "matches").mockImplementation((selector: string) =>
    selector === ":popover-open" ? shown : matches(selector),
  );
  document.body.append(element);
  return element;
}

describe("auto popover coordinator", () => {
  const entries: CoordinatedAutoPopover[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    for (const entry of entries.splice(0)) unregisterAutoPopover(entry);
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  function register(element: PopoverSurfaceElement, desiredOpen: () => boolean) {
    const entry = registerAutoPopover(element, desiredOpen);
    entries.push(entry);
    return entry;
  }

  it("reopens a surface its owner still wants open after the browser closed it", () => {
    const element = popoverStub();
    const entry = register(element, () => true);

    noteAutoPopoverToggle(entry, false);
    expect(entry.pending).toBe(true);
    vi.runAllTimers();

    expect(element.showPopover).toHaveBeenCalledOnce();
    expect(entry.pending).toBe(false);
  });

  it("leaves a surface closed when its owner no longer wants it", () => {
    const element = popoverStub();
    const entry = register(element, () => false);

    noteAutoPopoverToggle(entry, false);
    vi.runAllTimers();

    expect(element.showPopover).not.toHaveBeenCalled();
    expect(entry.pending).toBe(false);
  });

  it("orders priority by most recent open", () => {
    const entry = register(popoverStub(), () => true);
    const other = register(popoverStub(), () => true);

    prioritizeAutoPopover(entry);
    prioritizeAutoPopover(other);

    expect(other.priority).toBeGreaterThan(entry.priority);
  });
});
