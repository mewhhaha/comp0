import { useContext, useRef, useState, type HTMLAttributes } from "react";
import { findTypeaheadMatch, getRovingFocusTarget, useTypeaheadSearch } from "@comp0/core";
import { describedBy, useFieldContext } from "../field.js";
import { type RefProp } from "../shared.js";
import { sortItems, type CollectionItemRecord } from "./collection-shared.js";
import { TagGroupContext, TagListContext } from "./tag-shared.js";

export type TagListProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

export function TagList({
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  id,
  onKeyDown,
  ref,
  ...props
}: TagListProps & RefProp<HTMLDivElement>) {
  const group = useContext(TagGroupContext);
  if (!group) throw new Error("TagList must be rendered inside TagGroup.");
  const field = useFieldContext();
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
  const context = { activeKey, setActiveKey, register, items };
  let labelledBy = ariaLabelledBy;
  if (ariaLabel === undefined) labelledBy = labelledBy ?? field?.labelId;

  return (
    <TagListContext value={context}>
      <div
        {...props}
        ref={ref}
        id={id ?? field?.controlId}
        role="grid"
        aria-describedby={describedBy(field, ariaDescribedBy) || undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-multiselectable={group.selectionEnabled || undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          const tags = items();
          const current = tags.find((item) => item.element?.contains(target));
          if (!current) return;
          if ((event.key === "Delete" || event.key === "Backspace") && group.remove) {
            event.preventDefault();
            const index = tags.indexOf(current);
            group.remove(current.key);
            const neighbor = tags[index + 1] ?? tags[index - 1];
            if (neighbor) {
              setActiveKey(neighbor.key);
              neighbor.element?.focus();
            }
            return;
          }
          if (group.selectionEnabled && (event.key === "Enter" || event.key === " ")) {
            if (current.disabled) return;
            event.preventDefault();
            setActiveKey(current.key);
            group.toggle(current.key);
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
    </TagListContext>
  );
}
