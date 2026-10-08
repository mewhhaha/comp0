import { describe, expect, it, vi } from "vitest";
import { groupDndContext, groupDropPreviewLabel } from "./grid-list-group-dnd.js";
import { type GridListReorderGroupContextValue } from "./grid-list-shared.js";

function groupWith(overrides: Partial<GridListReorderGroupContextValue> = {}) {
  const group = {
    source: null,
    target: null,
    startDrag: vi.fn(),
    setDropTarget: vi.fn(),
    commitDrop: vi.fn(),
    endDrag: vi.fn(),
    moveWithin: vi.fn(),
    beginKeyboardMove: vi.fn(),
    retargetKeyboardMove: vi.fn(),
    commitKeyboardMove: vi.fn(),
    cancelKeyboardMove: vi.fn(),
    ...overrides,
  };
  return group as unknown as GridListReorderGroupContextValue & typeof group;
}

describe("groupDndContext", () => {
  it("reports an idle list when nothing is dragged", () => {
    const context = groupDndContext(groupWith(), "todo");
    expect(context).toMatchObject({
      listName: "todo",
      dragValue: "",
      dragLabel: "",
      hasDropTarget: false,
      dropTarget: null,
      listDropTarget: false,
    });
  });

  it("exposes the row target only for the list that owns it", () => {
    const group = groupWith({
      source: { list: "todo", value: "design", label: "Design" },
      target: { list: "done", value: "ship", edge: "before" },
    });
    const todo = groupDndContext(group, "todo");
    const done = groupDndContext(group, "done");

    expect(todo).toMatchObject({ dragValue: "design", dragLabel: "Design", hasDropTarget: true });
    expect(todo.dropTarget).toBeNull();
    expect(todo.listDropTarget).toBe(false);
    expect(done.dropTarget).toEqual({ value: "ship", edge: "before" });
    expect(done.listDropTarget).toBe(true);
  });

  it("has no row target when the list itself is the target", () => {
    const group = groupWith({ target: { list: "done", value: null, edge: "after" } });
    const done = groupDndContext(group, "done");
    expect(done.dropTarget).toBeNull();
    expect(done.listDropTarget).toBe(true);
  });

  it("tags every action with the list name", () => {
    const group = groupWith();
    const context = groupDndContext(group, "todo");

    context.startDrag("design", "Design");
    context.setDropTarget({ value: "ship", edge: "after" });
    context.setDropTarget(null);
    context.setDropAtEnd();
    context.moveItem("design", 1);
    context.beginKeyboardMove("design");

    expect(group.startDrag).toHaveBeenCalledWith("todo", "design", "Design");
    expect(group.setDropTarget).toHaveBeenNthCalledWith(1, {
      list: "todo",
      value: "ship",
      edge: "after",
    });
    expect(group.setDropTarget).toHaveBeenNthCalledWith(2, null);
    expect(group.setDropTarget).toHaveBeenNthCalledWith(3, {
      list: "todo",
      value: null,
      edge: "after",
    });
    expect(group.moveWithin).toHaveBeenCalledWith("todo", "design", 1);
    expect(group.beginKeyboardMove).toHaveBeenCalledWith("todo", "design");
  });

  it("forwards list-independent actions untouched", () => {
    const group = groupWith();
    const context = groupDndContext(group, "todo");
    expect(context.commitDrop).toBe(group.commitDrop);
    expect(context.endDrag).toBe(group.endDrag);
    expect(context.retargetKeyboardMove).toBe(group.retargetKeyboardMove);
    expect(context.commitKeyboardMove).toBe(group.commitKeyboardMove);
    expect(context.cancelKeyboardMove).toBe(group.cancelKeyboardMove);
  });
});

describe("groupDropPreviewLabel", () => {
  it("is the dragged row label for the targeted list only", () => {
    const group = groupWith({
      source: { list: "todo", value: "design", label: "Design" },
      target: { list: "done", value: null, edge: "after" },
    });
    expect(groupDropPreviewLabel(group, "done")).toBe("Design");
    expect(groupDropPreviewLabel(group, "todo")).toBe("");
    expect(groupDropPreviewLabel(groupWith(), "done")).toBe("");
  });
});
