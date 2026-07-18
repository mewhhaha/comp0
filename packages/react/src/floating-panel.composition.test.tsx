import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { FloatingPanel } from "./components/FloatingPanel.js";
import { FloatingPanelClose } from "./components/FloatingPanelClose.js";
import { FloatingPanelDragHandle } from "./components/FloatingPanelDragHandle.js";
import { FloatingPanelGroup } from "./components/FloatingPanelGroup.js";
import { FloatingPanelHeader } from "./components/FloatingPanelHeader.js";
import { FloatingPanelResizeHandle } from "./components/FloatingPanelResizeHandle.js";
import { FloatingPanelSurface } from "./components/FloatingPanelSurface.js";
import { FloatingPanelTitle } from "./components/FloatingPanelTitle.js";
import { FloatingPanelTrigger } from "./components/FloatingPanelTrigger.js";

describe("floating panel composition", () => {
  it("connects a non-modal panel to its trigger and title", () => {
    const { container } = render(
      <FloatingPanelGroup>
        <FloatingPanel id="layers">
          <FloatingPanelTrigger>Open layers</FloatingPanelTrigger>
          <FloatingPanelSurface portal={false}>
            <FloatingPanelHeader>
              <FloatingPanelTitle>Layers</FloatingPanelTitle>
              <FloatingPanelDragHandle />
              <FloatingPanelClose />
            </FloatingPanelHeader>
            <FloatingPanelResizeHandle />
          </FloatingPanelSurface>
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const trigger = container.querySelector<HTMLButtonElement>(
      "[data-slot='floating-panel-trigger']",
    )!;
    const surface = container.querySelector<HTMLElement>("[data-slot='floating-panel-surface']")!;
    const title = container.querySelector<HTMLElement>("[data-slot='floating-panel-title']")!;

    expect(surface.hidden).toBe(true);
    expect(surface.getAttribute("role")).toBe("dialog");
    expect(surface.getAttribute("aria-modal")).toBeNull();
    expect(trigger.getAttribute("aria-controls")).toBe(surface.id);
    expect(surface.getAttribute("aria-labelledby")).toBe(title.id);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    fireClick(trigger);

    expect(surface.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(surface.hasAttribute("data-active")).toBe(true);
  });

  it("requires keyboard activation before moving or resizing", () => {
    const onPositionChange = vi.fn();
    const onSizeChange = vi.fn();
    const { container } = render(
      <FloatingPanelGroup>
        <FloatingPanel
          defaultOpen
          defaultPosition={{ x: 32, y: 48 }}
          defaultSize={{ width: 240, height: 160 }}
          onPositionChange={onPositionChange}
          onSizeChange={onSizeChange}
        >
          <FloatingPanelSurface portal={false} aria-label="Inspector">
            <FloatingPanelDragHandle />
            <FloatingPanelResizeHandle />
          </FloatingPanelSurface>
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const surface = container.querySelector<HTMLElement>("[data-slot='floating-panel-surface']")!;
    const move = container.querySelector<HTMLElement>("[data-slot='floating-panel-drag-handle']")!;
    const resize = container.querySelector<HTMLElement>(
      "[data-slot='floating-panel-resize-handle']",
    )!;

    fireKeyDown(move, "ArrowRight");
    expect(onPositionChange).not.toHaveBeenCalled();

    fireKeyDown(move, "Enter");
    expect(move.hasAttribute("data-moving")).toBe(true);
    fireKeyDown(move, "ArrowRight");
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 48, y: 48 });
    expect(surface.style.left).toBe("48px");
    expect(surface.querySelector("output")?.textContent).toContain("48 pixels from the left");
    fireKeyDown(move, "Enter");
    expect(move.hasAttribute("data-moving")).toBe(false);

    fireKeyDown(resize, "ArrowDown");
    expect(onSizeChange).not.toHaveBeenCalled();
    fireKeyDown(resize, " ");
    expect(resize.hasAttribute("data-resizing")).toBe(true);
    fireKeyDown(resize, "ArrowDown");
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 240, height: 176 });
    expect(surface.style.height).toBe("176px");
    expect(surface.querySelector("output")?.textContent).toContain("240 by 176 pixels");
    fireKeyDown(resize, "Escape");
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 240, height: 160 });
    expect(resize.hasAttribute("data-resizing")).toBe(false);
    expect(surface.querySelector("output")?.textContent).toBe("Panel resize cancelled.");
  });

  it("limits movement and resizing to the group boundary", () => {
    const onPositionChange = vi.fn();
    const onSizeChange = vi.fn();
    const getBoundingClientRect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        if (this.hasAttribute("data-panel-boundary")) {
          return {
            left: 100,
            top: 100,
            right: 400,
            bottom: 300,
            width: 300,
            height: 200,
          } as DOMRect;
        }
        if (this.dataset.slot === "floating-panel-surface") {
          return {
            left: 104,
            top: 104,
            right: 224,
            bottom: 184,
            width: 120,
            height: 80,
          } as DOMRect;
        }
        return new DOMRect();
      });
    const { container } = render(
      <FloatingPanelGroup as="div" data-panel-boundary="">
        <FloatingPanel
          defaultOpen
          defaultPosition={{ x: 4, y: 4 }}
          defaultSize={{ width: 120, height: 80 }}
          onPositionChange={onPositionChange}
          onSizeChange={onSizeChange}
        >
          <FloatingPanelSurface portal={false} aria-label="Inspector">
            <FloatingPanelDragHandle />
            <FloatingPanelResizeHandle />
          </FloatingPanelSurface>
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const move = container.querySelector<HTMLElement>("[data-slot='floating-panel-drag-handle']")!;
    const resize = container.querySelector<HTMLElement>(
      "[data-slot='floating-panel-resize-handle']",
    )!;
    fireKeyDown(move, "Enter");
    fireKeyDown(move, "ArrowLeft");
    fireKeyDown(move, "ArrowUp");
    expect(onPositionChange).toHaveBeenNthCalledWith(1, { x: 0, y: 4 });
    expect(onPositionChange).toHaveBeenNthCalledWith(2, { x: 0, y: 0 });

    fireKeyDown(resize, "Enter");
    for (let step = 0; step < 20; step += 1) {
      fireKeyDown(resize, "ArrowRight");
      fireKeyDown(resize, "ArrowDown");
    }
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 300, height: 200 });
    getBoundingClientRect.mockRestore();
  });

  it("keeps bounded panels in their local containing block without scroll updates", () => {
    const boundary = createRef<HTMLDivElement>();
    const onPositionChange = vi.fn();
    const { baseElement } = render(
      <FloatingPanelGroup as="div" ref={boundary}>
        <FloatingPanel
          defaultOpen
          defaultPosition={{ x: 24, y: 32 }}
          onPositionChange={onPositionChange}
        >
          <FloatingPanelSurface aria-label="Inspector" />
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const surface = baseElement.querySelector<HTMLElement>("[data-slot='floating-panel-surface']")!;

    expect(boundary.current?.contains(surface)).toBe(true);
    expect(surface.style.position).toBe("absolute");
    expect(surface.style.translate).toBe("24px 32px");

    act(() => window.dispatchEvent(new Event("scroll")));

    expect(onPositionChange).not.toHaveBeenCalled();
    expect(surface.style.translate).toBe("24px 32px");
  });

  it("moves from the header without taking pointer gestures from its controls", () => {
    const onPositionChange = vi.fn();
    const { container } = render(
      <FloatingPanelGroup>
        <FloatingPanel
          defaultOpen
          defaultPosition={{ x: 32, y: 48 }}
          onPositionChange={onPositionChange}
        >
          <FloatingPanelSurface portal={false} aria-label="Inspector">
            <FloatingPanelHeader>
              <span>Inspector</span>
              <button type="button">Action</button>
            </FloatingPanelHeader>
          </FloatingPanelSurface>
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const header = container.querySelector<HTMLElement>("[data-slot='floating-panel-header']")!;
    const action = header.querySelector("button")!;
    header.setPointerCapture = vi.fn();
    header.hasPointerCapture = vi.fn(() => true);
    header.releasePointerCapture = vi.fn();

    act(() => {
      action.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 40, clientY: 50 }),
      );
    });
    expect(header.setPointerCapture).not.toHaveBeenCalled();

    act(() => {
      header.dispatchEvent(
        new MouseEvent("pointerdown", { bubbles: true, clientX: 40, clientY: 50 }),
      );
    });
    act(() => {
      header.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: 56, clientY: 82 }),
      );
    });
    act(() => {
      header.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    });

    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 48, y: 80 });
    expect(header.setPointerCapture).toHaveBeenCalledOnce();
    expect(header.releasePointerCapture).toHaveBeenCalledOnce();
  });

  it("raises the focused panel and restores trigger focus when its close button is used", () => {
    const { container } = render(
      <FloatingPanelGroup>
        {(["layers", "history"] as const).map((name) => (
          <FloatingPanel id={name} defaultOpen key={name}>
            <FloatingPanelTrigger>Open {name}</FloatingPanelTrigger>
            <FloatingPanelSurface portal={false}>
              <FloatingPanelTitle>{name}</FloatingPanelTitle>
              <FloatingPanelClose />
            </FloatingPanelSurface>
          </FloatingPanel>
        ))}
      </FloatingPanelGroup>,
    );
    const surfaces = container.querySelectorAll<HTMLElement>(
      "[data-slot='floating-panel-surface']",
    );
    const triggers = container.querySelectorAll<HTMLButtonElement>(
      "[data-slot='floating-panel-trigger']",
    );
    const firstClose = surfaces[0]!.querySelector<HTMLButtonElement>(
      "[data-slot='floating-panel-close']",
    )!;

    act(() => firstClose.focus());
    expect(surfaces[0]!.hasAttribute("data-active")).toBe(true);
    expect(surfaces[1]!.hasAttribute("data-active")).toBe(false);

    fireClick(firstClose);
    expect(surfaces[0]!.hidden).toBe(true);
    expect(document.activeElement).toBe(triggers[0]);
  });
});
