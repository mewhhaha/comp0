import { act, useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { GridList } from "./components/GridList.js";
import { GridListDragHandle } from "./components/GridListDragHandle.js";
import { GridListItem } from "./components/GridListItem.js";
import { GridListMoveButton } from "./components/GridListMoveButton.js";
import {
  GridListReorderGroup,
  type GridListMove,
  type GridListOrder,
} from "./components/GridListReorderGroup.js";

function renderGridList(onChange = vi.fn()) {
  const result = render(
    <GridList aria-label="Files" onChange={onChange}>
      <GridListItem value="report">
        report.pdf <button type="button">Share</button> <button type="button">Delete</button>
      </GridListItem>
      <GridListItem value="notes" disabled>
        notes.txt
      </GridListItem>
      <GridListItem value="photo">photo.png</GridListItem>
    </GridList>,
  );
  const rows = result.container.querySelectorAll<HTMLElement>("[role='row']");
  return { ...result, onChange, rows };
}

function GroupedLists({
  initial,
  spy,
  canMove,
  disabledValues = [],
}: {
  initial: Record<string, string[]>;
  spy: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  disabledValues?: readonly string[] | undefined;
}) {
  const [order, setOrder] = useState(initial);
  const names = Object.keys(order);

  return (
    <GridListReorderGroup
      value={order}
      canMove={canMove}
      onChange={(next, move) => {
        spy(next, move);
        setOrder(next);
      }}
    >
      {names.map((name) => (
        <GridList key={name} name={name} aria-label={name}>
          {order[name]!.map((rowValue) => (
            <GridListItem
              key={rowValue}
              value={rowValue}
              textValue={rowValue}
              disabled={disabledValues.includes(rowValue)}
            >
              <GridListDragHandle>Move</GridListDragHandle>
              {rowValue}
              {names
                .filter((targetName) => targetName !== name)
                .map((targetName) => (
                  <GridListMoveButton key={targetName} to={targetName}>
                    Move to {targetName}
                  </GridListMoveButton>
                ))}
            </GridListItem>
          ))}
        </GridList>
      ))}
    </GridListReorderGroup>
  );
}

type ControlledGroupedListsProps = {
  order: Record<string, string[]>;
  onChange: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  pending?: boolean | undefined;
  showDone?: boolean | undefined;
  disabledValues?: readonly string[] | undefined;
};

function ControlledGroupedLists({
  order,
  onChange,
  canMove,
  pending,
  showDone = true,
  disabledValues = [],
}: ControlledGroupedListsProps) {
  return (
    <GridListReorderGroup value={order} onChange={onChange} canMove={canMove} pending={pending}>
      <button type="button" data-outside-focus>
        Outside
      </button>
      <GridList name="todo" aria-label="To do">
        {order["todo"]!.map((rowValue) => (
          <GridListItem
            key={rowValue}
            value={rowValue}
            textValue={rowValue}
            disabled={disabledValues.includes(rowValue)}
          >
            {rowValue}
            <GridListMoveButton to="done">Move to done</GridListMoveButton>
            <button type="button" data-row-details>
              Details
            </button>
          </GridListItem>
        ))}
      </GridList>
      {showDone && (
        <GridList name="done" aria-label="Done">
          {order["done"]!.map((rowValue) => (
            <GridListItem
              key={rowValue}
              value={rowValue}
              textValue={rowValue}
              disabled={disabledValues.includes(rowValue)}
            >
              {rowValue}
              <GridListMoveButton to="todo">Move to todo</GridListMoveButton>
              <button type="button" data-row-details>
                Details
              </button>
            </GridListItem>
          ))}
        </GridList>
      )}
    </GridListReorderGroup>
  );
}

type PendingControlledGroupedListsProps = Omit<ControlledGroupedListsProps, "pending"> & {
  settled?: boolean | undefined;
};

function PendingControlledGroupedLists({
  onChange,
  settled = false,
  ...props
}: PendingControlledGroupedListsProps) {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (settled) setPending(false);
  }, [settled]);

  return (
    <ControlledGroupedLists
      {...props}
      pending={pending}
      onChange={(next, move) => {
        setPending(true);
        onChange(next, move);
      }}
    />
  );
}

describe("grid list composition", () => {
  it("renders a grid of rows with gridcells and one tab stop", () => {
    const { container, rows } = renderGridList();
    expect(container.querySelector("[role='grid']")).toBeTruthy();
    expect(rows).toHaveLength(3);
    expect(container.querySelectorAll("[role='gridcell']")).toHaveLength(3);
    expect(rows[0]!.tabIndex).toBe(0);
    expect(rows[2]!.tabIndex).toBe(-1);
    for (const button of container.querySelectorAll("button")) {
      expect(button.tabIndex).toBe(-1);
    }
  });

  it("moves row focus with arrows, skipping disabled rows", () => {
    const { rows } = renderGridList();
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(rows[2]);
    fireKeyDown(document.activeElement!, "ArrowUp");
    expect(document.activeElement).toBe(rows[0]);
    fireKeyDown(document.activeElement!, "End");
    expect(document.activeElement).toBe(rows[2]);
    fireKeyDown(document.activeElement!, "Home");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("steps into and out of a row's interactive children with left and right", () => {
    const { rows } = renderGridList();
    const buttons = rows[0]!.querySelectorAll("button");
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[1]);
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("selects a focused row with Enter and click, but not via child actions", () => {
    const { onChange, rows } = renderGridList();
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "Enter");
    expect(onChange).toHaveBeenLastCalledWith("report");
    expect(rows[0]!.dataset["selected"]).toBe("");
    expect(rows[0]!.getAttribute("aria-selected")).toBe("true");

    fireClick(rows[2]!);
    expect(onChange).toHaveBeenLastCalledWith("photo");

    onChange.mockClear();
    fireClick(rows[0]!.querySelector("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });

  function ReorderableList({
    spy,
    canReorder,
    withHandle = false,
  }: {
    spy: (values: string[]) => void;
    canReorder?: ((values: string[], moved: string) => boolean) | undefined;
    withHandle?: boolean;
  }) {
    const [files, setFiles] = useState(["report.pdf", "photos.zip", "notes.txt"]);
    return (
      <GridList
        aria-label="Files"
        canReorder={canReorder}
        onReorder={(next) => {
          spy(next);
          setFiles(next);
        }}
      >
        {files.map((name) => (
          <GridListItem key={name} value={name} textValue={name}>
            <span data-slot="row-label">{name}</span>
            {withHandle && <GridListDragHandle>⋮⋮</GridListDragHandle>}
          </GridListItem>
        ))}
      </GridList>
    );
  }

  function fireDrag(element: Element, type: string, clientY = 0) {
    act(() => {
      element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientY }));
    });
  }

  const flushTimers = () => act(() => new Promise<void>((resolve) => setTimeout(resolve)));

  it("moves a row with Alt+Arrow, keeps focus on it, and announces the position", async () => {
    const spy = vi.fn();
    const { container } = render(<ReorderableList spy={spy} />);
    const rowValues = () =>
      [...container.querySelectorAll<HTMLElement>("[role='row']")].map(
        (row) => row.dataset["value"],
      );
    const first = container.querySelector<HTMLElement>("[role='row']")!;
    expect(first.getAttribute("aria-keyshortcuts")).toBe("Alt+ArrowUp Alt+ArrowDown");

    first.focus();
    fireKeyDown(first, "ArrowDown", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
    expect(rowValues()).toEqual(["photos.zip", "report.pdf", "notes.txt"]);

    await flushTimers();
    expect(document.activeElement).toBe(container.querySelectorAll("[role='row']")[1]);
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Moved report.pdf to position 2 of 3.",
    );

    fireKeyDown(document.activeElement!, "ArrowUp", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(["report.pdf", "photos.zip", "notes.txt"]);
    await flushTimers();

    spy.mockClear();
    fireKeyDown(document.activeElement!, "ArrowUp", { altKey: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it("shows a styleable drop preview while dragging and reorders on drop", () => {
    const spy = vi.fn();
    const { container } = render(<ReorderableList spy={spy} />);
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    const [first, , last] = rows;
    Object.defineProperty(last!, "getBoundingClientRect", {
      value: () => ({ top: 80, height: 40, bottom: 120, left: 0, right: 100, width: 100 }),
    });

    expect(first!.draggable).toBe(true);
    fireDrag(first!, "dragstart");
    expect(first!.hasAttribute("data-dragging")).toBe(true);

    fireDrag(last!, "dragover", 85);
    expect(last!.hasAttribute("data-drop-before")).toBe(true);
    expect(last!.hasAttribute("data-drop-after")).toBe(false);

    fireDrag(last!, "dragover", 115);
    expect(last!.hasAttribute("data-drop-after")).toBe(true);
    expect(last!.hasAttribute("data-drop-before")).toBe(false);

    fireDrag(last!, "drop", 115);
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "notes.txt", "report.pdf"]);

    fireDrag(first!, "dragend");
    for (const row of container.querySelectorAll("[role='row']")) {
      expect(row.hasAttribute("data-dragging")).toBe(false);
      expect(row.hasAttribute("data-drop-before")).toBe(false);
      expect(row.hasAttribute("data-drop-after")).toBe(false);
    }
  });

  it("keeps rows undraggable without onReorder", () => {
    const { rows } = renderGridList();
    expect(rows[0]!.draggable).toBe(false);
    expect(rows[0]!.hasAttribute("aria-keyshortcuts")).toBe(false);
  });

  it("keeps the whole row draggable when it has a drag handle", () => {
    const spy = vi.fn();
    const { container } = render(<ReorderableList spy={spy} withHandle />);
    const row = container.querySelector<HTMLElement>("[role='row']")!;
    const cell = row.querySelector<HTMLElement>("[role='gridcell']")!;
    const label = row.querySelector<HTMLElement>("[data-slot='row-label']")!;
    const handle = row.querySelector<HTMLButtonElement>("[data-slot='grid-list-drag-handle']")!;

    expect(row.draggable).toBe(true);
    expect(handle.draggable).toBe(true);
    expect(handle.getAttribute("aria-label")).toBe("Reorder report.pdf");

    fireDrag(cell, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(true);
    fireDrag(row, "dragend");

    fireDrag(label, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(true);
    fireDrag(row, "dragend");

    fireDrag(handle, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(true);
    fireDrag(row, "dragend");

    handle.focus();
    fireKeyDown(handle, "ArrowDown", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
  });

  it("does not start row dragging from nested interactive controls", () => {
    const { container } = render(
      <GridList aria-label="Files" onReorder={() => {}}>
        <GridListItem value="report" textValue="Report">
          <GridListDragHandle>Move</GridListDragHandle>
          <span data-slot="row-body">Report</span>
          <button type="button">
            Share
            <svg aria-hidden="true">
              <circle />
            </svg>
          </button>
          <a href="#report" draggable>
            Open
          </a>
          <input aria-label="Rename report" />
        </GridListItem>
      </GridList>,
    );
    const row = container.querySelector<HTMLElement>("[role='row']")!;
    const button = row.querySelector<HTMLButtonElement>("button:not([data-slot])")!;
    const icon = button.querySelector("svg")!;
    const link = row.querySelector("a")!;
    const input = row.querySelector("input")!;

    fireDrag(button, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(false);
    fireDrag(icon, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(false);
    fireDrag(link, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(false);
    fireDrag(input, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(false);

    act(() => {
      button.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    fireDrag(row, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(false);

    fireDrag(row.querySelector("[data-slot='row-body']")!, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(true);
  });

  it("blocks vetoed orders: no drop preview, no move, and a spoken explanation", () => {
    const spy = vi.fn();
    const keepNotesLast = (values: string[]) => values.at(-1) === "notes.txt";
    const { container } = render(<ReorderableList spy={spy} canReorder={keepNotesLast} />);
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    const [first, second, last] = rows;
    Object.defineProperty(last!, "getBoundingClientRect", {
      value: () => ({ top: 80, height: 40, bottom: 120, left: 0, right: 100, width: 100 }),
    });

    // Dropping report.pdf after notes.txt would unseat it; no preview appears.
    fireDrag(first!, "dragstart");
    fireDrag(last!, "dragover", 115);
    expect(last!.hasAttribute("data-drop-after")).toBe(false);
    fireDrag(last!, "dragover", 85);
    expect(last!.hasAttribute("data-drop-before")).toBe(true);
    fireDrag(first!, "dragend");

    // Alt+ArrowDown from photos.zip would push notes.txt up; it is refused aloud.
    second!.focus();
    fireKeyDown(second!, "ArrowDown", { altKey: true });
    expect(spy).not.toHaveBeenCalled();
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Cannot move photos.zip there.",
    );

    fireKeyDown(second!, "ArrowUp", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
  });

  it("moves a row between named lists with one atomic pointer transaction", async () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists initial={{ todo: ["design"], done: ["ship"] }} spy={spy} />,
    );
    const source = container.querySelector<HTMLElement>("[data-value='design']")!;
    const target = container.querySelector<HTMLElement>("[data-value='ship']")!;
    const origin = container.querySelector<HTMLElement>("[aria-label='todo']")!;
    const destination = container.querySelector<HTMLElement>("[aria-label='done']")!;
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({ top: 80, height: 40, bottom: 120, left: 0, right: 100, width: 100 }),
    });

    fireDrag(source.querySelector("[data-slot='grid-list-drag-handle']")!, "dragstart");
    fireDrag(target, "dragover", 85);
    expect(destination.hasAttribute("data-drop-target")).toBe(true);
    expect(target.hasAttribute("data-drop-before")).toBe(true);
    fireDrag(target, "drop", 85);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(
      { todo: [], done: ["design", "ship"] },
      {
        value: "design",
        from: { list: "todo", index: 0 },
        to: { list: "done", index: 0 },
        before: "ship",
      },
    );
    expect(destination.querySelectorAll("[role='row']")).toHaveLength(2);
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Moved design to done, position 1 of 2.",
    );
    await flushTimers();
    expect(document.activeElement?.getAttribute("data-value")).toBe("design");
    expect(origin.querySelectorAll("[role='row']")).toHaveLength(0);
    expect(target.tabIndex).toBe(-1);
    expect(destination.querySelector<HTMLElement>("[data-value='design']")?.tabIndex).toBe(0);
  });

  it("repairs each list's tab stop after repeated cross-list moves", () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists initial={{ todo: ["design", "build"], done: ["ship"] }} spy={spy} />,
    );
    const tabStopValues = (name: string) =>
      [...container.querySelectorAll<HTMLElement>(`[aria-label='${name}'] [role='row']`)]
        .filter((row) => row.tabIndex === 0)
        .map((row) => row.dataset["value"]);

    expect(tabStopValues("todo"), "initial todo tab stop").toEqual(["design"]);
    expect(tabStopValues("done"), "initial done tab stop").toEqual(["ship"]);

    fireClick(container.querySelector("[data-value='design'] [data-to='done']")!);
    expect(document.activeElement?.getAttribute("data-value"), "focused row after first move").toBe(
      "design",
    );
    expect(
      container.querySelector("[aria-label='done']")?.contains(document.activeElement),
      "focused row belongs to destination after first move",
    ).toBe(true);
    expect(tabStopValues("todo"), "todo tab stop after first move").toEqual(["build"]);
    expect(tabStopValues("done"), "done tab stop after first move").toEqual(["design"]);

    fireClick(container.querySelector("[data-value='design'] [data-to='todo']")!);
    expect(tabStopValues("todo"), "todo tab stop after return move").toEqual(["design"]);
    expect(tabStopValues("done"), "done tab stop after return move").toEqual(["ship"]);

    fireClick(container.querySelector("[data-value='design'] [data-to='done']")!);
    expect(tabStopValues("todo"), "todo tab stop after repeated move").toEqual(["build"]);
    expect(tabStopValues("done"), "done tab stop after repeated move").toEqual(["design"]);
    expect(document.activeElement?.getAttribute("data-value")).toBe("design");
  });

  it("announces and focuses a controlled move only after its order is accepted", () => {
    const changed = vi.fn();
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };
    const { container, rerender } = render(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );
    const moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    act(() => moveButton.focus());

    fireClick(moveButton);

    expect(changed).toHaveBeenLastCalledWith(
      accepted,
      expect.objectContaining({ value: "design", to: { list: "done", index: 0 } }),
    );
    expect(container.querySelector("[aria-label='To do'] [data-value='design']")).toBeTruthy();
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
    expect(document.activeElement).toBe(moveButton);

    rerender(<PendingControlledGroupedLists order={accepted} onChange={changed} settled />);

    const movedRow = container.querySelector<HTMLElement>(
      "[aria-label='Done'] [data-value='design']",
    )!;
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Moved design to Done, position 1 of 1.",
    );
    expect(document.activeElement).toBe(movedRow);
    expect(movedRow.tabIndex).toBe(0);

    const outside = container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => outside.focus());
    rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={changed}
        settled
        showDone={false}
      />,
    );
    rerender(<PendingControlledGroupedLists order={accepted} onChange={changed} settled />);
    expect(document.activeElement).toBe(outside);
  });

  it("unlocks silently when the controlled owner rejects a move", () => {
    const changed = vi.fn();
    const order = { todo: ["design"], done: [] as string[] };
    const { container } = render(<ControlledGroupedLists order={order} onChange={changed} />);
    const moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    act(() => moveButton.focus());

    fireClick(moveButton);

    expect(changed).toHaveBeenCalledTimes(1);
    expect(moveButton.disabled).toBe(false);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
    expect(document.activeElement).toBe(moveButton);

    fireClick(moveButton);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("blocks a second controlled move until the first proposal is acknowledged", () => {
    const changed = vi.fn();
    const initial = { todo: ["design", "build"], done: [] as string[] };
    const afterDesign = { todo: ["build"], done: ["design"] };
    const afterBuild = { todo: [] as string[], done: ["design", "build"] };
    const { container, rerender } = render(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );

    fireClick(container.querySelector("[data-value='design'] [data-to='done']")!);
    const pendingButton = container.querySelector<HTMLButtonElement>(
      "[data-value='build'] [data-to='done']",
    )!;
    expect(pendingButton.disabled).toBe(true);
    fireClick(pendingButton);
    expect(changed).toHaveBeenCalledTimes(1);

    rerender(<PendingControlledGroupedLists order={afterDesign} onChange={changed} settled />);
    const acknowledgedButton = container.querySelector<HTMLButtonElement>(
      "[data-value='build'] [data-to='done']",
    )!;
    expect(acknowledgedButton.disabled).toBe(false);
    fireClick(acknowledgedButton);
    expect(changed).toHaveBeenLastCalledWith(
      afterBuild,
      expect.objectContaining({ value: "build", from: { list: "todo", index: 0 } }),
    );
  });

  it("keeps waiting across equivalent orders and unlocks after an asynchronous rejection", () => {
    const changed = vi.fn();
    const initial = { todo: ["design"], done: [] as string[] };
    const equivalent = { todo: ["design"], done: [] as string[] };
    const { container, rerender } = render(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );
    let moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;

    fireClick(moveButton);
    rerender(<PendingControlledGroupedLists order={equivalent} onChange={changed} />);

    moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    expect(moveButton.disabled).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");

    rerender(<PendingControlledGroupedLists order={equivalent} onChange={changed} settled />);
    moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    expect(moveButton.disabled).toBe(false);

    fireClick(moveButton);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("clears focus requests that a committed destination cannot service", () => {
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };

    const missing = render(<PendingControlledGroupedLists order={initial} onChange={() => {}} />);
    const missingMoveButton =
      missing.container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    act(() => missingMoveButton.focus());
    fireClick(missingMoveButton);
    missing.rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={() => {}}
        settled
        showDone={false}
      />,
    );
    const missingOutside =
      missing.container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => missingOutside.focus());
    missing.rerender(
      <PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />,
    );
    expect(document.activeElement).toBe(missingOutside);
    missing.unmount();

    const disabled = render(<PendingControlledGroupedLists order={initial} onChange={() => {}} />);
    const disabledMoveButton =
      disabled.container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    act(() => disabledMoveButton.focus());
    fireClick(disabledMoveButton);
    disabled.rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={() => {}}
        settled
        disabledValues={["design"]}
      />,
    );
    const disabledOutside =
      disabled.container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => disabledOutside.focus());
    disabled.rerender(
      <PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />,
    );
    expect(document.activeElement).toBe(disabledOutside);
  });

  it("does not steal focus when the user leaves before a controlled move is accepted", () => {
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };
    const { container, rerender } = render(
      <PendingControlledGroupedLists order={initial} onChange={() => {}} />,
    );
    const moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    act(() => moveButton.focus());
    fireClick(moveButton);
    const outside = container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => outside.focus());

    rerender(<PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />);

    expect(document.activeElement).toBe(outside);
  });

  it("skips a move button that becomes disabled after policy changes", () => {
    const order = { todo: ["design"], done: [] as string[] };
    const allow = () => true;
    const veto = () => false;
    const { container, rerender } = render(
      <ControlledGroupedLists order={order} onChange={() => {}} canMove={allow} />,
    );
    const row = container.querySelector<HTMLElement>("[data-value='design']")!;
    let moveButton = row.querySelector<HTMLButtonElement>("[data-to='done']")!;
    expect(moveButton.disabled).toBe(false);

    rerender(<ControlledGroupedLists order={order} onChange={() => {}} canMove={veto} />);
    moveButton = row.querySelector<HTMLButtonElement>("[data-to='done']")!;
    expect(moveButton.disabled).toBe(true);

    act(() => row.focus());
    fireKeyDown(row, "ArrowRight");
    expect(document.activeElement).toBe(row.querySelector("[data-row-details]"));
  });

  it("accepts a drop on an empty list and exposes its root preview", () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists initial={{ todo: ["design"], done: [] }} spy={spy} />,
    );
    const source = container.querySelector<HTMLElement>("[data-value='design']")!;
    const destination = container.querySelector<HTMLElement>("[aria-label='done']")!;

    fireDrag(source.querySelector("[data-slot='grid-list-drag-handle']")!, "dragstart");
    fireDrag(destination, "dragover");
    expect(destination.hasAttribute("data-drop-target")).toBe(true);
    fireDrag(destination, "drop");

    expect(spy).toHaveBeenLastCalledWith(
      { todo: [], done: ["design"] },
      {
        value: "design",
        from: { list: "todo", index: 0 },
        to: { list: "done", index: 0 },
        before: null,
      },
    );
    expect(destination.querySelector("[data-value='design']")).toBeTruthy();
  });

  it("provides a click and keyboard reachable move button instead of requiring a drag", () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists initial={{ todo: ["design"], done: [] }} spy={spy} />,
    );
    const button = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button'][data-to='done']",
    )!;

    expect(button.getAttribute("aria-label")).toBe("Move design to done");
    expect(button.disabled).toBe(false);
    fireClick(button);
    expect(spy).toHaveBeenLastCalledWith(
      { todo: [], done: ["design"] },
      expect.objectContaining({ value: "design", to: { list: "done", index: 0 } }),
    );
  });

  it("keeps a disabled row stationary through its move button", () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists
        initial={{ todo: ["design"], done: [] }}
        spy={spy}
        disabledValues={["design"]}
      />,
    );
    const source = container.querySelector<HTMLElement>("[data-value='design']")!;
    const button = source.querySelector<HTMLButtonElement>("[data-to='done']")!;

    expect(button.disabled).toBe(true);
    fireClick(button);
    fireKeyDown(button, "Enter");
    fireKeyDown(button, " ");

    expect(spy).not.toHaveBeenCalled();
    expect(source.closest("[aria-label='todo']")).toBeTruthy();
  });

  it("labels a move button from the resolved row label", () => {
    const { container } = render(
      <GridListReorderGroup value={{ todo: ["opaque-value"], done: [] }} onChange={() => {}}>
        <GridList name="todo" aria-label="To do" defaultValue="opaque-value">
          <GridListItem value="opaque-value">
            <span>Design task</span>
            <GridListMoveButton to="done" />
          </GridListItem>
        </GridList>
        <GridList name="done" aria-label="Completed work" />
      </GridListReorderGroup>,
    );

    expect(container.querySelector("[data-to='done']")?.getAttribute("aria-label")).toBe(
      "Move Design task to Completed work",
    );
  });

  it("updates destination labels when their accessible names change in the DOM", async () => {
    const order = { todo: ["design"], done: [] as string[] };
    const { container } = render(
      <>
        <span id="done-label">Completed work</span>
        <GridListReorderGroup value={order} onChange={() => {}}>
          <GridList name="todo" aria-label="To do">
            <GridListItem value="design" textValue="design">
              Design
              <GridListMoveButton to="done" />
            </GridListItem>
          </GridList>
          <GridList name="done" aria-labelledby="done-label" />
        </GridListReorderGroup>
      </>,
    );
    const moveButton = container.querySelector<HTMLButtonElement>("[data-to='done']")!;
    const destination = container.querySelector<HTMLElement>("[aria-labelledby='done-label']")!;
    const label = container.querySelector<HTMLElement>("#done-label")!;
    expect(moveButton.getAttribute("aria-label")).toBe("Move design to Completed work");

    await act(async () => {
      label.textContent = "Shipped work";
      await Promise.resolve();
    });
    expect(moveButton.getAttribute("aria-label")).toBe("Move design to Shipped work");

    await act(async () => {
      destination.setAttribute("aria-label", "Archive");
      await Promise.resolve();
    });
    expect(moveButton.getAttribute("aria-label")).toBe("Move design to Shipped work");

    await act(async () => {
      destination.removeAttribute("aria-labelledby");
      await Promise.resolve();
    });
    expect(moveButton.getAttribute("aria-label")).toBe("Move design to Archive");
  });

  it("keeps Alt+Arrow reordering inside a grouped list", () => {
    const spy = vi.fn();
    const { container } = render(
      <GroupedLists initial={{ todo: ["one", "two"], done: [] }} spy={spy} />,
    );
    const first = container.querySelector<HTMLElement>("[data-value='one']")!;

    first.focus();
    fireKeyDown(first, "ArrowDown", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(
      { todo: ["two", "one"], done: [] },
      {
        value: "one",
        from: { list: "todo", index: 0 },
        to: { list: "todo", index: 1 },
        before: null,
      },
    );
  });

  it("vetoes grouped previews, drops, and move buttons with one policy", () => {
    const spy = vi.fn();
    const canMove = (_value: GridListOrder, move: GridListMove) => move.to.list !== "done";
    const { container } = render(
      <GroupedLists initial={{ todo: ["design"], done: [] }} spy={spy} canMove={canMove} />,
    );
    const source = container.querySelector<HTMLElement>("[data-value='design']")!;
    const destination = container.querySelector<HTMLElement>("[aria-label='done']")!;
    const button = source.querySelector<HTMLButtonElement>("[data-to='done']")!;

    expect(button.disabled).toBe(true);
    fireDrag(source.querySelector("[data-slot='grid-list-drag-handle']")!, "dragstart");
    fireDrag(destination, "dragover");
    expect(destination.hasAttribute("data-drop-target")).toBe(false);
    fireDrag(destination, "drop");
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects duplicate values and ambiguous reorder owners with evidence", () => {
    expect(() =>
      render(
        <GridListReorderGroup
          value={{ first: ["duplicate"], second: ["duplicate"] }}
          onChange={() => {}}
        >
          <GridList name="first" aria-label="First" />
          <GridList name="second" aria-label="Second" />
        </GridListReorderGroup>,
      ),
    ).toThrow('GridListReorderGroup value "duplicate" appears in both "first" and "second"');

    expect(() =>
      render(
        <GridList aria-label="Files">
          <GridListItem value="duplicate">First</GridListItem>
          <GridListItem value="duplicate">Second</GridListItem>
        </GridList>,
      ),
    ).toThrow('GridListItem value "duplicate" is rendered more than once inside GridList.');

    expect(() =>
      render(
        <GridListReorderGroup value={{ first: ["duplicate"], second: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First">
            <GridListItem value="duplicate">First owner</GridListItem>
          </GridList>
          <GridList name="second" aria-label="Second">
            <GridListItem value="duplicate">Second owner</GridListItem>
          </GridList>
        </GridListReorderGroup>,
      ),
    ).toThrow(
      'GridListItem value "duplicate" is rendered more than once inside GridListReorderGroup (in "first" and "second").',
    );

    expect(() =>
      render(
        <GridListReorderGroup value={{ first: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First" onReorder={() => {}} />
        </GridListReorderGroup>,
      ),
    ).toThrow('GridList "first" cannot use onReorder or canReorder');

    expect(() =>
      render(
        <GridListReorderGroup value={{ first: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First copy" />
          <GridList name="first" aria-label="Second copy" />
        </GridListReorderGroup>,
      ),
    ).toThrow('GridList name "first" is rendered more than once inside GridListReorderGroup.');

    expect(() =>
      render(
        <GridListReorderGroup value={{ first: ["row"] }} onChange={() => {}}>
          <GridList name="first" aria-label="First">
            <GridListItem value="row">
              Row
              <GridListMoveButton to="missing" />
            </GridListItem>
          </GridList>
        </GridListReorderGroup>,
      ),
    ).toThrow(
      'GridListMoveButton destination "missing" is missing from GridListReorderGroup.value.',
    );
  });
});
