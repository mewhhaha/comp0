import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  FloatingPanel,
  FloatingPanelClose,
  FloatingPanelDragHandle,
  FloatingPanelGroup,
  FloatingPanelSurface,
  FloatingPanelTitle,
  FloatingPanelTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Preview,
  PreviewContent,
  PreviewTrigger,
  Toast,
  ToastClose,
  ToastProvider,
  ToastRegion,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Tour,
  TourContent,
  TourTrigger,
  useToast,
} from "./index.js";
import { expectNoAxeViolations } from "../test/axe.js";
import { render } from "../test/render.js";

function NotifyButton() {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify("Saved", { timeout: null })}>
      Notify
    </button>
  );
}

describe("open overlays have no accessibility violations", () => {
  it("dialog", async () => {
    const { unmount } = render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent aria-label="Details">
          <h2>Details</h2>
          <button type="button">Done</button>
        </DialogContent>
      </Dialog>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "Open dialog" })));
    await expect.element(page.getByRole("dialog", { name: "Details" })).toBeVisible();

    await expectNoAxeViolations(document.body, "open dialog");
    unmount();
  });

  it("drawer", async () => {
    const { unmount } = render(
      <Drawer>
        <DrawerTrigger>Open drawer</DrawerTrigger>
        <DrawerContent aria-labelledby="drawer-title">
          <h2 id="drawer-title">Settings</h2>
          <button type="button">Save</button>
        </DrawerContent>
      </Drawer>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "Open drawer" })));
    await expect.element(page.getByRole("dialog", { name: "Settings" })).toBeVisible();

    await expectNoAxeViolations(document.body, "open drawer");
    unmount();
  });

  it("popover", async () => {
    const { unmount } = render(
      <Popover>
        <PopoverTrigger>More</PopoverTrigger>
        <PopoverContent aria-label="More choices">
          <button type="button">Choice</button>
        </PopoverContent>
      </Popover>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "More" })));
    await expect.element(page.getByRole("dialog", { name: "More choices" })).toBeVisible();

    await expectNoAxeViolations(document.body, "open popover");
    unmount();
  });

  it("tooltip", async () => {
    const { unmount } = render(
      <Tooltip>
        <TooltipTrigger>Save</TooltipTrigger>
        <TooltipContent>Saves the document</TooltipContent>
      </Tooltip>,
    );

    await act(async () => userEvent.tab());
    await expect.element(page.getByRole("tooltip")).toBeVisible();

    await expectNoAxeViolations(document.body, "open tooltip");
    unmount();
  });

  it("preview", async () => {
    const { unmount } = render(
      <Preview>
        <PreviewTrigger href="https://example.com/pkg">pkg</PreviewTrigger>
        <PreviewContent aria-label="Package details">
          Package details
          <button type="button">Star</button>
        </PreviewContent>
      </Preview>,
    );

    await act(async () => userEvent.tab());
    await expect
      .element(page.getByRole("link", { name: "pkg" }))
      .toHaveAttribute("aria-expanded", "true");

    await expectNoAxeViolations(document.body, "open preview");
    unmount();
  });

  it("tour step", async () => {
    const { unmount } = render(
      <Tour steps={[{ target: "search", title: "Find anything" }]}>
        <TourTrigger>Start tour</TourTrigger>
        <button type="button" data-tour-target="search">
          Search
        </button>
        <TourContent aria-label="Product tour">
          {({ step, close }) => (
            <>
              <p>{step.title}</p>
              <button type="button" onClick={close}>
                Close
              </button>
            </>
          )}
        </TourContent>
      </Tour>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "Start tour" })));
    await expect.element(page.getByRole("dialog", { name: "Product tour" })).toBeVisible();

    await expectNoAxeViolations(document.body, "open tour step");
    unmount();
  });

  it("toasts", async () => {
    const { unmount } = render(
      <ToastProvider>
        <NotifyButton />
        <ToastRegion>
          {(toast) => (
            <Toast toast={toast}>
              {toast.content}
              <ToastClose />
            </Toast>
          )}
        </ToastRegion>
      </ToastProvider>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "Notify" })));
    await expect.element(page.getByRole("status")).toBeVisible();

    await expectNoAxeViolations(document.body, "visible toasts");
    unmount();
  });

  it("floating panel", async () => {
    const { unmount } = render(
      <FloatingPanelGroup>
        <FloatingPanel>
          <FloatingPanelTrigger>Open layers</FloatingPanelTrigger>
          <FloatingPanelSurface>
            <FloatingPanelTitle>Layers</FloatingPanelTitle>
            <FloatingPanelDragHandle aria-label="Move Layers">Grip</FloatingPanelDragHandle>
            <FloatingPanelClose />
          </FloatingPanelSurface>
        </FloatingPanel>
      </FloatingPanelGroup>,
    );

    await act(async () => userEvent.click(page.getByRole("button", { name: "Open layers" })));
    await expect.element(page.getByRole("dialog", { name: "Layers" })).toBeVisible();

    await expectNoAxeViolations(document.body, "open floating panel");
    unmount();
  });
});
