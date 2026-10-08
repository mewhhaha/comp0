import { act, createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { FloatingPanel } from "./FloatingPanel.js";
import { FloatingPanelClose } from "./FloatingPanelClose.js";
import { FloatingPanelDragHandle } from "./FloatingPanelDragHandle.js";
import { FloatingPanelGroup } from "./FloatingPanelGroup.js";
import { FloatingPanelHeader } from "./FloatingPanelHeader.js";
import { FloatingPanelResizeHandle } from "./FloatingPanelResizeHandle.js";
import { FloatingPanelSurface } from "./FloatingPanelSurface.js";
import { FloatingPanelTitle } from "./FloatingPanelTitle.js";
import { FloatingPanelTrigger } from "./FloatingPanelTrigger.js";

type User = ReturnType<typeof setup>["user"];

/** Focuses the handle, then sends the key the way a keyboard user would. */
async function press(user: User, element: HTMLElement, key: string) {
  element.focus();
  await user.keyboard(key === " " ? " " : `{${key}}`);
}

describe("floating panel composition", () => {
  it("connects a non-modal panel to its trigger and title", async () => {
    const { container, user } = setup(
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

    await user.click(trigger);

    expect(surface.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(surface.hasAttribute("data-active")).toBe(true);
  });

  it("requires keyboard activation before moving or resizing", async () => {
    const onPositionChange = vi.fn();
    const onSizeChange = vi.fn();
    const { container, user } = setup(
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

    await press(user, move, "ArrowRight");
    expect(onPositionChange).not.toHaveBeenCalled();

    await press(user, move, "Enter");
    expect(move.hasAttribute("data-moving")).toBe(true);
    await press(user, move, "ArrowRight");
    expect(onPositionChange).toHaveBeenLastCalledWith({ x: 48, y: 48 });
    expect(surface.style.left).toBe("48px");
    expect(surface.querySelector("output")?.textContent).toContain("48 pixels from the left");
    await press(user, move, "Enter");
    expect(move.hasAttribute("data-moving")).toBe(false);

    await press(user, resize, "ArrowDown");
    expect(onSizeChange).not.toHaveBeenCalled();
    await press(user, resize, " ");
    expect(resize.hasAttribute("data-resizing")).toBe(true);
    await press(user, resize, "ArrowDown");
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 240, height: 176 });
    expect(surface.style.height).toBe("176px");
    expect(surface.querySelector("output")?.textContent).toContain("240 by 176 pixels");
    await press(user, resize, "Escape");
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 240, height: 160 });
    expect(resize.hasAttribute("data-resizing")).toBe(false);
    expect(surface.querySelector("output")?.textContent).toBe("Panel resize cancelled.");
  });

  it("limits movement and resizing to the group boundary", async () => {
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
    const { container, user } = setup(
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
    await press(user, move, "Enter");
    await press(user, move, "ArrowLeft");
    await press(user, move, "ArrowUp");
    await press(user, move, "Enter");
    expect(onPositionChange).toHaveBeenNthCalledWith(1, { x: 0, y: 4 });
    expect(onPositionChange).toHaveBeenNthCalledWith(2, { x: 0, y: 0 });

    await press(user, resize, "Enter");
    for (let step = 0; step < 20; step += 1) {
      await press(user, resize, "ArrowRight");
      await press(user, resize, "ArrowDown");
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

  it("raises the focused panel and restores trigger focus when its close button is used", async () => {
    const { container, user } = setup(
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

    await user.click(firstClose);
    expect(surfaces[0]!.hidden).toBe(true);
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("warns about non-finite geometry and falls back to the anchored placement", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <FloatingPanelGroup>
        <FloatingPanel
          defaultOpen
          defaultPosition={{ x: Number.NaN, y: 4 }}
          defaultSize={{ width: -10, height: 20 }}
        >
          <FloatingPanelSurface portal={false} aria-label="Inspector" />
        </FloatingPanel>
      </FloatingPanelGroup>,
    );
    const surface = container.querySelector<HTMLElement>("[data-slot='floating-panel-surface']")!;

    expect(error).toHaveBeenCalledWith(
      "FloatingPanel defaultPosition must contain finite x and y coordinates. It was ignored.",
    );
    expect(error).toHaveBeenCalledWith(
      "FloatingPanel defaultSize width and height must be greater than 0. It was ignored.",
    );
    expect(surface.style.left).toBe("");
    expect(surface.style.width).toBe("");
    error.mockRestore();
  });

  it("cycles F6 through open panels in document order", async () => {
    const { container, user } = setup(
      <FloatingPanelGroup>
        {(["first", "second"] as const).map((name) => (
          <FloatingPanel id={name} defaultOpen key={name}>
            <FloatingPanelSurface portal={false} aria-label={name} />
          </FloatingPanel>
        ))}
      </FloatingPanelGroup>,
    );
    const surfaces = container.querySelectorAll<HTMLElement>(
      "[data-slot='floating-panel-surface']",
    );

    // Opening a surface focuses it; start from the application instead.
    act(() => (document.activeElement as HTMLElement).blur());
    await user.keyboard("{F6}");
    expect(document.activeElement).toBe(surfaces[0]);
    await user.keyboard("{F6}");
    expect(document.activeElement).toBe(surfaces[1]);
    await user.keyboard("{Shift>}{F6}{/Shift}");
    expect(document.activeElement).toBe(surfaces[0]);
  });
});
