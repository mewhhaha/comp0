import { useContext, useId, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { resolveItemLabel } from "./collection-shared.js";
import { rowFocusables } from "./grid-list-shared.js";
import { TagGroupContext, TagListContext } from "./tag-shared.js";

export type TagProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** Overrides the text crawled from children for typeahead. */
  textValue?: string | undefined;
};

export function Tag({
  id: idProp,
  value: valueProp,
  disabled,
  textValue,
  children,
  onClick,
  ref,
  ...props
}: TagProps & RefProp<HTMLDivElement>) {
  const group = useContext(TagGroupContext);
  const list = useContext(TagListContext);
  if (!list) throw new Error("Tag must be rendered inside TagList.");
  const generatedId = useId().replace(/:/g, "");
  const value = valueProp ?? generatedId;
  const id = idProp ?? `tag-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const selected = group?.selectionEnabled === true && group.selected.includes(value);
  const active = list.activeKey === value;
  const ariaLabel = props["aria-label"];
  const rowRef = useRef<HTMLDivElement | null>(null);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  const itemRef = (element: HTMLDivElement | null) => {
    rowRef.current = element;
    list.register(
      value,
      resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
      element,
      resolvedDisabled,
    );
    composeRefs(ref)(element);
  };

  // Controls inside a tag (like a remove button) are reachable by pointer
  // and by Delete on the tag, never by Tab, so the group stays one tab stop.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    for (const element of rowFocusables(row)) element.tabIndex = -1;
    list.register(
      value,
      resolveItemLabel({ textValue, children, element: row, ariaLabel, fallback: value }),
      row,
      resolvedDisabled,
    );
  });

  return (
    <div
      {...props}
      ref={itemRef}
      id={id}
      role="row"
      tabIndex={tabIndex}
      aria-selected={group?.selectionEnabled ? selected : undefined}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={value}
      onClick={(event) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target && rowFocusables(event.currentTarget).some((el) => el.contains(target))) return;
        list.setActiveKey(value);
        if (group?.selectionEnabled) group.toggle(value);
      }}
    >
      <div role="gridcell" data-slot="tag-cell">
        {children}
      </div>
    </div>
  );
}
