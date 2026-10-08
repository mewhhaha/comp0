import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { setup, userEvent } from "../../../test/render.js";
import { useEscapeDismiss } from "./dismiss.js";
import { usePopoverState } from "./state.js";

function StateHarness(props: { onOpenChange?: (open: boolean) => void; defaultOpen?: boolean }) {
  const popover = usePopoverState({ ...props, triggerId: "t", contentId: "c" });
  return (
    <>
      <button
        type="button"
        ref={(element) => popover.setTriggerElement(element)}
        onClick={() => popover.setOpen(true)}
      >
        Open
      </button>
      <button type="button" onClick={popover.requestClose}>
        Close
      </button>
      <output>{String(popover.open)}</output>
    </>
  );
}

describe("usePopoverState", () => {
  it("reports each next open state through onOpenChange", async () => {
    const onOpenChange = vi.fn();
    const { getByText, user } = setup(<StateHarness onOpenChange={onOpenChange} />);

    await user.click(getByText("Open"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(getByText("true")).toBeTruthy();

    await user.click(getByText("Close"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("returns focus to the trigger only when closing was requested", async () => {
    const { getByText, user } = setup(<StateHarness defaultOpen />);

    await user.click(getByText("Close"));

    expect(document.activeElement).toBe(getByText("Open"));
  });
});

describe("useEscapeDismiss", () => {
  function mountTrigger() {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    return trigger;
  }

  it("closes on Escape from anywhere in the document while open", async () => {
    const user = userEvent.setup();
    const setOpen = vi.fn();
    const trigger = mountTrigger();
    renderHook(() => useEscapeDismiss(true, { current: trigger }, setOpen));

    await user.keyboard("{Escape}");

    expect(setOpen).toHaveBeenCalledWith(false);
    trigger.remove();
  });

  it("does nothing while closed", async () => {
    const user = userEvent.setup();
    const setOpen = vi.fn();
    const trigger = mountTrigger();
    renderHook(() => useEscapeDismiss(false, { current: trigger }, setOpen));

    await user.keyboard("{Escape}");

    expect(setOpen).not.toHaveBeenCalled();
    trigger.remove();
  });
});
