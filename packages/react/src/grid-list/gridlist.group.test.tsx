import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { GroupedLists, fireDrag, flushTimers, press } from "../../test/grid-list-fixtures.js";
import {} from "./GridListReorderGroup.js";

describe("grid list reorder group transfers", () => {
  it("moves a row between named lists with one atomic pointer transaction", async () => {
    const spy = vi.fn();
    const { container } = setup(
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

  it("repairs each list's tab stop after repeated cross-list moves", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists initial={{ todo: ["design", "build"], done: ["ship"] }} spy={spy} />,
    );
    const tabStopValues = (name: string) =>
      [...container.querySelectorAll<HTMLElement>(`[aria-label='${name}'] [role='row']`)]
        .filter((row) => row.tabIndex === 0)
        .map((row) => row.dataset["value"]);

    expect(tabStopValues("todo"), "initial todo tab stop").toEqual(["design"]);
    expect(tabStopValues("done"), "initial done tab stop").toEqual(["ship"]);

    await user.click(
      container.querySelector("[data-value='design'] [data-slot='grid-list-move-button']")!,
    );
    expect(document.activeElement?.getAttribute("data-value"), "focused row after first move").toBe(
      "design",
    );
    expect(
      container.querySelector("[aria-label='done']")?.contains(document.activeElement),
      "focused row belongs to destination after first move",
    ).toBe(true);
    expect(tabStopValues("todo"), "todo tab stop after first move").toEqual(["build"]);
    expect(tabStopValues("done"), "done tab stop after first move").toEqual(["design"]);

    await user.click(
      container.querySelector("[data-value='design'] [data-slot='grid-list-move-button']")!,
    );
    expect(tabStopValues("todo"), "todo tab stop after return move").toEqual(["design"]);
    expect(tabStopValues("done"), "done tab stop after return move").toEqual(["ship"]);

    await user.click(
      container.querySelector("[data-value='design'] [data-slot='grid-list-move-button']")!,
    );
    expect(tabStopValues("todo"), "todo tab stop after repeated move").toEqual(["build"]);
    expect(tabStopValues("done"), "done tab stop after repeated move").toEqual(["design"]);
    expect(document.activeElement?.getAttribute("data-value")).toBe("design");
  });

  it("moves a row across lists from the keyboard with a live drop preview", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists initial={{ todo: ["design", "build"], done: ["ship"] }} spy={spy} />,
    );
    const handle = container.querySelector<HTMLElement>(
      "[data-value='design'] [data-slot='grid-list-drag-handle']",
    )!;
    const designRow = () => container.querySelector<HTMLElement>("[data-value='design']")!;
    const todoList = container.querySelector<HTMLElement>("[aria-label='todo']")!;
    const doneList = container.querySelector<HTMLElement>("[aria-label='done']")!;
    const announcement = () => container.querySelector("[aria-live]")?.textContent;

    await press(user, handle, "{Enter}");
    expect(designRow().hasAttribute("data-dragging")).toBe(true);
    expect(announcement()).toBe(
      "Moving design. Use the arrow keys to choose a position, Enter to drop, Escape to cancel.",
    );

    await press(user, handle, "{ArrowDown}");
    expect(todoList.hasAttribute("data-drop-target")).toBe(true);
    expect(announcement()).toBe("Moving design to todo, position 2 of 2.");

    // Arrowing back to the row's own slot withdraws the pending move.
    await press(user, handle, "{ArrowUp}");
    expect(todoList.hasAttribute("data-drop-target")).toBe(false);
    expect(announcement()).toBe("Moving design to todo, position 1 of 2.");

    await press(user, handle, "{ArrowRight}");
    expect(doneList.hasAttribute("data-drop-target")).toBe(true);
    expect(doneList.getAttribute("data-drop-preview")).toBe("design");
    expect(container.querySelector("[data-value='ship']")!.hasAttribute("data-drop-before")).toBe(
      true,
    );
    expect(announcement()).toBe("Moving design to done, position 1 of 2.");

    await press(user, handle, "{Enter}");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(
      { todo: ["build"], done: ["design", "ship"] },
      {
        value: "design",
        from: { list: "todo", index: 0 },
        to: { list: "done", index: 0 },
        before: "ship",
      },
    );
    expect(announcement()).toBe("Moved design to done, position 1 of 2.");
    expect(designRow().hasAttribute("data-dragging")).toBe(false);
  });

  it("cancels a keyboard move with Escape and leaves the order untouched", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists initial={{ todo: ["design", "build"], done: ["ship"] }} spy={spy} />,
    );
    const handle = container.querySelector<HTMLElement>(
      "[data-value='design'] [data-slot='grid-list-drag-handle']",
    )!;
    const designRow = container.querySelector<HTMLElement>("[data-value='design']")!;

    await press(user, handle, "{Enter}");
    await press(user, handle, "{ArrowDown}");
    expect(designRow.hasAttribute("data-drag-previewing")).toBe(true);
    await press(user, handle, "{Escape}");
    expect(spy).not.toHaveBeenCalled();
    expect(designRow.hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("Cancelled moving design.");
  });
});
