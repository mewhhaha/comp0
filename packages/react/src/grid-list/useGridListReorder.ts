import { useState } from "react";
import { type Collection } from "@comp0/core";
import { gridListMessages } from "./grid-list-announcements.js";
import { orderAfterDrop, orderAfterStep, retargetKeyboardMove } from "./grid-list-order.js";
import { type GridListDndContextValue, type GridListDropTarget } from "./grid-list-shared.js";

/**
 * Drag, drop, and keyboard reordering for one standalone GridList: the pending
 * drag, its drop target, the live-region announcement, and the context the
 * rows and drag handles read. Without `onReorder` nothing is reorderable.
 */
export function useGridListReorder(options: {
  collection: Collection;
  onReorder: ((values: string[]) => void) | undefined;
  canReorder: ((values: string[], moved: string) => boolean) | undefined;
  refocusAfterReorder: (movedValue: string) => void;
}) {
  const { collection, onReorder, canReorder, refocusAfterReorder } = options;
  const [dragValue, setDragValue] = useState("");
  const [dragLabel, setDragLabel] = useState("");
  const [dropTarget, setDropTargetState] = useState<GridListDropTarget | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const order = () => collection.items().map((item) => item.key);
  const labelOf = (value: string) => collection.get(value)?.textValue ?? value;
  const allows = (proposed: string[], moved: string) => !canReorder || canReorder(proposed, moved);

  const resetDrag = () => {
    setDragValue("");
    setDragLabel("");
    setDropTargetState(null);
  };

  const announceMove = (moved: string, next: string[]) => {
    setAnnouncement(gridListMessages.moved(labelOf(moved), next.indexOf(moved) + 1, next.length));
  };

  /** The order a drop on `target` would produce, or null when it changes nothing or canReorder vetoes it. */
  const orderForDrop = (moved: string, target: GridListDropTarget) => {
    const next = orderAfterDrop(order(), moved, target);
    if (!next || !allows(next, moved)) return null;
    return next;
  };

  const setDropTarget = (target: GridListDropTarget | null) => {
    if (!target || !dragValue) {
      setDropTargetState(null);
      return;
    }
    setDropTargetState(orderForDrop(dragValue, target) ? target : null);
  };

  const cancelWithAnnouncement = () => {
    if (dragValue) setAnnouncement(gridListMessages.cancelled(dragLabel || dragValue));
    resetDrag();
  };

  let dnd: GridListDndContextValue | null = null;
  if (onReorder) {
    dnd = {
      dragValue,
      dragLabel,
      hasDropTarget: Boolean(dropTarget),
      dropTarget,
      listDropTarget: Boolean(dropTarget),
      startDrag: (moved, label) => {
        setDragValue(moved);
        setDragLabel(label);
      },
      setDropTarget,
      setDropAtEnd: () => {
        const last = collection.items().at(-1);
        setDropTarget(last ? { value: last.key, edge: "after" } : null);
      },
      commitDrop: () => {
        if (dragValue && dropTarget) {
          const next = orderForDrop(dragValue, dropTarget);
          if (next) {
            onReorder(next);
            announceMove(dragValue, next);
          }
        }
        resetDrag();
      },
      endDrag: resetDrag,
      moveItem: (moved, delta) => {
        const next = orderAfterStep(order(), moved, delta);
        if (!next) return;
        if (!allows(next, moved)) {
          setAnnouncement(gridListMessages.blocked(labelOf(moved)));
          return;
        }
        onReorder(next);
        announceMove(moved, next);
        refocusAfterReorder(moved);
      },
      beginKeyboardMove: (moved) => {
        const label = labelOf(moved);
        setDragValue(moved);
        setDragLabel(label);
        setDropTargetState(null);
        setAnnouncement(gridListMessages.started(label));
      },
      retargetKeyboardMove: (direction) => {
        if (!dragValue) return;
        const label = dragLabel || dragValue;
        if (direction === "left" || direction === "right") {
          setAnnouncement(gridListMessages.blocked(label));
          return;
        }
        const result = retargetKeyboardMove({
          order: order(),
          moved: dragValue,
          target: dropTarget,
          direction,
          allows: (proposed) => allows(proposed, dragValue),
        });
        if (result.kind === "blocked") {
          setAnnouncement(gridListMessages.blocked(label));
          return;
        }
        setDropTargetState(result.kind === "target" ? result.target : null);
        setAnnouncement(gridListMessages.moving(label, result.position, result.total));
      },
      commitKeyboardMove: () => {
        if (dragValue && dropTarget) {
          const next = orderForDrop(dragValue, dropTarget);
          if (next) {
            onReorder(next);
            announceMove(dragValue, next);
            refocusAfterReorder(dragValue);
            resetDrag();
            return;
          }
        }
        cancelWithAnnouncement();
      },
      cancelKeyboardMove: cancelWithAnnouncement,
    };
  }

  const dropPreviewLabel = dropTarget ? dragLabel : "";
  return { dnd, announcement, dropPreviewLabel };
}
