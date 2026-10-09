import { type ReactElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Dialog } from "../dialog/Dialog.js";
import { DialogContent } from "../dialog/DialogContent.js";
import { DialogTrigger } from "../dialog/DialogTrigger.js";
import { Editable } from "../editable/Editable.js";
import { EditableInput } from "../editable/EditableInput.js";
import { EditableView } from "../editable/EditableView.js";
import { ErrorSummary } from "../error-summary/ErrorSummary.js";
import { FloatingPanel } from "../floating-panel/FloatingPanel.js";
import { FloatingPanelGroup } from "../floating-panel/FloatingPanelGroup.js";
import { FloatingPanelSurface } from "../floating-panel/FloatingPanelSurface.js";
import { FloatingPanelTrigger } from "../floating-panel/FloatingPanelTrigger.js";
import { Menu } from "../menu/Menu.js";
import { MenuItem } from "../menu/MenuItem.js";
import { MenuList } from "../menu/MenuList.js";
import { MenuPopover } from "../menu/MenuPopover.js";
import { MenuTrigger } from "../menu/MenuTrigger.js";
import { Messages } from "../messages/Messages.js";
import { Popover } from "../popover/Popover.js";
import { PopoverContent } from "../popover/PopoverContent.js";
import { PopoverTrigger } from "../popover/PopoverTrigger.js";
import { Tour } from "../tour/Tour.js";
import { TourContent } from "../tour/TourContent.js";
import { useBusy } from "../internal/busy.js";
import { useWarnOnce } from "../internal/dev.js";
import { BusyRegion } from "./BusyRegion.js";

function BusyProbe() {
  return <output>{String(useBusy())}</output>;
}

function Reporter({ id }: { id: string }) {
  const warn = useWarnOnce();
  warn(`busy-region-test:${id}`, `report ${id}`);
  return null;
}

describe("BusyRegion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks the region busy for assistive technology and styling hooks", () => {
    const { container, rerender } = render(
      <BusyRegion busy aria-label="Answer">
        <BusyProbe />
      </BusyRegion>,
    );
    const region = container.querySelector("[data-slot='busy-region']")!;

    expect(region.tagName).toBe("DIV");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.hasAttribute("data-busy")).toBe(true);
    expect(container.querySelector("output")?.textContent).toBe("true");

    rerender(
      <BusyRegion busy={false} aria-label="Answer">
        <BusyProbe />
      </BusyRegion>,
    );
    expect(region.hasAttribute("aria-busy")).toBe(false);
    expect(region.hasAttribute("data-busy")).toBe(false);
    expect(container.querySelector("output")?.textContent).toBe("false");
  });

  it("adds no live region of its own, so completion is not announced by the region", () => {
    const { container } = render(<BusyRegion busy>text</BusyRegion>);
    const region = container.querySelector("[data-slot='busy-region']")!;

    expect(region.hasAttribute("role")).toBe(false);
    expect(region.hasAttribute("aria-live")).toBe(false);
  });

  it("nests: inner parts stay busy while any ancestor is, without a second aria-busy", () => {
    const { container, rerender } = render(
      <BusyRegion busy>
        <BusyRegion busy={false} data-testid="inner">
          <BusyProbe />
        </BusyRegion>
      </BusyRegion>,
    );
    const inner = container.querySelector<HTMLElement>("[data-testid='inner']")!;

    expect(container.querySelector("output")?.textContent).toBe("true");
    expect(inner.hasAttribute("data-busy")).toBe(true);
    expect(inner.hasAttribute("aria-busy")).toBe(false);

    rerender(
      <BusyRegion busy={false}>
        <BusyRegion busy={false} data-testid="inner">
          <BusyProbe />
        </BusyRegion>
      </BusyRegion>,
    );
    expect(container.querySelector("output")?.textContent).toBe("false");
  });

  it("is shared with Messages, which marks its conversation busy while streaming", () => {
    const { container } = render(
      <Messages aria-label="Chat" busy>
        <BusyProbe />
      </Messages>,
    );

    expect(container.querySelector("[role='log']")?.getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector("output")?.textContent).toBe("true");
  });

  it("supports as and merges props into a single child with Fragment", () => {
    const { container } = render(
      <BusyRegion as="section" busy>
        <p>Answer</p>
      </BusyRegion>,
    );
    expect(container.querySelector("section")?.getAttribute("aria-busy")).toBe("true");

    const merged = render(
      <BusyRegion as={"main" as never} busy={false}>
        <p>Answer</p>
      </BusyRegion>,
    );
    expect(merged.container.querySelector("main")).not.toBeNull();
  });

  it("reports a warning once, only after the region settles", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { rerender } = render(
      <BusyRegion busy>
        <Reporter id="settle" />
      </BusyRegion>,
    );
    expect(error).not.toHaveBeenCalled();

    rerender(
      <BusyRegion busy={false}>
        <Reporter id="settle" />
      </BusyRegion>,
    );
    rerender(
      <BusyRegion busy={false}>
        <Reporter id="settle" />
      </BusyRegion>,
    );
    expect(error.mock.calls).toEqual([["report settle"]]);
  });
});

function busy(children: ReactNode, isBusy = true): ReactElement {
  return (
    <>
      <button type="button">Outside</button>
      <BusyRegion busy={isBusy}>{children}</BusyRegion>
    </>
  );
}

function outsideButton(container: HTMLElement) {
  return container.querySelector<HTMLButtonElement>("button")!;
}

describe("focus while a region is busy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves focus into a popover that opens on its own in a settled region", () => {
    const { container } = render(
      busy(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button type="button">Inside</button>
          </PopoverContent>
        </Popover>,
        false,
      ),
    );

    expect(document.activeElement?.textContent).toBe("Inside");
    expect(container.contains(document.activeElement)).toBe(true);
  });

  it("leaves focus alone for a popover that opens on its own, now and after settling", () => {
    const focusable = busy(
      <Popover defaultOpen>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent>
          <button type="button">Inside</button>
        </PopoverContent>
      </Popover>,
    );
    const { container, rerender } = render(focusable);
    const outside = outsideButton(container);
    outside.focus();
    rerender(focusable);
    expect(document.activeElement).toBe(outside);

    rerender(
      busy(
        <Popover defaultOpen>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button type="button">Inside</button>
          </PopoverContent>
        </Popover>,
        false,
      ),
    );
    expect(document.activeElement).toBe(outside);
  });

  it("still moves focus into a popover the user opens", async () => {
    const { container, user } = setup(
      busy(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <button type="button">Inside</button>
          </PopoverContent>
        </Popover>,
      ),
    );

    await user.click(container.querySelector("[data-slot='popover-trigger']")!);

    expect(document.activeElement?.textContent).toBe("Inside");
  });

  it("does not focus the first item of a menu that opens on its own", () => {
    const { container } = render(
      busy(
        <Menu defaultOpen>
          <MenuTrigger>Actions</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Copy</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>,
      ),
    );
    outsideButton(container).focus();

    expect(document.activeElement).toBe(outsideButton(container));
  });

  it("keeps a dialog that opens on its own closed until the region settles", () => {
    const ui = (isBusy: boolean) =>
      busy(
        <Dialog defaultOpen>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent portal={false}>Settings</DialogContent>
        </Dialog>,
        isBusy,
      );
    const { container, rerender } = render(ui(true));
    const dialog = container.querySelector<HTMLDialogElement>("[role='dialog']")!;
    outsideButton(container).focus();

    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(outsideButton(container));

    rerender(ui(false));
    expect(dialog.open).toBe(true);
  });

  it("opens a dialog the user asks for even while the region is busy", async () => {
    const { container, user } = setup(
      busy(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent portal={false}>Settings</DialogContent>
        </Dialog>,
      ),
    );

    await user.click(container.querySelector("[data-slot='dialog-trigger']")!);

    expect(container.querySelector<HTMLDialogElement>("[role='dialog']")!.open).toBe(true);
  });

  it("does not focus an Editable input that opens on its own, but does when the user edits", async () => {
    const ui = (open?: boolean) =>
      busy(
        <Editable defaultValue="Draft" defaultOpen={open}>
          <EditableView />
          <EditableInput aria-label="Title" />
        </Editable>,
      );
    const automatic = render(ui(true));
    outsideButton(automatic.container).focus();
    expect(document.activeElement).toBe(outsideButton(automatic.container));
    automatic.unmount();

    const { container, user } = setup(ui());
    await user.click(container.querySelector("[data-slot='editable-view']")!);
    expect(document.activeElement).toBe(container.querySelector("input"));
  });

  it("does not claim focus for an ErrorSummary that mounts inside a busy region", () => {
    const ui = (isBusy: boolean) =>
      busy(
        <ErrorSummary>
          <p>Fix the form</p>
        </ErrorSummary>,
        isBusy,
      );
    const { container, rerender } = render(ui(true));
    outsideButton(container).focus();
    expect(document.activeElement).toBe(outsideButton(container));

    rerender(ui(false));
    expect(document.activeElement).toBe(outsideButton(container));

    const settled = render(ui(false));
    expect(settled.container.contains(document.activeElement)).toBe(true);
  });

  it("does not focus a FloatingPanel surface that opens on its own", () => {
    const { container } = render(
      busy(
        <FloatingPanelGroup>
          <FloatingPanel defaultOpen>
            <FloatingPanelTrigger>Open layers</FloatingPanelTrigger>
            <FloatingPanelSurface portal={false}>
              <button type="button">Layer</button>
            </FloatingPanelSurface>
          </FloatingPanel>
        </FloatingPanelGroup>,
      ),
    );
    outsideButton(container).focus();

    expect(document.activeElement).toBe(outsideButton(container));
  });

  it("keeps a tour that starts on its own closed, quiet, and unfocused until the region settles", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const ui = (isBusy: boolean) =>
      busy(
        <Tour steps={[{ target: "later-target", title: "Arrives late" }]} defaultValue={0}>
          <TourContent aria-label="Streamed tour">Step</TourContent>
        </Tour>,
        isBusy,
      );
    const { container, rerender } = render(ui(true));
    outsideButton(container).focus();

    expect(error).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(outsideButton(container));

    rerender(ui(false));
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0]?.[0])).toContain('Tour target "later-target"');
  });
});
