import { useContext, type ButtonHTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { GridListItemContext, GridListReorderGroupContext } from "./grid-list-shared.js";

export type GridListMoveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** GridListReorderGroup column to append this row to. */
  to: string;
};

export function GridListMoveButton({
  to,
  disabled,
  onClick,
  ref,
  ...props
}: GridListMoveButtonProps & RefProp<HTMLButtonElement>) {
  const group = useContext(GridListReorderGroupContext);
  const row = useContext(GridListItemContext);
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

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      disabled={resolvedDisabled}
      aria-label={props["aria-label"] ?? `Move ${row.label} to ${group.getListLabel(to)}`}
      data-disabled={dataAttr(resolvedDisabled)}
      data-slot="grid-list-move-button"
      data-to={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        group.moveTo(listName, row.value, to);
      }}
    />
  );
}
