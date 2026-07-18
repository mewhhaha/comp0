import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import { FloatingPanel } from "./components/FloatingPanel.js";
import { FloatingPanelDragHandle } from "./components/FloatingPanelDragHandle.js";
import { FloatingPanelGroup } from "./components/FloatingPanelGroup.js";
import { FloatingPanelSurface } from "./components/FloatingPanelSurface.js";
import { FloatingPanelTitle } from "./components/FloatingPanelTitle.js";
import { FloatingPanelTrigger } from "./components/FloatingPanelTrigger.js";

describe("floating panel browser interactions", () => {
  it("cycles between open panels and the application with F6", async () => {
    const { container, unmount } = render(
      <FloatingPanelGroup>
        <button type="button">Canvas</button>
        {(["Layers", "History"] as const).map((title, index) => (
          <FloatingPanel defaultOpen={index === 0} key={title}>
            <FloatingPanelTrigger>Open {title}</FloatingPanelTrigger>
            <FloatingPanelSurface portal={false}>
              <FloatingPanelTitle>{title}</FloatingPanelTitle>
              <FloatingPanelDragHandle>{title} grip</FloatingPanelDragHandle>
            </FloatingPanelSurface>
          </FloatingPanel>
        ))}
      </FloatingPanelGroup>,
    );
    const handles = container.querySelectorAll<HTMLButtonElement>(
      "[data-slot='floating-panel-drag-handle']",
    );
    const surfaces = container.querySelectorAll<HTMLElement>(
      "[data-slot='floating-panel-surface']",
    );
    const triggers = container.querySelectorAll<HTMLButtonElement>(
      "[data-slot='floating-panel-trigger']",
    );

    await act(async () => userEvent.click(triggers[1]!));
    act(() => handles[0]!.focus());
    await act(async () => userEvent.keyboard("{F6}"));
    expect(document.activeElement).toBe(surfaces[1]);

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(handles[1]);

    await act(async () => userEvent.keyboard("{F6}"));
    expect(document.activeElement).toBe(triggers[1]);

    await act(async () => userEvent.keyboard("{Shift>}{F6}{/Shift}"));
    expect(document.activeElement).toBe(handles[1]);
    unmount();
  });
});
