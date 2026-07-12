import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import {
  Combobox,
  ComboboxPopover,
  ComboboxInput,
  ComboboxOption,
  Dialog,
  DialogContent,
  DialogTrigger,
  Popover,
  PopoverOverlay,
  PopoverTrigger,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

describe("real-browser interaction contracts", () => {
  it("light-dismisses picker popovers without stealing outside focus", async () => {
    const { container, unmount } = render(
      <div>
        <button type="button">Outside target</button>
        <Select id="light-dismiss-select">
          <Popover>
            <SelectTrigger>Choose</SelectTrigger>
            <SelectPopover>
              <SelectOption value="one">One</SelectOption>
            </SelectPopover>
          </Popover>
        </Select>
      </div>,
    );
    const [outside, trigger] = container.querySelectorAll<HTMLButtonElement>("button");
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    await act(async () => userEvent.click(trigger!));
    expect(content.matches(":popover-open")).toBe(true);
    await act(async () => userEvent.click(outside!));
    await vi.waitFor(() => expect(trigger?.getAttribute("aria-expanded")).toBe("false"));

    expect(content.matches(":popover-open")).toBe(false);
    expect(document.activeElement).toBe(outside);
    unmount();
  });

  it("restores a controlled picker popover when its owner rejects light dismissal", async () => {
    const onToggle = vi.fn();
    const { container, unmount } = render(
      <div>
        <button type="button">Outside target</button>
        <Select id="controlled-select">
          <Popover open onToggle={onToggle}>
            <SelectTrigger>Choose</SelectTrigger>
            <SelectPopover>
              <SelectOption value="one">One</SelectOption>
            </SelectPopover>
          </Popover>
        </Select>
      </div>,
    );
    const outside = container.querySelector<HTMLButtonElement>("button")!;
    const trigger = container.querySelectorAll<HTMLButtonElement>("button")[1]!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    expect(content.matches(":popover-open")).toBe(true);
    await act(async () => userEvent.click(outside));
    await vi.waitFor(() => expect(onToggle).toHaveBeenCalledWith(false));
    await vi.waitFor(() => expect(content.matches(":popover-open")).toBe(true));

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const option = container.querySelector<HTMLElement>("[role='option']")!;
    option.focus();
    onToggle.mockClear();
    fireKeyDown(option, "Escape");

    expect(onToggle).toHaveBeenCalledWith(false);
    expect(content.matches(":popover-open")).toBe(true);
    expect(document.activeElement).toBe(option);
    unmount();
  });

  it("settles incompatible controlled auto popovers without a reopening loop", async () => {
    const firstToggle = vi.fn();
    const secondToggle = vi.fn();
    const controlledPopovers = (firstOpen: boolean, secondOpen: boolean) => (
      <div>
        <Select id="first-controlled-select">
          <Popover open={firstOpen} onToggle={firstToggle}>
            <SelectTrigger>First choice</SelectTrigger>
            <SelectPopover>
              <SelectOption value="one">One</SelectOption>
            </SelectPopover>
          </Popover>
        </Select>
        <Select id="second-controlled-select">
          <Popover open={secondOpen} onToggle={secondToggle}>
            <SelectTrigger>Second choice</SelectTrigger>
            <SelectPopover>
              <SelectOption value="two">Two</SelectOption>
            </SelectPopover>
          </Popover>
        </Select>
      </div>
    );
    const { container, rerender, unmount } = render(controlledPopovers(true, true));
    const contents = Array.from(container.querySelectorAll<HTMLElement>("[role='listbox']"));

    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(contents.filter((content) => content.matches(":popover-open"))).toHaveLength(1);
    const winnerIndex = contents.findIndex((content) => content.matches(":popover-open"));
    const pendingIndex = winnerIndex === 0 ? 1 : 0;
    const settledToggleCount = firstToggle.mock.calls.length + secondToggle.mock.calls.length;

    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(firstToggle.mock.calls.length + secondToggle.mock.calls.length).toBe(settledToggleCount);

    rerender(controlledPopovers(winnerIndex !== 0, winnerIndex !== 1));
    await vi.waitFor(() => expect(contents[pendingIndex]?.matches(":popover-open")).toBe(true));
    expect(contents[winnerIndex]?.matches(":popover-open")).toBe(false);
    expect(contents[pendingIndex]?.getAttribute("aria-hidden")).not.toBe("true");
    unmount();
  });

  it("keeps controlled nested auto popovers in the same native stack", async () => {
    const nestedWithUnrelatedPopover = (unrelatedOpen: boolean) => (
      <div>
        <Popover open>
          <PopoverTrigger>Parent trigger</PopoverTrigger>
          <PopoverOverlay data-testid="parent-popover" popover="auto">
            Parent content
            <Popover open>
              <PopoverTrigger>Child trigger</PopoverTrigger>
              <PopoverOverlay data-testid="child-popover" popover="auto">
                Child content
              </PopoverOverlay>
            </Popover>
          </PopoverOverlay>
        </Popover>
        <Popover open={unrelatedOpen}>
          <PopoverTrigger>Unrelated trigger</PopoverTrigger>
          <PopoverOverlay data-testid="unrelated-popover" popover="auto">
            Unrelated content
          </PopoverOverlay>
        </Popover>
      </div>
    );
    const { container, rerender, unmount } = render(nestedWithUnrelatedPopover(false));
    const parent = container.querySelector<HTMLElement>("[data-testid='parent-popover']")!;
    const child = container.querySelector<HTMLElement>("[data-testid='child-popover']")!;
    const unrelated = container.querySelector<HTMLElement>("[data-testid='unrelated-popover']")!;

    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(parent.matches(":popover-open")).toBe(true);
    expect(child.matches(":popover-open")).toBe(true);

    rerender(nestedWithUnrelatedPopover(true));
    await vi.waitFor(() => expect(unrelated.matches(":popover-open")).toBe(true));
    expect(parent.matches(":popover-open")).toBe(false);
    expect(child.matches(":popover-open")).toBe(false);

    rerender(nestedWithUnrelatedPopover(false));
    await vi.waitFor(() => {
      expect(parent.matches(":popover-open")).toBe(true);
      expect(child.matches(":popover-open")).toBe(true);
    });
    unmount();
  });

  it("focuses the selected option when Select starts open", () => {
    const { container, unmount } = render(
      <Select id="initially-open-select" defaultValue="two">
        <Popover defaultOpen>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="one">One</SelectOption>
            <SelectOption value="two">Two</SelectOption>
          </SelectPopover>
        </Popover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    expect(content.matches(":popover-open")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Two");
    fireKeyDown(document.activeElement!, "Escape");
    expect(document.activeElement).toBe(trigger);
    unmount();
  });

  it("moves focus through select options and restores it after commit", () => {
    const { container, unmount } = render(
      <Select id="browser-select">
        <Popover>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="one">One</SelectOption>
            <SelectOption value="two">Two</SelectOption>
          </SelectPopover>
        </Popover>
      </Select>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;

    fireClick(trigger);
    expect(document.activeElement?.textContent).toBe("One");
    fireKeyDown(document.activeElement!, "Enter");

    expect(content.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    expect(container.querySelector("[data-value='one']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
    unmount();
  });

  it("keeps combobox focus in the input with a mounted active descendant", () => {
    const { container, unmount } = render(
      <Combobox id="browser-combobox" allowsEmptyCollection>
        <Popover>
          <ComboboxInput aria-label="Framework" />
          <ComboboxPopover>
            <ComboboxOption value="logical-react" id="dom-react">
              React
            </ComboboxOption>
          </ComboboxPopover>
        </Popover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    input.focus();
    fireKeyDown(input, "ArrowDown");

    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBe("dom-react");
    expect(document.getElementById("dom-react")).not.toBeNull();
    unmount();
  });

  it("uses native form validity and serialization for required pickers", () => {
    const { container, unmount } = render(
      <form>
        <Select id="browser-required-select" name="plan" required>
          <Popover>
            <SelectTrigger aria-label="Plan">Choose</SelectTrigger>
            <SelectPopover>
              <SelectOption value="pro">Pro</SelectOption>
            </SelectPopover>
          </Popover>
        </Select>
        <Combobox id="browser-required-combobox" name="city" defaultValue="paris" required>
          <Popover>
            <ComboboxInput aria-label="City" />
            <ComboboxPopover>
              <ComboboxOption value="paris">Paris</ComboboxOption>
            </ComboboxPopover>
          </Popover>
        </Combobox>
      </form>,
    );
    const form = container.querySelector("form")!;
    const trigger = container.querySelector<HTMLButtonElement>("button")!;

    let valid = true;
    act(() => {
      valid = form.checkValidity();
    });
    expect(valid).toBe(false);
    fireClick(trigger);
    fireClick(container.querySelector<HTMLElement>("[role='option']")!);

    act(() => {
      valid = form.checkValidity();
    });
    expect(valid).toBe(true);
    const data = new FormData(form);
    expect(data.get("plan")).toBe("pro");
    expect(data.get("city")).toBe("paris");
    unmount();
  });

  it("uses the native dialog lifecycle and restores trigger focus", () => {
    const { container, unmount } = render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent aria-label="Settings">Settings</DialogContent>
      </Dialog>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;

    trigger.focus();
    fireClick(trigger);
    const dialog = document.body.querySelector<HTMLDialogElement>("dialog")!;
    expect(dialog.open).toBe(true);

    act(() => {
      dialog.dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true }));
      dialog.close();
    });

    expect(document.activeElement).toBe(trigger);
    unmount();
  });
});
