import { useLayoutEffect, useRef, useState } from "react";
import { gridListMessages } from "./grid-list-announcements.js";
import { cloneOrder, ordersMatch, type MoveProposal } from "./grid-list-group-order.js";
import { type GridListFocusRequest, type GridListOrder } from "./grid-list-shared.js";
import { type useGridListGroupRegistry } from "./useGridListGroupRegistry.js";

type PendingMove = {
  sourceOrder: Record<string, string[]>;
  proposal: MoveProposal;
  label: string;
  focusedElement: Element | null;
};

/**
 * Commits one move to the group's controlled owner and waits for the order to
 * come back. An accepted move is announced and focus follows the row (unless
 * the user moved focus elsewhere); a rejected move unlocks silently. While a
 * move is pending, or `pending` is set by an asynchronous owner, no other move starts.
 */
export function useGridListMoveTransaction(options: {
  order: GridListOrder;
  pending: boolean;
  onChange: (value: Record<string, string[]>, move: MoveProposal["move"]) => void;
  registry: ReturnType<typeof useGridListGroupRegistry>;
  announce: (message: string) => void;
}) {
  const { order, pending, onChange, registry, announce } = options;
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [focusRequest, setFocusRequest] = useState<GridListFocusRequest | null>(null);
  const pendingMoveRef = useRef<PendingMove | null>(null);

  useLayoutEffect(() => {
    if (!pendingMove) return;
    if (ordersMatch(order, pendingMove.proposal.next)) {
      const { move, next } = pendingMove.proposal;
      announce(
        gridListMessages.movedToList(
          pendingMove.label,
          registry.liveListLabel(move.to.list),
          move.to.index + 1,
          (next[move.to.list] ?? []).length,
        ),
      );
      const document = pendingMove.focusedElement?.ownerDocument ?? globalThis.document;
      const activeElement = document?.activeElement;
      if (
        !activeElement ||
        activeElement === document.body ||
        activeElement === pendingMove.focusedElement ||
        !activeElement.isConnected
      ) {
        setFocusRequest({ list: move.to.list, value: move.value });
      }
      pendingMoveRef.current = null;
      setPendingMove(null);
      return;
    }
    if (pending && ordersMatch(order, pendingMove.sourceOrder)) return;
    pendingMoveRef.current = null;
    setPendingMove(null);
  }, [pending, pendingMove, order]);

  useLayoutEffect(() => {
    if (!focusRequest) return;
    const destination = registry.row(focusRequest.value);
    if (
      !destination ||
      destination.list !== focusRequest.list ||
      destination.disabled ||
      !destination.element?.isConnected
    ) {
      setFocusRequest(null);
    }
  }, [focusRequest, order]);

  return {
    focusRequest,
    movePending: pending || pendingMove !== null,
    /** Whether a move is already waiting on its owner. */
    locked: () => pending || pendingMoveRef.current !== null,
    acknowledgeFocusRequest(request: GridListFocusRequest) {
      setFocusRequest((current) => (current === request ? null : current));
    },
    commit(proposal: MoveProposal, label: string) {
      if (pending || pendingMoveRef.current) return;
      const next = {
        sourceOrder: cloneOrder(order),
        proposal,
        label,
        focusedElement: globalThis.document?.activeElement ?? null,
      };
      pendingMoveRef.current = next;
      setPendingMove(next);
      onChange(proposal.next, proposal.move);
    },
  };
}
