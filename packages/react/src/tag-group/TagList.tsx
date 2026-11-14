import { type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { useCollectionNavigation, type CollectionItem } from "@comp0/core";
import { describedBy, useFieldContext } from "../field/field-shared.js";
import { useCollectionPass, useCollectionSeed } from "../internal/collection-pass.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { NO_SELECTION, useTabStopStore } from "../internal/tab-stop.js";
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
  onFocus,
  onKeyDown,
  ...props
}: TagListProps) {
  const group = useTagGroupContext("TagList");
  const field = useFieldContext();
  const navigate = useCollectionNavigation();
  const { collection } = group;
  // On the server and while hydrating, the tags are collected before they render, so the stop
  // is already resolved in server HTML.
  const seed = useCollectionSeed();
  const pass = useCollectionPass(seed, children);
  // The tag that last held focus or was chosen. Selection is multiple and never picks the stop,
  // so the record holds until its tag unmounts or is disabled, and the stop falls back to the
  // first enabled tag. It lives outside React state, so a focus move re-renders only the two
  // tags whose tabIndex changes (bench: collection-tab-stop.bench.tsx, PERFORMANCE.md).
  const tabStops = useTabStopStore(collection, seed);
  const setFocusedKey = (key: string) => {
    tabStops.focus(key, NO_SELECTION);
  };

  const context: TagListContextValue = {
    seed,
    tabStops,
    setFocusedKey,
    register: (item: CollectionItem) => {
      collection.register(item);
    },
    unregister: (key, element) => {
      collection.unregister(key, element);
    },
  };
  let labelledBy = ariaLabelledBy;
  if (ariaLabel === undefined) labelledBy = labelledBy ?? field?.labelId;

  const Part = partElement(as, "div");
  return (
    <TagListContext value={context}>
      {pass}
      <Part
        {...props}
        id={id ?? field?.controlId}
        role="grid"
        tabIndex={-1}
        aria-describedby={describedBy(field, ariaDescribedBy) || undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-multiselectable={group.selectionEnabled || undefined}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          // Covers focus that no key handler moved: a click, a remove control inside a tag, or
          // TagPickerInput sending focus to the last tag.
          const tag = collection
            .items()
            .find((item) => item.element?.contains(event.target as Node));
          if (tag && !tag.disabled) setFocusedKey(tag.key);
        }}
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
              setFocusedKey(neighbor.key);
              neighbor.element?.focus();
            } else {
              event.currentTarget.focus();
            }
            return;
          }
          if (group.selectionEnabled && (event.key === "Enter" || event.key === " ")) {
            if (current.disabled) return;
            event.preventDefault();
            setFocusedKey(current.key);
            group.toggle(current.key);
            return;
          }
          const key = navigate(event.key, tags, current.key, {
            orientation: "horizontal",
            dir: writingDirection(event.currentTarget),
          });
          if (!key) return;
          event.preventDefault();
          setFocusedKey(key);
          collection.get(key)?.element?.focus();
        }}
      >
        {children}
      </Part>
    </TagListContext>
  );
}
