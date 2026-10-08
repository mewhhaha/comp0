import { useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { useCollection, useCollectionNavigation, type CollectionItem } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { writingDirection } from "../internal/writing-direction.js";
import { TagListContext, useTagGroupContext, type TagListContextValue } from "./tag-shared.js";

export type TagListProps = Omit<ComponentProps<"div">, "role"> & AsProp;

export function TagList({
  as,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  id,
  onKeyDown,
  ...props
}: TagListProps) {
  const group = useTagGroupContext("TagList");
  const field = useFieldContext();
  const navigate = useCollectionNavigation();
  const collection = useCollection();
  const [activeKey, setActiveKey] = useState("");
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  // The first registered, enabled tag becomes the tab stop.
  const register = (item: CollectionItem) => {
    collection.register(item);
    if (item.element && !activeKeyRef.current && !item.disabled) {
      activeKeyRef.current = item.key;
      setActiveKey(item.key);
    }
  };
  const context: TagListContextValue = {
    activeKey,
    setActiveKey,
    register,
    unregister: (key, element) => {
      collection.unregister(key, element);
    },
  };
  let labelledBy = ariaLabelledBy;
  if (ariaLabel === undefined) labelledBy = labelledBy ?? field?.labelId;

  const Part = partElement(as, "div");
  return (
    <TagListContext value={context}>
      <Part
        {...props}
        id={id ?? field?.controlId}
        role="grid"
        tabIndex={-1}
        aria-describedby={describedBy(field, ariaDescribedBy) || undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-multiselectable={group.selectionEnabled || undefined}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          const tags = collection.items();
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
            } else {
              event.currentTarget.focus();
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
          const key = navigate(event.key, tags, current.key, {
            orientation: "horizontal",
            dir: writingDirection(event.currentTarget),
          });
          if (!key) return;
          event.preventDefault();
          setActiveKey(key);
          collection.get(key)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </TagListContext>
  );
}
