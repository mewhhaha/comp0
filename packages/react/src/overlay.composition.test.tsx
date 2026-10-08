import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../test/render.js";
import { Dialog } from "./dialog/Dialog.js";
import { DialogContent } from "./dialog/DialogContent.js";
import { DialogTrigger } from "./dialog/DialogTrigger.js";
import { Popover } from "./popover/Popover.js";
import { PopoverContent } from "./popover/PopoverContent.js";
import { PopoverTrigger } from "./popover/PopoverTrigger.js";
import { placementSurfaceStyle, popoverAnchorName } from "./internal/overlay/index.js";

describe("popover placement styles", () => {
  it("derives matching css anchor names from ids React generates", () => {
    expect(popoverAnchorName("«r1»-trigger")).toBe("--comp0-anchor-r1-trigger");
    expect(popoverAnchorName(undefined)).toBeUndefined();
  });

  it("maps placements to position areas with a flip fallback on the placement axis", () => {
    expect(placementSurfaceStyle("bottom start", 8, "«r0»-trigger", undefined)).toEqual({
      inset: "auto",
      margin: 0,
      positionArea: "block-end span-inline-end",
      positionTryFallbacks: "flip-block",
      positionAnchor: "--comp0-anchor-r0-trigger",
      marginBlock: "8px",
    });
    expect(placementSurfaceStyle("right top", 4, "«r0»-trigger", undefined)).toMatchObject({
      positionArea: "right span-bottom",
      positionTryFallbacks: "flip-inline",
      marginInline: "4px",
    });
  });

  it("keeps caller-provided style declarations in charge", () => {
    const style = placementSurfaceStyle("top", 0, "id", { positionArea: "left" } as never);
    expect(style).toMatchObject({ positionArea: "left" });
    expect(placementSurfaceStyle(undefined, 8, "id", { color: "red" })).toEqual({ color: "red" });
  });
});

describe("overlay composition", () => {
  it("defaults polymorphic native button triggers to type button", () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger as="button">Open</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );

    expect(container.querySelector("button")?.getAttribute("type")).toBe("button");
  });

  it("keeps provider roots wrapper-free and connects dialog parts with stable ids", async () => {
    const { container, user } = setup(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent portal={false}>Settings</DialogContent>
      </Dialog>,
    );
    const trigger = container.querySelector("button")!;
    const content = container.querySelector<HTMLDialogElement>("[role='dialog']")!;

    expect(container.children).toHaveLength(2);
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.open).toBe(false);

    await user.click(trigger);
    expect(content.open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("supports element overrides on roots and leaf triggers", () => {
    const { container } = render(
      <Popover as="section">
        <PopoverTrigger as="div">Open</PopoverTrigger>
        <PopoverContent id="content">Details</PopoverContent>
      </Popover>,
    );

    expect(container.querySelector("section")).not.toBeNull();
    const trigger = container.querySelector("[data-slot='popover-trigger']")!;
    expect(trigger.tagName).toBe("DIV");
    expect(trigger.hasAttribute("type")).toBe(false);
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
  });

  it("deduplicates native cancel and close notifications for controlled dialogs", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent portal={false}>Settings</DialogContent>
      </Dialog>,
    );
    const content = container.querySelector("dialog")!;

    act(() => {
      content.dispatchEvent(new Event("cancel", { cancelable: true }));
      content.dispatchEvent(new Event("close"));
    });

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps a controlled dialog open when its owner rejects a cancel request", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent portal={false}>Settings</DialogContent>
      </Dialog>,
    );
    const content = container.querySelector("dialog")!;
    const cancel = new Event("cancel", { cancelable: true });

    act(() => {
      content.dispatchEvent(cancel);
    });

    expect(cancel.defaultPrevented).toBe(true);
    expect(content.open).toBe(true);
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("restores focus to the opener after a controlled dialog closes", async () => {
    const originalClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function closeDialog() {
      this.removeAttribute("open");
    };

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent portal={false}>Settings</DialogContent>
        </Dialog>
      );
    }

    try {
      const { container, user } = setup(<Harness />);
      const trigger = container.querySelector<HTMLButtonElement>("button")!;
      await user.click(trigger);
      const content = container.querySelector("dialog")!;

      act(() => {
        content.dispatchEvent(new Event("cancel", { cancelable: true }));
      });

      expect(content.open).toBe(false);
      expect(document.activeElement).toBe(trigger);
    } finally {
      HTMLDialogElement.prototype.close = originalClose;
    }
  });

  it("restores focus inside the dialog's owning document", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent portal={false}>Settings</DialogContent>
        </Dialog>
      );
    }

    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    const frameDocument = frame.contentDocument!;
    const { container, unmount } = render(<Harness />, frameDocument);
    const trigger = container.querySelector("button")!;
    const content = container.querySelector("dialog")!;

    act(() => {
      trigger.focus();
      trigger.dispatchEvent(
        new frameWindow.MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    act(() =>
      content.dispatchEvent(new frameWindow.Event("cancel", { bubbles: true, cancelable: true })),
    );

    expect(frameDocument.activeElement).toBe(trigger);
    unmount();
    frame.remove();
  });

  it("moves focus to the first focusable control when a popover opens", async () => {
    const { getByText, user } = setup(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Choices">
          <button type="button">First</button>
          <button type="button">Second</button>
        </PopoverContent>
      </Popover>,
    );

    await user.click(getByText("Open"));

    expect(document.activeElement).toBe(getByText("First"));
  });

  it("closes a popover on Escape and returns focus to its trigger", async () => {
    const { getByText, user } = setup(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent aria-label="Choices">
          <button type="button">First</button>
        </PopoverContent>
      </Popover>,
    );

    await user.click(getByText("Open"));
    await user.keyboard("{Escape}");

    expect(getByText("Open").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(getByText("Open"));
  });
});
