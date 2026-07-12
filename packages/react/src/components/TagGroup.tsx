import { useRef, useState, type HTMLAttributes } from "react";
import {
  findTypeaheadMatch,
  getRovingFocusTarget,
  useControllableState,
  useTypeaheadSearch,
} from "@comp0/core";
import { type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";
import { TagGroupContext, type TagGroupContextValue } from "./tag-shared.js";

export type TagGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  /** Controlled or initial selected tag values; omit both for no selection. */
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  /** Receives a tag's value from Delete, Backspace, or a remove control. */
  onRemove?: ((value: string) => void) | undefined;
};

export function TagGroup({
  value,
  defaultValue,
  onChange,
  onRemove,
  onKeyDown,
  children,
  ref,
  ...props
}: TagGroupProps & RefProp<HTMLDivElement>) {
  const selectionEnabled =
    value !== undefined || defaultValue !== undefined || onChange !== undefined;
  const [selected, setSelected] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange,
  });
  const typeaheadSearch = useTypeaheadSearch();
  const [activeKey, setActiveKey] = useState("");
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const itemMap = useRef(new Map<string, CollectionItemRecord>());

  const register = (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => {
    if (!element) {
      itemMap.current.delete(key);
      return;
    }
    itemMap.current.set(key, { key, id: element.id, textValue, element, disabled });
    if (!activeKeyRef.current && !disabled) {
      activeKeyRef.current = key;
      setActiveKey(key);
    }
  };
  const items = () => sortItems([...itemMap.current.values()]);
  const toggle = (tagValue: string) => {
    setSelected((current) => {
      if (current.includes(tagValue)) return current.filter((entry) => entry !== tagValue);
      return [...current, tagValue];
    });
  };

  const context: TagGroupContextValue = {
    selectionEnabled,
    selected,
    activeKey,
    setActiveKey,
    toggle,
    remove: onRemove,
    register,
    items,
  };

  return (
    <TagGroupContext value={context}>
      <div
        {...props}
        ref={ref}
        role="grid"
        aria-multiselectable={selectionEnabled || undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          const tags = items();
          const current = tags.find((item) => item.element?.contains(target));
          if (!current) return;
          if ((event.key === "Delete" || event.key === "Backspace") && onRemove) {
            event.preventDefault();
            const index = tags.indexOf(current);
            onRemove(current.key);
            // Keep focus useful after removal: land on a neighboring tag.
            const neighbor = tags[index + 1] ?? tags[index - 1];
            if (neighbor) {
              setActiveKey(neighbor.key);
              neighbor.element?.focus();
            }
            return;
          }
          if (selectionEnabled && (event.key === "Enter" || event.key === " ")) {
            if (current.disabled) return;
            event.preventDefault();
            setActiveKey(current.key);
            toggle(current.key);
            return;
          }
          let key = getRovingFocusTarget(tags, current.key, event.key, {
            orientation: "horizontal",
          });
          if (!key && event.key.length === 1) {
            key = findTypeaheadMatch(tags, typeaheadSearch(event.key), current.key);
          }
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          tags.find((item) => item.key === key)?.element?.focus();
        }}
      >
        {children}
      </div>
    </TagGroupContext>
  );
}
