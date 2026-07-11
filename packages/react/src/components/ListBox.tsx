import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findTypeaheadMatch, getRovingFocusTarget, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { ListBoxContext, sortItems } from "./collection-shared.js";
import {
  type SelectableCollectionContextValue,
  type CollectionItemRecord,
  type ListBoxProps,
} from "./collection-shared.js";
export type { ListBoxProps } from "./collection-shared.js";
export function ListBox({
  value,
  defaultValue,
  onChange,
  orientation = "vertical",
  onKeyDown,
  children,
  ref,
  ...props
}: ListBoxProps & RefProp<HTMLDivElement>) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue: defaultValue ?? "",
    onChange,
  });
  const [activeKey, setActiveKey] = useState(selected);
  const activeKeyRef = useRef(activeKey);
  const selectedRef = useRef(selected);
  const itemMap = useRef(new Map<string, CollectionItemRecord>());
  const itemVersion = useRef(0);
  const sortedItemCache = useRef<{
    version: number;
    items: CollectionItemRecord[];
  }>({ version: -1, items: [] });

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
        if (itemMap.current.delete(key)) itemVersion.current += 1;
        return;
      }

      const current = itemMap.current.get(key);
      if (
        current?.id !== element.id ||
        current?.textValue !== textValue ||
        current.element !== element ||
        current.disabled !== disabled
      ) {
        itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
        itemVersion.current += 1;
      }

      if (!selectedRef.current && !activeKeyRef.current && !disabled) {
        activeKeyRef.current = key;
        setActiveKey(key);
      }
    },
    [],
  );

  const items = useCallback(() => {
    if (sortedItemCache.current.version !== itemVersion.current) {
      sortedItemCache.current = {
        version: itemVersion.current,
        items: sortItems([...itemMap.current.values()]),
      };
    }
    return sortedItemCache.current.items;
  }, []);

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

  return (
    <ListBoxContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        id={props.id}
        role="listbox"
        aria-labelledby={props["aria-labelledby"]}
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const items = context.items();
          const key =
            getRovingFocusTarget(items, selected, event.key, { orientation, loop: true }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, selected) : undefined);
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          setSelected(key);
          items.find((item) => item.key === key)?.element?.focus();
        }}
      >
        {children}
      </div>
    </ListBoxContext.Provider>
  );
}
