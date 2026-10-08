import { useState } from "react";
import { gridListMessages } from "./grid-list-announcements.js";
import {
  currentPosition,
  destinationValues,
  getMoveProposal,
  keyboardCandidates,
  targetAtPosition,
  type MoveProposal,
} from "./grid-list-group-order.js";
import {
  type GridListGroupDropTarget,
  type GridListGroupSource,
  type GridListMove,
  type GridListOrder,
} from "./grid-list-shared.js";
import { type useGridListGroupRegistry } from "./useGridListGroupRegistry.js";
import { type useGridListMoveTransaction } from "./useGridListMoveTransaction.js";

/**
 * The drag and keyboard-move session of a GridListReorderGroup: the dragged
 * row (`source`), its pending drop `target`, and every operation that proposes
 * a move and hands it to the transaction.
 */
export function useGridListGroupSession(options: {
  order: GridListOrder;
  canMove: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  registry: ReturnType<typeof useGridListGroupRegistry>;
  transaction: ReturnType<typeof useGridListMoveTransaction>;
  announce: (message: string) => void;
}) {
  const { order, canMove, registry, transaction, announce } = options;
  const [source, setSource] = useState<GridListGroupSource | null>(null);
  const [target, setTarget] = useState<GridListGroupDropTarget | null>(null);

  const clear = () => {
    setSource(null);
    setTarget(null);
  };

  const proposalFor = (moveSource: GridListGroupSource, moveTarget: GridListGroupDropTarget) => {
    if (transaction.locked()) return null;
    const proposal = getMoveProposal(order, moveSource, moveTarget);
    if (!proposal) return null;
    if (canMove && !canMove(proposal.next, proposal.move)) return null;
    return proposal;
  };

  const commit = (proposal: MoveProposal, label: string) => {
    if (transaction.locked()) return;
    transaction.commit(proposal, label);
    clear();
  };

  const sourceFor = (list: string, value: string): GridListGroupSource => ({
    list,
    value,
    label: registry.rowLabel(value),
  });

  const announcePosition = (moveSource: GridListGroupSource, list: string, position: number) => {
    const total = destinationValues(order, list, moveSource.value).length + 1;
    announce(
      gridListMessages.movingToList(
        moveSource.label,
        registry.listLabel(list),
        position + 1,
        total,
      ),
    );
  };

  return {
    source,
    target,
    startDrag(list: string, rowValue: string, label: string) {
      if (transaction.locked()) return;
      if (!order[list]?.includes(rowValue)) {
        throw new Error(
          `GridList "${list}" cannot move row "${rowValue}" because it is absent from GridListReorderGroup.value.`,
        );
      }
      setSource({ list, value: rowValue, label });
      setTarget(null);
    },
    setDropTarget(nextTarget: GridListGroupDropTarget | null) {
      if (transaction.locked() || !source || !nextTarget) {
        setTarget(null);
        return;
      }
      setTarget(proposalFor(source, nextTarget) ? nextTarget : null);
    },
    commitDrop() {
      if (!transaction.locked() && source && target) {
        const proposal = proposalFor(source, target);
        if (proposal) commit(proposal, source.label);
      }
      clear();
    },
    endDrag: clear,
    beginKeyboardMove(list: string, rowValue: string) {
      if (transaction.locked()) return;
      if (!order[list]?.includes(rowValue)) return;
      const label = registry.rowLabel(rowValue);
      setSource({ list, value: rowValue, label });
      setTarget(null);
      announce(gridListMessages.started(label));
    },
    retargetKeyboardMove(direction: "up" | "down" | "left" | "right") {
      if (!source || transaction.locked()) return;
      const candidates = keyboardCandidates(
        order,
        source,
        currentPosition(order, source, target),
        direction,
      );
      for (const candidate of candidates) {
        const candidateTarget = targetAtPosition(
          order,
          candidate.list,
          candidate.position,
          source.value,
        );
        const proposal = getMoveProposal(order, source, candidateTarget);
        if (!proposal) {
          // Only the row's own slot produces no change; landing there withdraws
          // the pending move instead of skipping past it.
          if (candidate.list !== source.list) continue;
          setTarget(null);
          announcePosition(source, candidate.list, candidate.position);
          return;
        }
        if (canMove && !canMove(proposal.next, proposal.move)) continue;
        setTarget(candidateTarget);
        announcePosition(source, candidate.list, candidate.position);
        return;
      }
      announce(gridListMessages.blocked(source.label));
    },
    commitKeyboardMove() {
      if (transaction.locked()) {
        clear();
        return;
      }
      if (source && target) {
        const proposal = proposalFor(source, target);
        if (proposal) {
          commit(proposal, source.label);
          return;
        }
      }
      if (source) announce(gridListMessages.cancelled(source.label));
      clear();
    },
    cancelKeyboardMove() {
      if (source) announce(gridListMessages.cancelled(source.label));
      clear();
    },
    moveWithin(list: string, rowValue: string, delta: -1 | 1) {
      if (transaction.locked()) return;
      const orderedValues = order[list];
      if (!orderedValues) return;
      const index = orderedValues.indexOf(rowValue);
      const targetIndex = index + delta;
      if (index < 0 || targetIndex < 0 || targetIndex >= orderedValues.length) return;
      const moveSource = sourceFor(list, rowValue);
      const moveTarget: GridListGroupDropTarget = {
        list,
        value: orderedValues[targetIndex]!,
        edge: delta < 0 ? "before" : "after",
      };
      const proposal = proposalFor(moveSource, moveTarget);
      if (!proposal) {
        announce(gridListMessages.blocked(moveSource.label));
        return;
      }
      commit(proposal, moveSource.label);
    },
    moveTo(list: string, rowValue: string, targetList: string) {
      if (transaction.locked()) return;
      const moveSource = sourceFor(list, rowValue);
      const proposal = proposalFor(moveSource, { list: targetList, value: null, edge: "after" });
      if (!proposal) {
        announce(gridListMessages.blockedToList(moveSource.label, registry.listLabel(targetList)));
        return;
      }
      commit(proposal, moveSource.label);
    },
    canMoveTo(list: string, rowValue: string, targetList: string) {
      const proposal = proposalFor(sourceFor(list, rowValue), {
        list: targetList,
        value: null,
        edge: "after",
      });
      return Boolean(proposal);
    },
  };
}
