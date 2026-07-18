import { act } from "react";
import { page, userEvent } from "vitest/browser";
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
    const { unmount } = render(
      <FloatingPanelGroup>
        <button type="button">Canvas</button>
        {(["Layers", "History"] as const).map((title, index) => (
          <FloatingPanel defaultOpen={index === 0} key={title}>
            <FloatingPanelTrigger>Open {title}</FloatingPanelTrigger>
            <FloatingPanelSurface portal={false}>
              <FloatingPanelTitle>{title}</FloatingPanelTitle>
              <FloatingPanelDragHandle aria-label={`Move ${title}`}>
                {title} grip
              </FloatingPanelDragHandle>
            </FloatingPanelSurface>
          </FloatingPanel>
        ))}
      </FloatingPanelGroup>,
    );
    const layersHandle = page.getByRole("button", { name: "Move Layers" }).element();
    const historyTrigger = page.getByRole("button", { name: "Open History" }).element();

    await act(async () => userEvent.click(historyTrigger));
    const historyHandle = page.getByRole("button", { name: "Move History" }).element();
    const historySurface = page.getByRole("dialog", { name: "History" }).element();
    act(() => layersHandle.focus());
    await act(async () => userEvent.keyboard("{F6}"));
    expect(document.activeElement).toBe(historySurface);

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(historyHandle);

    await act(async () => userEvent.keyboard("{F6}"));
    expect(document.activeElement).toBe(historyTrigger);

    await act(async () => userEvent.keyboard("{Shift>}{F6}{/Shift}"));
    expect(document.activeElement).toBe(historyHandle);
    unmount();
  });
});
