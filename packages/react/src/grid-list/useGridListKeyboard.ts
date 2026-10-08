import { type KeyboardEvent } from "react";
import { useCollectionNavigation, type Collection } from "@comp0/core";
import { writingDirection } from "../internal/writing-direction.js";
import { resolveRowControlMove } from "./grid-list-row-keyboard.js";
import { rowFocusables, type GridListDndContextValue } from "./grid-list-shared.js";

/**
 * The GridList keydown handler: Alt+Arrow reordering, inline arrows into and
 * out of a row's controls, vertical/Home/End/typeahead row navigation, and
 * Enter or Space selection.
 */
export function useGridListKeyboard(options: {
  collection: Collection;
  dnd: GridListDndContextValue | null;
  focusRow: (key: string | undefined) => boolean;
  activateRow: (key: string) => void;
  select: (key: string) => void;
}) {
  const { collection, dnd, focusRow, activateRow, select } = options;
  const navigate = useCollectionNavigation();

  return (event: KeyboardEvent<HTMLElement>) => {
    const ownerWindow = event.currentTarget.ownerDocument.defaultView;
    const target =
      ownerWindow && event.target instanceof ownerWindow.HTMLElement ? event.target : null;
    if (!target) return;
    const rows = collection.items();
    const rowRecord = rows.find((item) => item.element?.contains(target));
    if (!rowRecord?.element) return;
    const row = rowRecord.element;
    const insideRow = target !== row;

    // Alt+Arrow also works from controls inside the row, such as a drag handle.
    if (
      dnd &&
      !rowRecord.disabled &&
      row.draggable &&
      event.altKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      dnd.moveItem(rowRecord.key, event.key === "ArrowUp" ? -1 : 1);
      return;
    }

    const controlMove = resolveRowControlMove({
      key: event.key,
      dir: writingDirection(event.currentTarget),
      row,
      target,
      focusables: rowFocusables(row),
    });
    if (controlMove) {
      if (controlMove.handled) event.preventDefault();
      controlMove.focus?.focus();
      return;
    }

    if (!insideRow && (event.key === "Enter" || event.key === " ")) {
      if (rowRecord.disabled) return;
      event.preventDefault();
      activateRow(rowRecord.key);
      select(rowRecord.key);
      return;
    }

    const key = navigate(event.key, rows, rowRecord.key, {
      orientation: "vertical",
      typeahead: !insideRow,
    });
    if (!key) return;
    event.preventDefault();
    focusRow(key);
  };
}
