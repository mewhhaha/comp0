import { useEffect, useRef, useState } from "react";
import { findTypeaheadMatch, getRovingFocusTarget, useControllableState } from "@comp0/core";
import { useComboBoxRootContext, useSelectRootContext, type RefProp } from "../shared.js";
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
  ref,
  ...props
}: ListBoxProps & RefProp<HTMLDivElement>) {
  const select = useSelectRootContext();
  const comboBox = useComboBoxRootContext();
  const picker = select ?? comboBox;
  const [selected, setSelected] = useControllableState({
    value: picker?.selectedKey ?? value,
    defaultValue: picker?.selectedKey ?? defaultValue ?? "",
    onChange: picker?.setSelectedKey ?? onChange,
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

  const context: SelectableCollectionContextValue = {
    activeKey,
    selectedKey: selected,
    setActiveKey,
    setSelectedKey: setSelected,
    register(key, textValue, element, disabled) {
      if (element) {
        itemMap.current.set(key, { key, textValue, element, disabled });
        if (!selectedRef.current && !activeKeyRef.current && !disabled) {
          activeKeyRef.current = key;
          setActiveKey(key);
        }
      } else {
        itemMap.current.delete(key);
      }
    },
    items() {
      return sortItems([...itemMap.current.values()]);
    },
  };

  return (
    <ListBoxContext.Provider value={context}>
      <div
        {...props}
        ref={ref}
        id={props.id ?? picker?.listBoxId}
        role="listbox"
        aria-labelledby={props["aria-labelledby"] ?? picker?.labelId}
        aria-orientation={orientation}
        data-orientation={orientation}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (picker && event.key === "Escape") {
            event.preventDefault();
            picker.setOpen(false);
            document.getElementById(select?.triggerId ?? comboBox?.inputId ?? "")?.focus();
            return;
          }
          const items = context.items();
          const key =
            getRovingFocusTarget(items, selected, event.key, { orientation, loop: true }) ??
            (event.key.length === 1 ? findTypeaheadMatch(items, event.key, selected) : undefined);
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          comboBox?.setActiveKey(key);
          setSelected(key);
          items.find((item) => item.key === key)?.element?.focus();
          if (picker && (event.key === "Enter" || event.key === " ")) picker.setOpen(false);
        }}
      />
    </ListBoxContext.Provider>
  );
}
