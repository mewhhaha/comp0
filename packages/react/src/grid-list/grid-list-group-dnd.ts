import {
  type GridListDndContextValue,
  type GridListDropTarget,
  type GridListReorderGroupContextValue,
} from "./grid-list-shared.js";

/** The drag-and-drop context for the list `name`, backed by its reorder group's shared session. */
export function groupDndContext(
  group: GridListReorderGroupContextValue,
  name: string,
): GridListDndContextValue {
  let dropTarget: GridListDropTarget | null = null;
  if (group.target?.list === name && group.target.value !== null) {
    dropTarget = { value: group.target.value, edge: group.target.edge };
  }
  return {
    listName: name,
    dragValue: group.source?.value ?? "",
    dragLabel: group.source?.label ?? "",
    hasDropTarget: Boolean(group.target),
    dropTarget,
    listDropTarget: group.target?.list === name,
    startDrag: (moved, label) => group.startDrag(name, moved, label),
    setDropTarget: (target) => {
      if (!target) {
        group.setDropTarget(null);
        return;
      }
      group.setDropTarget({ list: name, ...target });
    },
    setDropAtEnd: () => group.setDropTarget({ list: name, value: null, edge: "after" }),
    commitDrop: group.commitDrop,
    endDrag: group.endDrag,
    moveItem: (moved, delta) => group.moveWithin(name, moved, delta),
    beginKeyboardMove: (moved) => group.beginKeyboardMove(name, moved),
    retargetKeyboardMove: group.retargetKeyboardMove,
    commitKeyboardMove: group.commitKeyboardMove,
    cancelKeyboardMove: group.cancelKeyboardMove,
  };
}

/** The label of the row dragged over the list `name`, for a styleable insertion preview. */
export function groupDropPreviewLabel(group: GridListReorderGroupContextValue, name: string) {
  if (group.target?.list === name) return group.source?.label ?? "";
  return "";
}
