import { useLayoutEffect, useRef } from "react";
import { useCollection, type CollectionItem } from "@comp0/core";
import { useTabStopSelection, useTabStopStore } from "../internal/tab-stop.js";
import {
  type GridListContextValue,
  type GridListFocusRequest,
  type GridListReorderGroupContextValue,
} from "./grid-list-shared.js";

/**
 * Owns a GridList's row registry and roving tab stop: which row last held focus or was
 * activated, which row holds tabindex 0, and the focus restoration that follows a move
 * (a cross-list focus request, or a reorder that made the browser drop focus).
 */
export function useGridListRows(options: {
  selected: string;
  select: (key: string) => void;
  name: string | undefined;
  group: GridListReorderGroupContextValue | null;
}) {
  const { selected, select, name, group } = options;
  const collection = useCollection();
  // The row that last held focus or was activated, recorded under the selection current at the
  // time: any change of selection drops it (clearing to "" keeps it), so a value that returns
  // later cannot revive a stale record. The stop lives outside React state, so a focus move
  // re-renders only the two rows whose tabIndex changes, not every row reading this context
  // (bench: collection-tab-stop.bench.tsx, PERFORMANCE.md).
  const selection = useTabStopSelection(selected);
  const tabStops = useTabStopStore(collection);
  const handledFocusRequest = useRef<GridListFocusRequest | null>(null);

  const activateRow = (key: string) => {
    tabStops.focus(key, selection);
  };

  const register = (item: CollectionItem) => {
    const registered = collection.get(item.key);
    if (registered?.element && registered.element !== item.element) {
      throw new Error(
        `GridListItem value "${item.key}" is rendered more than once inside GridList.`,
      );
    }
    collection.register(item);
    if (group && name && item.element) {
      group.registerRow(name, item.key, item.textValue, item.element, Boolean(item.disabled));
    }
  };

  const unregister = (key: string, element: HTMLElement) => {
    if (collection.unregister(key, element) && group && name) {
      group.unregisterRow(name, key, element);
    }
  };

  // Focus is imperative: a cross-list move asks this list to focus the moved row once it
  // has rendered, then acknowledges the request.
  useLayoutEffect(() => {
    const focusRequest = group?.focusRequest;
    if (
      focusRequest &&
      focusRequest !== handledFocusRequest.current &&
      focusRequest.list === name
    ) {
      const movedItem = collection.get(focusRequest.value);
      if (movedItem?.element && !movedItem.disabled) {
        handledFocusRequest.current = focusRequest;
        activateRow(movedItem.key);
        movedItem.element.focus();
        group.acknowledgeFocusRequest(focusRequest);
      }
    }
  });

  const focusRow = (key: string | undefined) => {
    if (!key) return false;
    const row = collection.get(key)?.element;
    if (!row) return false;
    activateRow(key);
    row.focus();
    return true;
  };

  // Reordered rows keep their element, but browsers can drop focus when a
  // focused node moves in the DOM; put it back after React commits.
  const refocusAfterReorder = (movedValue: string) => {
    setTimeout(() => {
      const row = collection.get(movedValue)?.element;
      if (row?.isConnected) {
        activateRow(movedValue);
        row.focus();
      }
    });
  };

  const context: GridListContextValue = {
    tabStops,
    selection,
    selectedKey: selected,
    setFocusedKey: activateRow,
    setSelectedKey: select,
    register,
    unregister,
  };

  return { collection, context, activateRow, focusRow, refocusAfterReorder };
}
