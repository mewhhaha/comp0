import { useState, type ReactNode } from "react";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import { VisuallyHidden } from "../visually-hidden/VisuallyHidden.js";
import { assertUniqueRows } from "./grid-list-group-order.js";
import {
  GridListReorderGroupContext,
  type GridListMove,
  type GridListOrder,
  type GridListReorderGroupContextValue,
} from "./grid-list-shared.js";
import { useGridListGroupRegistry } from "./useGridListGroupRegistry.js";
import { useGridListGroupSession } from "./useGridListGroupSession.js";
import { useGridListMoveTransaction } from "./useGridListMoveTransaction.js";

export type { GridListMove, GridListOrder } from "./grid-list-shared.js";

export type GridListReorderGroupProps = RootProps<{
  value: GridListOrder;
  onChange: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  /** Keeps a proposed move locked while an asynchronous owner decides whether to accept it. */
  pending?: boolean | undefined;
  children?: ReactNode | undefined;
}>;

export function GridListReorderGroup({
  as,
  value,
  onChange,
  canMove,
  pending = false,
  children,
  ...props
}: GridListReorderGroupProps) {
  assertUniqueRows(value);
  const [announcement, setAnnouncement] = useState("");
  const registry = useGridListGroupRegistry(value, children);
  const transaction = useGridListMoveTransaction({
    order: value,
    pending,
    onChange,
    registry,
    announce: setAnnouncement,
  });
  const session = useGridListGroupSession({
    order: value,
    canMove,
    registry,
    transaction,
    announce: setAnnouncement,
  });

  const context: GridListReorderGroupContextValue = {
    source: session.source,
    target: session.target,
    focusRequest: transaction.focusRequest,
    movePending: transaction.movePending,
    acknowledgeFocusRequest: transaction.acknowledgeFocusRequest,
    hasList: (name) => value[name] !== undefined,
    registerList: registry.registerList,
    unregisterList: registry.unregisterList,
    registerRow: registry.registerRow,
    unregisterRow: registry.unregisterRow,
    startDrag: session.startDrag,
    setDropTarget: session.setDropTarget,
    commitDrop: session.commitDrop,
    endDrag: session.endDrag,
    beginKeyboardMove: session.beginKeyboardMove,
    retargetKeyboardMove: session.retargetKeyboardMove,
    commitKeyboardMove: session.commitKeyboardMove,
    cancelKeyboardMove: session.cancelKeyboardMove,
    moveWithin: session.moveWithin,
    moveTo: session.moveTo,
    canMoveTo: session.canMoveTo,
    getListLabel: registry.listLabel,
  };

  const Root = rootElement(as);
  return (
    <GridListReorderGroupContext value={context}>
      <Root {...props}>
        <>
          {children}
          <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
        </>
      </Root>
    </GridListReorderGroupContext>
  );
}
