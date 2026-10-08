import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { GroupedLists, fireDrag, press } from "../../test/grid-list-fixtures.js";
import { GridList } from "./GridList.js";
import { GridListItem } from "./GridListItem.js";
import { GridListMoveButton } from "./GridListMoveButton.js";
import {
  GridListReorderGroup,
  type GridListMove,
  type GridListOrder,
} from "./GridListReorderGroup.js";

describe("grid list reorder group move controls", () => {
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

  it("provides a click and keyboard reachable move button instead of requiring a drag", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists initial={{ todo: ["design"], done: [] }} spy={spy} />,
    );
    const button = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;

    expect(button.getAttribute("aria-label")).toBe("Move design to done");
    expect(button.disabled).toBe(false);
    await user.click(button);
    expect(spy).toHaveBeenLastCalledWith(
      { todo: [], done: ["design"] },
      expect.objectContaining({ value: "design", to: { list: "done", index: 0 } }),
    );
  });

  it("keeps a disabled row stationary through its move button", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists
        initial={{ todo: ["design"], done: [] }}
        spy={spy}
        disabledValues={["design"]}
      />,
    );
    const source = container.querySelector<HTMLElement>("[data-value='design']")!;
    const button = source.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;

    expect(button.disabled).toBe(true);
    await user.click(button);
    await press(user, button, "{Enter}");
    await press(user, button, " ");

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

    expect(
      container.querySelector("[data-slot='grid-list-move-button']")?.getAttribute("aria-label"),
    ).toBe("Move Design task to Completed work");
  });

  it("updates destination labels when their accessible names change in the DOM", async () => {
    const order = { todo: ["design"], done: [] as string[] };
    const { container } = setup(
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
    const moveButton = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
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

  it("keeps Alt+Arrow reordering inside a grouped list", async () => {
    const spy = vi.fn();
    const { container, user } = setup(
      <GroupedLists initial={{ todo: ["one", "two"], done: [] }} spy={spy} />,
    );
    const first = container.querySelector<HTMLElement>("[data-value='one']")!;

    first.focus();
    await press(user, first, "{Alt>}{ArrowDown}{/Alt}");
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
    const button = source.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;

    expect(button.disabled).toBe(true);
    fireDrag(source.querySelector("[data-slot='grid-list-drag-handle']")!, "dragstart");
    fireDrag(destination, "dragover");
    expect(destination.hasAttribute("data-drop-target")).toBe(false);
    fireDrag(destination, "drop");
    expect(spy).not.toHaveBeenCalled();
  });
});
