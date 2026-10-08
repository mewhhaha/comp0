import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import {
  ReorderableList,
  fireDrag,
  flushTimers,
  press,
  renderGridList,
} from "../../test/grid-list-fixtures.js";
import { GridList } from "./GridList.js";
import { GridListDragHandle } from "./GridListDragHandle.js";
import { GridListItem } from "./GridListItem.js";
import {} from "./GridListReorderGroup.js";

describe("grid list reordering", () => {
  it("moves a row with Alt+Arrow, keeps focus on it, and announces the position", async () => {
    const spy = vi.fn();
    const { container, user } = setup(<ReorderableList spy={spy} />);
    const rowValues = () =>
      [...container.querySelectorAll<HTMLElement>("[role='row']")].map(
        (row) => row.dataset["value"],
      );
    const first = container.querySelector<HTMLElement>("[role='row']")!;
    expect(first.getAttribute("aria-keyshortcuts")).toBe("Alt+ArrowUp Alt+ArrowDown");

    first.focus();
    await press(user, first, "{Alt>}{ArrowDown}{/Alt}");
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
    expect(rowValues()).toEqual(["photos.zip", "report.pdf", "notes.txt"]);

    await flushTimers();
    expect(document.activeElement).toBe(container.querySelectorAll("[role='row']")[1]);
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Moved report.pdf to position 2 of 3.",
    );

    await press(user, document.activeElement!, "{Alt>}{ArrowUp}{/Alt}");
    expect(spy).toHaveBeenLastCalledWith(["report.pdf", "photos.zip", "notes.txt"]);
    await flushTimers();

    spy.mockClear();
    await press(user, document.activeElement!, "{Alt>}{ArrowUp}{/Alt}");
    expect(spy).not.toHaveBeenCalled();
  });

  it("moves a row from the drag handle keyboard session with a live preview", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <ReorderableList spy={spy} withHandle canReorder={(next) => next.at(-1) === "notes.txt"} />,
    );
    const handle = container.querySelector<HTMLElement>(
      "[data-value='report.pdf'] [data-slot='grid-list-drag-handle']",
    )!;
    const reportRow = () => container.querySelector<HTMLElement>("[data-value='report.pdf']")!;
    const announcement = () => container.querySelector("[aria-live]")?.textContent;

    await press(user, handle, "{Enter}");
    expect(reportRow().hasAttribute("data-dragging")).toBe(true);
    expect(announcement()).toBe(
      "Moving report.pdf. Use the arrow keys to choose a position, Enter to drop, Escape to cancel.",
    );

    await press(user, handle, "{ArrowDown}");
    expect(reportRow().hasAttribute("data-drag-previewing")).toBe(true);
    expect(
      container.querySelector("[data-value='notes.txt']")!.hasAttribute("data-drop-before"),
    ).toBe(true);
    expect(announcement()).toBe("Moving report.pdf to position 2 of 3.");

    // The pinned last row vetoes position 3, so ArrowDown has nowhere to go.
    await press(user, handle, "{ArrowDown}");
    expect(announcement()).toBe("Cannot move report.pdf there.");

    // Arrowing back to the row's own slot withdraws the pending move.
    await press(user, handle, "{ArrowUp}");
    expect(reportRow().hasAttribute("data-drag-previewing")).toBe(false);
    expect(announcement()).toBe("Moving report.pdf to position 1 of 3.");

    await press(user, handle, "{ArrowDown}");
    await press(user, handle, "{Enter}");
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
    expect(announcement()).toBe("Moved report.pdf to position 2 of 3.");
    await flushTimers();
    expect(document.activeElement).toBe(reportRow());
  });

  it("cancels a plain-list keyboard move with Escape", async () => {
    const spy = vi.fn();
    const { container, user } = setup(<ReorderableList spy={spy} withHandle />);
    const handle = container.querySelector<HTMLElement>(
      "[data-value='report.pdf'] [data-slot='grid-list-drag-handle']",
    )!;
    const reportRow = container.querySelector<HTMLElement>("[data-value='report.pdf']")!;

    await press(user, handle, "{Enter}");
    await press(user, handle, "{ArrowDown}");
    await press(user, handle, "{Escape}");
    expect(spy).not.toHaveBeenCalled();
    expect(reportRow.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Cancelled moving report.pdf.",
    );
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
    expect(first!.hasAttribute("data-drag-previewing")).toBe(false);

    fireDrag(last!, "dragover", 85);
    expect(first!.hasAttribute("data-drag-previewing")).toBe(true);
    expect(last!.hasAttribute("data-drop-before")).toBe(true);
    expect(last!.hasAttribute("data-drop-after")).toBe(false);
    expect(last!.dataset["dropPreview"]).toBe("report.pdf");

    // Dragging over the relocated source row keeps the pending target instead
    // of flickering the preview away.
    fireDrag(first!, "dragover", 85);
    expect(first!.hasAttribute("data-drag-previewing")).toBe(true);
    expect(last!.hasAttribute("data-drop-before")).toBe(true);

    fireDrag(last!, "dragover", 115);
    expect(last!.hasAttribute("data-drop-after")).toBe(true);
    expect(last!.hasAttribute("data-drop-before")).toBe(false);

    fireDrag(last!, "drop", 115);
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "notes.txt", "report.pdf"]);

    fireDrag(first!, "dragend");
    for (const row of container.querySelectorAll("[role='row']")) {
      expect(row.hasAttribute("data-dragging")).toBe(false);
      expect(row.hasAttribute("data-drag-previewing")).toBe(false);
      expect(row.hasAttribute("data-drop-before")).toBe(false);
      expect(row.hasAttribute("data-drop-after")).toBe(false);
      expect(row.hasAttribute("data-drop-preview")).toBe(false);
    }
  });

  it("keeps rows undraggable without onReorder", () => {
    const { rows } = renderGridList();
    expect(rows[0]!.draggable).toBe(false);
    expect(rows[0]!.hasAttribute("aria-keyshortcuts")).toBe(false);
  });

  it("keeps a row selectable when draggable is false", async () => {
    const onChange = vi.fn();
    const onReorder = vi.fn();
    const { container, user } = setup(
      <GridList aria-label="Files" onChange={onChange} onReorder={onReorder}>
        <GridListItem value="report">report.pdf</GridListItem>
        <GridListItem value="notes" draggable={false}>
          <GridListDragHandle>Move</GridListDragHandle>
          notes.txt
        </GridListItem>
      </GridList>,
    );
    const notes = container.querySelector<HTMLElement>("[data-value='notes']")!;

    expect(notes.draggable).toBe(false);
    expect(notes.hasAttribute("aria-keyshortcuts")).toBe(false);
    expect(notes.querySelector("[data-slot='grid-list-drag-handle']")).toBeNull();

    await user.click(notes);
    expect(onChange).toHaveBeenLastCalledWith("notes");

    notes.focus();
    await press(user, notes, "{Alt>}{ArrowUp}{/Alt}");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("keeps the whole row draggable when it has a drag handle", async () => {
    const spy = vi.fn();
    const { container, user } = setup(<ReorderableList spy={spy} withHandle />);
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
    await press(user, handle, "{Alt>}{ArrowDown}{/Alt}");
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

  it("blocks vetoed orders: no drop preview, no move, and a spoken explanation", async () => {
    const spy = vi.fn();
    const keepNotesLast = (values: string[]) => values.at(-1) === "notes.txt";
    const { container, user } = setup(<ReorderableList spy={spy} canReorder={keepNotesLast} />);
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
    await press(user, second!, "{Alt>}{ArrowDown}{/Alt}");
    expect(spy).not.toHaveBeenCalled();
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Cannot move photos.zip there.",
    );

    await press(user, second!, "{Alt>}{ArrowUp}{/Alt}");
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
  });
});
