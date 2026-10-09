import { type ComponentProps } from "react";
import { disabledProps } from "../internal/disabled.js";
import { useWarnOnce } from "../internal/dev.js";
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
  onKeyDown,
  ...props
}: GridListMoveButtonProps) {
  const warn = useWarnOnce();
  const group = useOptionalGridListReorderGroupContext();
  const row = useOptionalGridListItemContext();
  if (!group || !row?.listName) return null;
  if (!group.hasList(to)) {
    warn(
      `GridListMoveButton:missing-destination:${to}`,
      `GridListMoveButton destination "${to}" is missing from GridListReorderGroup.value. It was not rendered.`,
    );
    return null;
  }
  const listName = row.listName;
  const resolvedDisabled =
    disabled || group.movePending || !row.reorderable || !group.canMoveTo(listName, row.value, to);
  const disabledAttributes = disabledProps<HTMLButtonElement>(resolvedDisabled, {
    native: as === undefined || as === "button",
    onKeyDown,
    onClick(event) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      group.moveTo(listName, row.value, to);
    },
  });

  const Part = partElement(as, "button");
  return (
    <Part
      type={as === undefined || as === "button" ? "button" : undefined}
      aria-label={props["aria-label"] ?? `Move ${row.label} to ${group.getListLabel(to)}`}
      data-slot="grid-list-move-button"
      {...props}
      {...disabledAttributes}
    />
  );
}
