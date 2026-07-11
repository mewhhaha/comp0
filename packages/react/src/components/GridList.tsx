import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import { findTypeaheadMatch, getRovingFocusTarget, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import {
  sortItems,
  type CollectionItemRecord,
  type SelectableCollectionContextValue,
} from "./collection-shared.js";
import { GridListContext, rowFocusables } from "./grid-list-shared.js";

export type GridListProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
};

export function GridList({
  value,
  defaultValue,
  onChange,
  onKeyDown,
  children,
  ref,
  ...props
}: GridListProps & RefProp<HTMLDivElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());

  useEffect(() => {
    selectedRef.current = selected;
    if (selected) {
      activeKeyRef.current = selected;
      setActiveKey(selected);
    }
  }, [selected]);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const register = useCallback(
    (key: string, textValue: string, element: HTMLElement | null, disabled?: boolean) => {
      if (!element) {
        itemMap.current.delete(key);
        return;
      }
      itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
      if (!selectedRef.current && !activeKeyRef.current && !disabled) {
        activeKeyRef.current = key;
        setActiveKey(key);
      }
    },
    [],
  );

  const items = useCallback(() => sortItems([...itemMap.current.values()]), []);

  const context: SelectableCollectionContextValue = useMemo(
    () => ({
      activeKey,
      selectedKey: selected,
      setActiveKey,
      setSelectedKey: setSelected,
      register,
      items,
    }),
    [activeKey, items, register, selected, setSelected],
  );

  const focusRow = (key: string | undefined) => {
    if (!key) return false;
    const row = itemMap.current.get(key)?.element;
    if (!row) return false;
    setActiveKey(key);
    row.focus();
    return true;
  };

  return (
    <GridListContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        role="grid"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          const rows = items();
          const rowRecord = rows.find((item) => item.element?.contains(target));
          if (!rowRecord?.element) return;
          const row = rowRecord.element;
          const insideRow = target !== row;
          const focusables = rowFocusables(row);

          if (event.key === "ArrowRight") {
            // Right steps into and through the row's interactive children.
            const index = insideRow ? focusables.indexOf(target) : -1;
            const next = focusables[index + 1];
            if (next) {
              event.preventDefault();
              next.focus();
            }
            return;
          }
          if (event.key === "ArrowLeft") {
            if (!insideRow) return;
            event.preventDefault();
            const index = focusables.indexOf(target);
            const previous = focusables[index - 1];
            if (previous) previous.focus();
            else row.focus();
            return;
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            const key = getRovingFocusTarget(rows, rowRecord.key, event.key, {
              orientation: "vertical",
            });
            if (key) {
              event.preventDefault();
              focusRow(key);
            }
            return;
          }
          if (!insideRow && (event.key === "Enter" || event.key === " ")) {
            if (rowRecord.disabled) return;
            event.preventDefault();
            setActiveKey(rowRecord.key);
            setSelected(rowRecord.key);
            return;
          }
          if (!insideRow && event.key.length === 1) {
            const key = findTypeaheadMatch(rows, event.key, rowRecord.key);
            if (key) {
              event.preventDefault();
              focusRow(key);
            }
          }
        }}
      >
        {children}
      </div>
    </GridListContext.Provider>
  );
}
