import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { VisuallyHidden } from "./VisuallyHidden.js";
import {
  GridListReorderGroupContext,
  type GridListFocusRequest,
  type GridListGroupDropTarget,
  type GridListGroupSource,
  type GridListMove,
  type GridListOrder,
} from "./grid-list-shared.js";

export type { GridListMove, GridListOrder } from "./grid-list-shared.js";

type MoveProposal = {
  next: Record<string, string[]>;
  move: GridListMove;
};

type PendingMove = {
  sourceOrder: Record<string, string[]>;
  proposal: MoveProposal;
  label: string;
  focusedElement: Element | null;
};

type RegisteredList = {
  element: HTMLElement;
  observer: MutationObserver | null;
};

type RegisteredRow = {
  list: string;
  label: string;
  element: HTMLElement;
  disabled: boolean;
};

function ordersMatch(left: GridListOrder, right: GridListOrder) {
  const names = Object.keys(left);
  if (names.length !== Object.keys(right).length) return false;
  return names.every((name) => {
    const leftValues = left[name];
    const rightValues = right[name];
    if (!leftValues || !rightValues || leftValues.length !== rightValues.length) return false;
    return leftValues.every((value, index) => value === rightValues[index]);
  });
}

function resolveListLabel(name: string, element: HTMLElement | undefined) {
  const labelledBy = element?.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
  const referencedLabel = labelledBy
    .map((id) => element?.ownerDocument.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(" ");
  if (referencedLabel) return referencedLabel;
  return element?.getAttribute("aria-label")?.trim() || name;
}

function listLabelsMatch(left: Record<string, string>, right: Record<string, string>) {
  const names = Object.keys(left);
  if (names.length !== Object.keys(right).length) return false;
  return names.every((name) => left[name] === right[name]);
}

function getMoveProposal(
  order: GridListOrder,
  source: GridListGroupSource,
  target: GridListGroupDropTarget,
): MoveProposal | null {
  const sourceValues = order[source.list];
  const targetValues = order[target.list];
  if (!sourceValues || !targetValues) return null;
  const sourceIndex = sourceValues.indexOf(source.value);
  if (sourceIndex < 0) return null;

  const destination = targetValues.filter((value) => value !== source.value);
  let targetIndex = destination.length;
  if (target.value !== null) {
    const anchorIndex = destination.indexOf(target.value);
    if (anchorIndex < 0) return null;
    targetIndex = target.edge === "before" ? anchorIndex : anchorIndex + 1;
  }
  const before = destination[targetIndex] ?? null;
  destination.splice(targetIndex, 0, source.value);

  const next = Object.fromEntries(
    Object.entries(order).map(([name, values]) => [name, [...values]]),
  );
  if (source.list === target.list) {
    const unchanged = destination.every((value, index) => value === sourceValues[index]);
    if (unchanged) return null;
    next[source.list] = destination;
  } else {
    next[source.list] = sourceValues.filter((value) => value !== source.value);
    next[target.list] = destination;
  }

  return {
    next,
    move: {
      value: source.value,
      from: { list: source.list, index: sourceIndex },
      to: { list: target.list, index: targetIndex },
      before,
    },
  };
}

export type GridListReorderGroupProps = {
  value: GridListOrder;
  onChange: (value: Record<string, string[]>, move: GridListMove) => void;
  canMove?: ((value: GridListOrder, move: GridListMove) => boolean) | undefined;
  /** Keeps a proposed move locked while an asynchronous owner decides whether to accept it. */
  pending?: boolean | undefined;
  children?: ReactNode | undefined;
};

export function GridListReorderGroup({
  value,
  onChange,
  canMove,
  pending = false,
  children,
}: GridListReorderGroupProps) {
  const ownerByValue = new Map<string, string>();
  for (const [name, values] of Object.entries(value)) {
    for (const rowValue of values) {
      const owner = ownerByValue.get(rowValue);
      if (owner !== undefined) {
        throw new Error(
          `GridListReorderGroup value "${rowValue}" appears in both "${owner}" and "${name}". Row values must be unique across the group.`,
        );
      }
      ownerByValue.set(rowValue, name);
    }
  }

  const [source, setSource] = useState<GridListGroupSource | null>(null);
  const [target, setTargetState] = useState<GridListGroupDropTarget | null>(null);
  const [focusRequest, setFocusRequest] = useState<GridListFocusRequest | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [listLabels, setListLabels] = useState<Record<string, string>>({});
  const listLabelsRef = useRef(listLabels);
  listLabelsRef.current = listLabels;
  const pendingMoveRef = useRef<PendingMove | null>(null);
  const lists = useRef(new Map<string, RegisteredList>());
  const rows = useRef(new Map<string, RegisteredRow>());

  const getListLabel = (name: string) => listLabels[name] ?? name;

  useLayoutEffect(() => {
    const nextLabels = Object.fromEntries(
      Object.keys(value).map((name) => [
        name,
        resolveListLabel(name, lists.current.get(name)?.element),
      ]),
    );
    if (listLabelsMatch(listLabelsRef.current, nextLabels)) return;
    listLabelsRef.current = nextLabels;
    setListLabels(nextLabels);
  }, [children, value]);

  const proposalFor = (moveSource: GridListGroupSource, moveTarget: GridListGroupDropTarget) => {
    if (pending || pendingMove) return null;
    const proposal = getMoveProposal(value, moveSource, moveTarget);
    if (!proposal) return null;
    if (canMove && !canMove(proposal.next, proposal.move)) return null;
    return proposal;
  };

  useLayoutEffect(() => {
    if (!pendingMove) return;
    if (ordersMatch(value, pendingMove.proposal.next)) {
      const destination = pendingMove.proposal.next[pendingMove.proposal.move.to.list] ?? [];
      const destinationName = pendingMove.proposal.move.to.list;
      setAnnouncement(
        `Moved ${pendingMove.label} to ${resolveListLabel(destinationName, lists.current.get(destinationName)?.element)}, position ${pendingMove.proposal.move.to.index + 1} of ${destination.length}.`,
      );
      const document = pendingMove.focusedElement?.ownerDocument ?? globalThis.document;
      const activeElement = document?.activeElement;
      if (
        !activeElement ||
        activeElement === document.body ||
        activeElement === pendingMove.focusedElement ||
        !activeElement.isConnected
      ) {
        setFocusRequest({
          list: pendingMove.proposal.move.to.list,
          value: pendingMove.proposal.move.value,
        });
      }
      pendingMoveRef.current = null;
      setPendingMove(null);
      return;
    }
    if (pending && ordersMatch(value, pendingMove.sourceOrder)) return;
    pendingMoveRef.current = null;
    setPendingMove(null);
  }, [pending, pendingMove, value]);

  useLayoutEffect(() => {
    if (!focusRequest) return;
    const destination = rows.current.get(focusRequest.value);
    if (
      !destination ||
      destination.list !== focusRequest.list ||
      destination.disabled ||
      !destination.element.isConnected
    ) {
      setFocusRequest(null);
    }
  }, [focusRequest, value]);

  const commit = (proposal: MoveProposal, label: string) => {
    if (pending || pendingMoveRef.current) return;
    const nextPendingMove = {
      sourceOrder: Object.fromEntries(
        Object.entries(value).map(([name, values]) => [name, [...values]]),
      ),
      proposal,
      label,
      focusedElement: globalThis.document?.activeElement ?? null,
    };
    pendingMoveRef.current = nextPendingMove;
    setPendingMove(nextPendingMove);
    setSource(null);
    setTargetState(null);
    onChange(proposal.next, proposal.move);
  };

  const context = {
    source,
    target,
    focusRequest,
    movePending: pending || pendingMove !== null,
    acknowledgeFocusRequest(request: GridListFocusRequest) {
      setFocusRequest((current) => (current === request ? null : current));
    },
    hasList(name: string) {
      return value[name] !== undefined;
    },
    registerList(name: string, element: HTMLElement) {
      const registered = lists.current.get(name);
      if (registered && registered.element !== element) {
        throw new Error(
          `GridList name "${name}" is rendered more than once inside GridListReorderGroup.`,
        );
      }
      if (registered) return;

      let observer: MutationObserver | null = null;
      const updateLabel = () => {
        observer?.disconnect();
        observer?.observe(element, {
          attributes: true,
          attributeFilter: ["aria-label", "aria-labelledby"],
        });
        const labelledBy = element.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
        for (const id of labelledBy) {
          const labelElement = element.ownerDocument.getElementById(id);
          if (labelElement) {
            observer?.observe(labelElement, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          }
        }
        const label = resolveListLabel(name, element);
        if (listLabelsRef.current[name] === label) return;
        const nextLabels = { ...listLabelsRef.current, [name]: label };
        listLabelsRef.current = nextLabels;
        setListLabels(nextLabels);
      };
      const MutationObserver = element.ownerDocument.defaultView?.MutationObserver;
      if (MutationObserver) observer = new MutationObserver(updateLabel);
      lists.current.set(name, { element, observer });
      updateLabel();
    },
    unregisterList(name: string, element: HTMLElement) {
      const registered = lists.current.get(name);
      if (registered?.element !== element) return;
      registered.observer?.disconnect();
      lists.current.delete(name);
    },
    registerRow(
      list: string,
      rowValue: string,
      label: string,
      element: HTMLElement,
      disabled: boolean,
    ) {
      const registered = rows.current.get(rowValue);
      if (registered && registered.element !== element) {
        throw new Error(
          `GridListItem value "${rowValue}" is rendered more than once inside GridListReorderGroup (in "${registered.list}" and "${list}").`,
        );
      }
      rows.current.set(rowValue, { list, label, element, disabled });
    },
    unregisterRow(list: string, rowValue: string, element: HTMLElement) {
      const registered = rows.current.get(rowValue);
      if (registered?.list === list && registered.element === element)
        rows.current.delete(rowValue);
    },
    startDrag(list: string, rowValue: string, label: string) {
      if (pending || pendingMoveRef.current) return;
      if (!value[list]?.includes(rowValue)) {
        throw new Error(
          `GridList "${list}" cannot move row "${rowValue}" because it is absent from GridListReorderGroup.value.`,
        );
      }
      setSource({ list, value: rowValue, label });
      setTargetState(null);
    },
    setDropTarget(nextTarget: GridListGroupDropTarget | null) {
      if (pending || pendingMoveRef.current) {
        setTargetState(null);
        return;
      }
      if (!source || !nextTarget) {
        setTargetState(null);
        return;
      }
      setTargetState(proposalFor(source, nextTarget) ? nextTarget : null);
    },
    commitDrop() {
      if (pending || pendingMoveRef.current) {
        setSource(null);
        setTargetState(null);
        return;
      }
      if (source && target) {
        const proposal = proposalFor(source, target);
        if (proposal) commit(proposal, source.label);
      }
      setSource(null);
      setTargetState(null);
    },
    endDrag() {
      setSource(null);
      setTargetState(null);
    },
    moveWithin(list: string, rowValue: string, delta: -1 | 1) {
      if (pending || pendingMoveRef.current) return;
      const orderedValues = value[list];
      if (!orderedValues) return;
      const index = orderedValues.indexOf(rowValue);
      const targetIndex = index + delta;
      if (index < 0 || targetIndex < 0 || targetIndex >= orderedValues.length) return;
      const anchor = orderedValues[targetIndex]!;
      const moveSource = {
        list,
        value: rowValue,
        label: rows.current.get(rowValue)?.label ?? rowValue,
      };
      const moveTarget = {
        list,
        value: anchor,
        edge: delta < 0 ? ("before" as const) : ("after" as const),
      };
      const proposal = proposalFor(moveSource, moveTarget);
      if (!proposal) {
        setAnnouncement(`Cannot move ${moveSource.label} there.`);
        return;
      }
      commit(proposal, moveSource.label);
    },
    moveTo(list: string, rowValue: string, targetList: string) {
      if (pending || pendingMoveRef.current) return;
      const moveSource = {
        list,
        value: rowValue,
        label: rows.current.get(rowValue)?.label ?? rowValue,
      };
      const proposal = proposalFor(moveSource, { list: targetList, value: null, edge: "after" });
      if (!proposal) {
        setAnnouncement(`Cannot move ${moveSource.label} to ${getListLabel(targetList)}.`);
        return;
      }
      commit(proposal, moveSource.label);
    },
    canMoveTo(list: string, rowValue: string, targetList: string) {
      const moveSource = {
        list,
        value: rowValue,
        label: rows.current.get(rowValue)?.label ?? rowValue,
      };
      return Boolean(proposalFor(moveSource, { list: targetList, value: null, edge: "after" }));
    },
    getListLabel,
  };

  return (
    <GridListReorderGroupContext value={context}>
      {children}
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
    </GridListReorderGroupContext>
  );
}
