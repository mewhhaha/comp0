import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Drawer } from "./components/Drawer.js";
import { DrawerContent } from "./components/DrawerContent.js";
import { DrawerTrigger } from "./components/DrawerTrigger.js";

function firePointer(
  element: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  init: MouseEventInit,
  timeStamp: number,
) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, "timeStamp", { value: timeStamp });
  act(() => {
    element.dispatchEvent(event);
  });
}

/** jsdom has no layout or pointer capture; the drag math measures a mocked panel rect. */
function mockDragGeometry(panel: HTMLDialogElement, size: { width: number; height: number }) {
  panel.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: size.width,
      bottom: size.height,
      width: size.width,
      height: size.height,
      toJSON: () => ({}),
    }) as DOMRect;
  panel.setPointerCapture = vi.fn();
  panel.hasPointerCapture = vi.fn(() => false);
}

describe("drawer composition", () => {
  it("opens and closes from the trigger and anchors to the right edge by default", () => {
    const { container } = render(
      <Drawer>
        <DrawerTrigger>Open settings</DrawerTrigger>
        <DrawerContent portal={false}>Settings</DrawerContent>
      </Drawer>,
    );
    const trigger = container.querySelector("button")!;
    const panel = container.querySelector("dialog")!;

    expect(trigger.dataset.slot).toBe("drawer-trigger");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(panel.dataset.slot).toBe("drawer-content");
    expect(panel.dataset.side).toBe("right");
    expect(panel.open).toBe(false);

    fireClick(trigger);
    expect(panel.open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hasAttribute("data-open")).toBe(true);

    fireClick(trigger);
    expect(panel.open).toBe(false);
    expect(panel.hasAttribute("data-open")).toBe(false);
  });

  it("renders the configured side on the panel", () => {
    const { container } = render(
      <Drawer side="left" defaultOpen>
        <DrawerTrigger>Open filters</DrawerTrigger>
        <DrawerContent portal={false}>Filters</DrawerContent>
      </Drawer>,
    );

    expect(container.querySelector("dialog")?.dataset.side).toBe("left");
  });

  it("notifies a controlled owner once for native cancel and close and stays open when rejected", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <Drawer open onToggle={onToggle}>
        <DrawerContent portal={false}>Settings</DrawerContent>
      </Drawer>,
    );
    const panel = container.querySelector("dialog")!;

    act(() => {
      panel.dispatchEvent(new Event("cancel", { cancelable: true }));
      panel.dispatchEvent(new Event("close"));
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
    expect(panel.open).toBe(true);
  });

  it("closes when a drag toward the edge passes half the panel size", () => {
    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger>Open settings</DrawerTrigger>
        <DrawerContent portal={false}>Settings</DrawerContent>
      </Drawer>,
    );
    const panel = container.querySelector("dialog")!;
    mockDragGeometry(panel, { width: 400, height: 600 });
    expect(panel.open).toBe(true);

    firePointer(panel, "pointerdown", { clientX: 100, clientY: 100 }, 1000);
    firePointer(panel, "pointermove", { clientX: 160, clientY: 100 }, 1400);
    expect(panel.hasAttribute("data-dragging")).toBe(true);
    expect(panel.style.translate).toBe("60px 0");

    firePointer(panel, "pointermove", { clientX: 350, clientY: 100 }, 1800);
    firePointer(panel, "pointerup", { clientX: 350, clientY: 100 }, 1800);

    expect(panel.open).toBe(false);
    expect(panel.style.translate).toBe("");
    expect(panel.hasAttribute("data-dragging")).toBe(false);
  });

  it("snaps back and stays open when the drag stops before halfway", () => {
    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger>Open settings</DrawerTrigger>
        <DrawerContent portal={false}>Settings</DrawerContent>
      </Drawer>,
    );
    const panel = container.querySelector("dialog")!;
    mockDragGeometry(panel, { width: 400, height: 600 });

    firePointer(panel, "pointerdown", { clientX: 100, clientY: 100 }, 1000);
    firePointer(panel, "pointermove", { clientX: 200, clientY: 100 }, 1400);
    expect(panel.style.translate).toBe("100px 0");

    firePointer(panel, "pointerup", { clientX: 200, clientY: 100 }, 1400);

    expect(panel.open).toBe(true);
    expect(panel.hasAttribute("data-dragging")).toBe(false);
    expect(panel.style.translate).toBe("");
  });

  it("closes on a fast flick released before halfway", () => {
    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger>Open settings</DrawerTrigger>
        <DrawerContent portal={false}>Settings</DrawerContent>
      </Drawer>,
    );
    const panel = container.querySelector("dialog")!;
    mockDragGeometry(panel, { width: 400, height: 600 });

    firePointer(panel, "pointerdown", { clientX: 100, clientY: 100 }, 1000);
    firePointer(panel, "pointermove", { clientX: 140, clientY: 100 }, 1020);
    firePointer(panel, "pointerup", { clientX: 140, clientY: 100 }, 1020);

    expect(panel.open).toBe(false);
  });

  it("ignores drags that start on an interactive element", () => {
    const { container } = render(
      <Drawer defaultOpen>
        <DrawerTrigger>Open settings</DrawerTrigger>
        <DrawerContent portal={false}>
          <button type="button">Save</button>
        </DrawerContent>
      </Drawer>,
    );
    const panel = container.querySelector("dialog")!;
    mockDragGeometry(panel, { width: 400, height: 600 });
    const save = panel.querySelector("button")!;

    firePointer(save, "pointerdown", { clientX: 100, clientY: 100 }, 1000);
    firePointer(save, "pointermove", { clientX: 350, clientY: 100 }, 1400);
    firePointer(save, "pointerup", { clientX: 350, clientY: 100 }, 1400);

    expect(panel.open).toBe(true);
    expect(panel.hasAttribute("data-dragging")).toBe(false);
    expect(panel.style.translate).toBe("");
  });

  it("leaves interactive elements in the drawer's owning document in charge of gestures", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    const { container, unmount } = render(
      <Drawer defaultOpen>
        <DrawerContent portal={false}>
          <button type="button">Save</button>
        </DrawerContent>
      </Drawer>,
      frame.contentDocument!,
    );
    const panel = container.querySelector("dialog")!;
    const save = panel.querySelector("button")!;
    mockDragGeometry(panel, { width: 400, height: 600 });

    act(() =>
      save.dispatchEvent(
        new frameWindow.MouseEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100,
        }),
      ),
    );
    act(() =>
      save.dispatchEvent(
        new frameWindow.MouseEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: 350,
          clientY: 100,
        }),
      ),
    );

    expect(panel.hasAttribute("data-dragging")).toBe(false);
    expect(panel.style.translate).toBe("");
    unmount();
    frame.remove();
  });
});
