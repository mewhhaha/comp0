import { Fragment } from "react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render } from "../test/render.js";
import { Dialog } from "./dialog/Dialog.js";
import { DialogTrigger } from "./dialog/DialogTrigger.js";
import { Tooltip } from "./tooltip/Tooltip.js";
import { TooltipContent } from "./tooltip/TooltipContent.js";
import { TooltipTrigger } from "./tooltip/TooltipTrigger.js";

describe("fragment triggers", () => {
  it("merges tooltip trigger behavior onto the supplied child element", () => {
    const ownFocus = vi.fn();
    const { container } = render(
      <Tooltip>
        <TooltipTrigger as={Fragment}>
          <button className="own" type="button" onFocus={ownFocus}>
            i
          </button>
        </TooltipTrigger>
        <TooltipContent>Helpful detail</TooltipContent>
      </Tooltip>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    const trigger = buttons[0]!;
    expect(trigger.className).toBe("own");
    expect(trigger.dataset["slot"]).toBe("tooltip-trigger");

    const popover = container.ownerDocument.querySelector("[role='tooltip']")!;
    expect(popover.hasAttribute("hidden")).toBe(true);
    act(() => trigger.focus());
    expect(ownFocus).toHaveBeenCalledOnce();
    expect(popover.hasAttribute("hidden")).toBe(false);
  });

  it("keeps the child's own click handler while toggling the dialog", () => {
    const ownClick = vi.fn();
    const { container } = render(
      <Dialog>
        <DialogTrigger as={Fragment}>
          <button type="button" onClick={ownClick}>
            Open
          </button>
        </DialogTrigger>
      </Dialog>,
    );
    const trigger = container.querySelector("button")!;
    fireClick(trigger);
    expect(ownClick).toHaveBeenCalledOnce();
    expect(trigger.dataset["open"]).toBe("");
  });
});
