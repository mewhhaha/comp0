import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { GridList } from "./components/GridList.js";
import { GridListDragHandle } from "./components/GridListDragHandle.js";
import { GridListItem } from "./components/GridListItem.js";

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
            {name}
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

  it("moves drag initiation from the row to a mounted drag handle", () => {
    const spy = vi.fn();
    const { container } = render(<ReorderableList spy={spy} withHandle />);
    const row = container.querySelector<HTMLElement>("[role='row']")!;
    const handle = row.querySelector<HTMLButtonElement>("[data-slot='grid-list-drag-handle']")!;

    expect(row.draggable).toBe(false);
    expect(handle.draggable).toBe(true);
    expect(handle.getAttribute("aria-label")).toBe("Reorder report.pdf");

    fireDrag(handle, "dragstart");
    expect(row.hasAttribute("data-dragging")).toBe(true);
    fireDrag(row, "dragend");

    handle.focus();
    fireKeyDown(handle, "ArrowDown", { altKey: true });
    expect(spy).toHaveBeenLastCalledWith(["photos.zip", "report.pdf", "notes.txt"]);
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
});
