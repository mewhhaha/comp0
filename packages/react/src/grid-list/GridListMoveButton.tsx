import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  useOptionalGridListItemContext,
  useOptionalGridListReorderGroupContext,
} from "./grid-list-shared.js";

export type GridListMoveButtonProps = ComponentProps<"button"> &
  AsProp & {
    /** GridListReorderGroup column to append this row to. */
    to: string;
  };

export function GridListMoveButton({
  as,
  to,
  disabled,
  onClick,
  ...props
}: GridListMoveButtonProps) {
  const group = useOptionalGridListReorderGroupContext();
  const row = useOptionalGridListItemContext();
  if (!group || !row?.listName) return null;
  if (!group.hasList(to)) {
    throw new Error(
      `GridListMoveButton destination "${to}" is missing from GridListReorderGroup.value.`,
    );
  }
  const listName = row.listName;
  const resolvedDisabled = Boolean(
    disabled || group.movePending || !row.reorderable || !group.canMoveTo(listName, row.value, to),
  );

  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? "button" : undefined}
      disabled={isNativeButton ? resolvedDisabled : undefined}
      aria-disabled={!isNativeButton && resolvedDisabled ? true : undefined}
      aria-label={props["aria-label"] ?? `Move ${row.label} to ${group.getListLabel(to)}`}
      data-disabled={dataAttr(resolvedDisabled)}
      data-slot="grid-list-move-button"
      data-to={to}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        group.moveTo(listName, row.value, to);
      }}
    />
  );
}
