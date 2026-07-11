import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Dialog } from "./components/Dialog.js";
import { DialogContent } from "./components/DialogContent.js";
import { DialogTrigger } from "./components/DialogTrigger.js";
import { Popover } from "./components/Popover.js";
import { PopoverContent } from "./components/PopoverContent.js";
import { PopoverTrigger } from "./components/PopoverTrigger.js";

describe("overlay composition", () => {
  it("keeps provider roots wrapper-free and connects dialog parts with stable ids", () => {
    const { container } = render(
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

    fireClick(trigger);
    expect(content.open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("supports element overrides on roots and leaf triggers", () => {
    const { container } = render(
      <Popover as="section">
        <PopoverTrigger as="a" href="#content">
          Open
        </PopoverTrigger>
        <PopoverContent id="content">Details</PopoverContent>
      </Popover>,
    );

    expect(container.querySelector("section")).not.toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("#content");
  });

  it("deduplicates native cancel and close notifications for controlled dialogs", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <Dialog open onToggle={onToggle}>
        <DialogContent portal={false}>Settings</DialogContent>
      </Dialog>,
    );
    const content = container.querySelector("dialog")!;

    act(() => {
      content.dispatchEvent(new Event("cancel", { cancelable: true }));
      content.dispatchEvent(new Event("close"));
    });

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("keeps a controlled dialog open when its owner rejects a cancel request", () => {
    const onToggle = vi.fn();
    const { container } = render(
      <Dialog open onToggle={onToggle}>
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
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("restores focus to the opener after a controlled dialog closes", () => {
    const originalClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function closeDialog() {
      this.removeAttribute("open");
    };

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <Dialog open={open} onToggle={setOpen}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent portal={false}>Settings</DialogContent>
        </Dialog>
      );
    }

    try {
      const { container } = render(<Harness />);
      const trigger = container.querySelector<HTMLButtonElement>("button")!;
      trigger.focus();
      fireClick(trigger);
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
});
