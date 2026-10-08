import { useId, useLayoutEffect, useRef, type ComponentProps, type MouseEvent } from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { resolveItemLabel } from "../internal/item-label.js";
import { focusableWithin } from "../internal/focusable.js";
import { rowCell } from "../grid-list/grid-list-shared.js";
import { useOptionalTagGroupContext, useTagListContext } from "./tag-shared.js";

export type TagProps = Omit<ComponentProps<"div">, "id"> &
  AsProp & {
    /** This tag's identity. */
    value: string;
    id?: string | undefined;
    disabled?: boolean | undefined;
    /** Overrides the text crawled from children for typeahead. */
    textValue?: string | undefined;
  };

export function Tag({
  as,
  id: idProp,
  value,
  disabled,
  textValue,
  children,
  onClick,
  ref,
  ...props
}: TagProps) {
  const group = useOptionalTagGroupContext();
  const list = useTagListContext("Tag");
  const generatedId = useId().replace(/:/g, "");
  const id = idProp ?? `tag-${generatedId}`;
  const resolvedDisabled = Boolean(disabled);
  const selected = group?.selectionEnabled === true && group.selected.includes(value);
  const active = list.activeKey === value;
  const ariaLabel = props["aria-label"];
  const rowRef = useRef<HTMLElement | null>(null);
  let tabIndex: number | undefined = -1;
  if (resolvedDisabled) tabIndex = undefined;
  else if (active) tabIndex = 0;

  const registerTag = (element: HTMLElement | null) => {
    if (!element) return;
    list.register({
      key: value,
      id,
      textValue: resolveItemLabel({ textValue, children, element, ariaLabel, fallback: value }),
      element,
      disabled: resolvedDisabled,
    });
    return () => list.unregister(value, element);
  };
  const composedRef = useComposedRefs(registerTag, rowRef, ref);

  // Controls inside a tag (like a remove button) are reachable by pointer
  // and by Delete on the tag, never by Tab, so the group stays one tab stop.
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    for (const element of focusableWithin(row)) element.tabIndex = -1;
    list.register({
      key: value,
      id,
      textValue: resolveItemLabel({
        textValue,
        children,
        element: row,
        ariaLabel,
        fallback: value,
      }),
      element: row,
      disabled: resolvedDisabled,
    });
  });

  const Part = partElement(as, "div");
  return (
    <Part
      {...props}
      ref={composedRef}
      id={id}
      role="row"
      tabIndex={tabIndex}
      aria-selected={group?.selectionEnabled ? selected : undefined}
      aria-disabled={resolvedDisabled || undefined}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(resolvedDisabled)}
      data-value={value}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (resolvedDisabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (event.defaultPrevented) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (target && focusableWithin(event.currentTarget).some((el) => el.contains(target)))
          return;
        list.setActiveKey(value);
        if (group?.selectionEnabled) group.toggle(value);
      }}
    >
      {rowCell(as, children, "tag-cell")}
    </Part>
  );
}
