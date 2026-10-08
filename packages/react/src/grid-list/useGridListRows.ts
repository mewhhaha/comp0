import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCollection, type CollectionItem } from "@comp0/core";
import {
  type GridListContextValue,
  type GridListFocusRequest,
  type GridListReorderGroupContextValue,
} from "./grid-list-shared.js";

/**
 * Owns a GridList's row registry and roving tab stop: which row is active,
 * which row holds tabindex 0, and the focus restoration that follows a move
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
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const handledFocusRequest = useRef<GridListFocusRequest | null>(null);

  useEffect(() => {
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const syncTabStops = (key: string) => {
    for (const item of collection.items()) {
      if (!item.element) continue;
      if (item.disabled) {
        item.element.removeAttribute("tabindex");
        continue;
      }
      item.element.tabIndex = item.key === key ? 0 : -1;
    }
  };

  const activateRow = (key: string) => {
    activeKeyRef.current = key;
    syncTabStops(key);
    setActiveKey(key);
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
        return;
      }
    }
    const current = collection.get(activeKeyRef.current);
    if (current && !current.disabled) {
      syncTabStops(current.key);
      return;
    }
    const nextActiveKey = collection.enabledItems()[0]?.key ?? "";
    if (nextActiveKey !== activeKeyRef.current) activateRow(nextActiveKey);
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
    activeKey,
    selectedKey: selected,
    setActiveKey: activateRow,
    setSelectedKey: select,
    register,
    unregister,
  };

  return { collection, context, activateRow, focusRow, refocusAfterReorder };
}
