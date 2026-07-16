import { act, useState } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it, vi } from "vitest";
import {
  Autocomplete,
  Combobox,
  ComboboxPopover,
  ComboboxInput,
  ComboboxOption,
  ContextMenu,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogTrigger,
  GridList,
  GridListDragHandle,
  GridListItem,
  GridListMoveButton,
  GridListReorderGroup,
  ListBox,
  ListBoxItem,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Popover,
  PopoverOverlay,
  PopoverTrigger,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
  SearchField,
  SearchFieldInput,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

describe("real-browser interaction contracts", () => {
  it("keeps a searchable menu editor inside the native popover and restores its trigger", () => {
    const activated = vi.fn();
    const { container, unmount } = render(
      <Autocomplete disableAutoFocusFirst>
        <Menu>
          <MenuTrigger aria-controls="browser-command-search" aria-haspopup="dialog">
            Commands
          </MenuTrigger>
          <MenuPopover id="browser-command-search" role="dialog" aria-label="Command search">
            <SearchField>
              <SearchFieldInput aria-label="Find a command" />
            </SearchField>
            <MenuList aria-label="Matching commands">
              <MenuItem id="browser-archive-command" onClick={activated} value="archive">
                Archive
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Autocomplete>,
    );
    const trigger = container.querySelector<HTMLButtonElement>("button")!;
    const input = container.querySelector<HTMLInputElement>("input")!;
    const surface = container.querySelector<HTMLElement>("[popover]")!;
    const menu = container.querySelector<HTMLElement>("[role='menu']")!;

    fireClick(trigger);
    expect(surface.matches(":popover-open")).toBe(true);
    expect(surface.contains(input)).toBe(true);
    expect(menu.contains(input)).toBe(false);
    expect(document.activeElement).toBe(input);

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("browser-archive-command");
    fireKeyDown(input, "Enter");

    expect(activated).toHaveBeenCalledOnce();
    expect(surface.matches(":popover-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    unmount();
  });

  it("suppresses the native context menu after a keyboard opener transfers focus", () => {
    const { container, unmount } = render(
      <ContextMenu id="browser-context-menu">
        <ContextMenuTrigger tabIndex={0}>Attachment</ContextMenuTrigger>
        <MenuPopover>
          <MenuList aria-label="Attachment actions">
            <MenuItem value="download" onContextMenu={(event) => event.stopPropagation()}>
              Download
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </ContextMenu>,
    );
    const trigger = container.querySelector<HTMLElement>("[tabindex='0']")!;
    const popover = container.querySelector<HTMLElement>("[popover]")!;
    const keydown = new KeyboardEvent("keydown", {
      key: "F10",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    act(() => trigger.dispatchEvent(keydown));
    expect(keydown.defaultPrevented).toBe(true);
    expect(popover.matches(":popover-open")).toBe(true);

    const nativeEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    act(() => document.activeElement?.dispatchEvent(nativeEvent));
    expect(nativeEvent.defaultPrevented).toBe(true);
    expect(popover.matches(":popover-open")).toBe(true);
    unmount();
  });

  it("light-dismisses picker popovers without stealing outside focus", async () => {
    const { container, unmount } = render(
      <div>
        <button type="button">Outside target</button>
        <Select id="light-dismiss-select">
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="one">One</SelectOption>
          </SelectPopover>
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
        <Select id="controlled-select" open onToggle={onToggle}>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="one">One</SelectOption>
          </SelectPopover>
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
    unmount();
  });

  it("keeps a controlled picker open when its owner rejects Escape", () => {
    const onToggle = vi.fn();
    const { container, unmount } = render(
      <Select open onToggle={onToggle}>
        <SelectTrigger>Choose</SelectTrigger>
        <SelectPopover>
          <SelectOption value="one">One</SelectOption>
        </SelectPopover>
      </Select>,
    );
    const content = container.querySelector<HTMLElement>("[role='listbox']")!;
    const option = container.querySelector<HTMLElement>("[role='option']")!;

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
        <Select id="first-controlled-select" open={firstOpen} onToggle={firstToggle}>
          <SelectTrigger>First choice</SelectTrigger>
          <SelectPopover>
            <SelectOption value="one">One</SelectOption>
          </SelectPopover>
        </Select>
        <Select id="second-controlled-select" open={secondOpen} onToggle={secondToggle}>
          <SelectTrigger>Second choice</SelectTrigger>
          <SelectPopover>
            <SelectOption value="two">Two</SelectOption>
          </SelectPopover>
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
      <Select id="initially-open-select" defaultValue="two" defaultOpen>
        <SelectTrigger>Choose</SelectTrigger>
        <SelectPopover>
          <SelectOption value="one">One</SelectOption>
          <SelectOption value="two">Two</SelectOption>
        </SelectPopover>
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
        <SelectTrigger>Choose</SelectTrigger>
        <SelectPopover>
          <SelectOption value="one">One</SelectOption>
          <SelectOption value="two">Two</SelectOption>
        </SelectPopover>
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
      <Combobox id="browser-combobox" allowEmptyCollection>
        <ComboboxInput aria-label="Framework" />
        <ComboboxPopover>
          <ComboboxOption value="logical-react" id="dom-react">
            React
          </ComboboxOption>
        </ComboboxPopover>
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

  it("keeps autocomplete focus in SearchField while keyboard selection uses ListBox state", async () => {
    const { container, unmount } = render(
      <form>
        <Autocomplete filter={(textValue, inputValue) => textValue.includes(inputValue)}>
          <SearchField>
            <SearchFieldInput aria-label="Destination" name="destination" />
          </SearchField>
          <ListBox aria-label="Destination suggestions">
            <ListBoxItem value="logical-warsaw" id="warsaw-suggestion">
              Warsaw
            </ListBoxItem>
          </ListBox>
        </Autocomplete>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector<HTMLInputElement>("input")!;

    await act(async () => userEvent.click(input));
    await act(async () => userEvent.fill(input, "War"));
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-activedescendant")).toBe("warsaw-suggestion");

    await act(async () => userEvent.keyboard("{Enter}"));
    expect(container.querySelector("#warsaw-suggestion")?.getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(input.value).toBe("War");
    expect(new FormData(form).get("destination")).toBe("War");
    expect(document.activeElement).toBe(input);
    unmount();
  });

  it("drags from a row or its handle without taking over nested controls", async () => {
    function Board() {
      const [order, setOrder] = useState<Record<string, string[]>>({
        todo: ["review", "later"],
        done: [],
      });
      return (
        <GridListReorderGroup value={order} onChange={setOrder}>
          <GridList name="todo" aria-label="To do">
            {order["todo"]!.map((rowValue) => (
              <GridListItem key={rowValue} value={rowValue} textValue={rowValue}>
                <GridListDragHandle>Move</GridListDragHandle>
                <span data-slot="row-body">{rowValue}</span>
                <button type="button">Share</button>
                <a href="#review" draggable>
                  Open
                </a>
              </GridListItem>
            ))}
          </GridList>
          <GridList name="done" aria-label="Done">
            {order["done"]!.map((rowValue) => (
              <GridListItem key={rowValue} value={rowValue} textValue={rowValue}>
                <GridListDragHandle>Move</GridListDragHandle>
                {rowValue}
              </GridListItem>
            ))}
          </GridList>
        </GridListReorderGroup>
      );
    }

    const { container, unmount } = render(<Board />);
    const handle = container.querySelector<HTMLElement>("[data-slot='grid-list-drag-handle']")!;
    const source = container.querySelector<HTMLElement>("[data-value='review']")!;
    const body = source.querySelector<HTMLElement>("[data-slot='row-body']")!;
    const button = source.querySelector<HTMLButtonElement>("button:not([data-slot])")!;
    const link = source.querySelector<HTMLAnchorElement>("a")!;
    const destination = container.querySelector<HTMLElement>("[aria-label='Done']")!;
    const transfer = new DataTransfer();

    act(() => {
      link.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    expect(source.hasAttribute("data-dragging")).toBe(false);

    act(() => {
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      source.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    expect(source.hasAttribute("data-dragging")).toBe(false);

    act(() => {
      body.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    expect(source.hasAttribute("data-dragging")).toBe(true);
    act(() => {
      source.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: transfer }));
    });

    act(() => {
      handle.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    act(() => {
      destination.dispatchEvent(
        new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    expect(destination.hasAttribute("data-drop-target")).toBe(true);

    act(() => {
      destination.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    });
    expect(destination.querySelector("[data-value='review']")).toBeTruthy();
    await act(async () => new Promise((resolve) => setTimeout(resolve)));
    const movedRow = destination.querySelector<HTMLElement>("[data-value='review']")!;
    expect(document.activeElement).toBe(movedRow);
    expect(movedRow.tabIndex).toBe(0);
    expect(container.querySelector<HTMLElement>("[data-value='later']")?.tabIndex).toBe(0);
    unmount();
  });

  it("starts whole-row reordering only from the row itself", () => {
    const { container, unmount } = render(
      <GridList aria-label="Files" onReorder={() => {}}>
        <GridListItem value="report" textValue="Report">
          <a href="#report" draggable>
            Report
          </a>
        </GridListItem>
        <GridListItem value="notes">Notes</GridListItem>
      </GridList>,
    );
    const row = container.querySelector<HTMLElement>("[data-value='report']")!;
    const link = row.querySelector<HTMLAnchorElement>("a")!;

    act(() => {
      link.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        }),
      );
    });
    expect(row.hasAttribute("data-dragging")).toBe(false);

    act(() => {
      row.dispatchEvent(
        new DragEvent("dragstart", {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        }),
      );
    });
    expect(row.hasAttribute("data-dragging")).toBe(true);
    unmount();
  });

  it("prevents pointer and keyboard activation of a disabled row's move button", () => {
    function Board() {
      const [order, setOrder] = useState<Record<string, string[]>>({
        todo: ["review"],
        done: [],
      });
      return (
        <GridListReorderGroup value={order} onChange={setOrder}>
          <GridList name="todo" aria-label="To do">
            <GridListItem value="review" textValue="Review changes" disabled>
              Review changes
              <GridListMoveButton to="done">Move to done</GridListMoveButton>
            </GridListItem>
          </GridList>
          <GridList name="done" aria-label="Done">
            {order["done"]?.map((rowValue) => (
              <GridListItem key={rowValue} value={rowValue}>
                Review changes
              </GridListItem>
            ))}
          </GridList>
        </GridListReorderGroup>
      );
    }

    const { container, unmount } = render(<Board />);
    const button = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    const destination = container.querySelector<HTMLElement>("[aria-label='Done']")!;

    expect(button.disabled).toBe(true);
    act(() => {
      button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    button.focus();
    expect(document.activeElement).not.toBe(button);
    act(() => {
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      button.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    });

    expect(destination.querySelector("[data-value='review']")).toBeNull();
    unmount();
  });

  it("uses native form validity and serialization for required pickers", () => {
    const { container, unmount } = render(
      <form>
        <Select id="browser-required-select" name="plan" required>
          <SelectTrigger aria-label="Plan">Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox id="browser-required-combobox" name="city" defaultValue="paris" required>
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
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
