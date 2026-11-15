import { type ComponentProps, type KeyboardEvent } from "react";
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
  // so no selection change expires the record: it holds while its tag is enabled, the stop falls
  // back to the first enabled tag otherwise, and unmounting the tag drops it. It lives outside React state,
  // so a focus move re-renders only the two tags whose tabIndex changes (bench: collection-tab-stop.bench.tsx, PERFORMANCE.md).
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
      // A tag whose ref callback runs again (new children, or a new element for a new `as`)
      // unregisters and registers again in the same commit, so only a key still missing once
      // the commit is done has gone: "keeps the stop on a tag whose element changes".
      queueMicrotask(() => {
        if (!collection.get(key)) tabStops.forget(key);
      });
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
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const target = event.target instanceof HTMLElement ? event.target : null;
          if (!target) return;
          const tags = collection.items();
          const current = tags.find((item) => item.element?.contains(target));
          if (!current) return;
          if ((event.key === "Delete" || event.key === "Backspace") && group.remove) {
            // Focus reaches a disabled tag only through a control inside it, which must not
            // remove the tag either.
            if (current.disabled) return;
            event.preventDefault();
            const index = tags.indexOf(current);
            group.remove(current.key);
            const enabled = (tag: CollectionItem) => !tag.disabled;
            const neighbor =
              tags.slice(index + 1).find(enabled) ?? tags.slice(0, index).reverse().find(enabled);
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
