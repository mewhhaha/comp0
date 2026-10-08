import {
  type GridListGroupDropTarget,
  type GridListGroupSource,
  type GridListMove,
  type GridListOrder,
} from "./grid-list-shared.js";

/** Pure order arithmetic for moving rows between the named lists of a GridListReorderGroup. */

export type MoveProposal = {
  next: Record<string, string[]>;
  move: GridListMove;
};

export type ListPosition = { list: string; position: number };

export function cloneOrder(order: GridListOrder): Record<string, string[]> {
  return Object.fromEntries(Object.entries(order).map(([name, values]) => [name, [...values]]));
}

export function ordersMatch(left: GridListOrder, right: GridListOrder) {
  const names = Object.keys(left);
  if (names.length !== Object.keys(right).length) return false;
  return names.every((name) => {
    const leftValues = left[name];
    const rightValues = right[name];
    if (!leftValues || !rightValues || leftValues.length !== rightValues.length) return false;
    return leftValues.every((value, index) => value === rightValues[index]);
  });
}

export function labelsMatch(left: Record<string, string>, right: Record<string, string>) {
  const names = Object.keys(left);
  if (names.length !== Object.keys(right).length) return false;
  return names.every((name) => left[name] === right[name]);
}

/** Throws when a row value appears in more than one list. */
export function assertUniqueRows(order: GridListOrder) {
  const ownerByValue = new Map<string, string>();
  for (const [name, values] of Object.entries(order)) {
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
}

/** The list's accessible name: aria-labelledby text, then aria-label, then its key. */
export function resolveListLabel(name: string, element: HTMLElement | undefined) {
  const labelledBy = element?.getAttribute("aria-labelledby")?.trim().split(/\s+/) ?? [];
  const referencedLabel = labelledBy
    .map((id) => element?.ownerDocument.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(" ");
  if (referencedLabel) return referencedLabel;
  return element?.getAttribute("aria-label")?.trim() || name;
}

export function getMoveProposal(
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

  const next = cloneOrder(order);
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

/** The rows of `list` without the moved row: the slots a drop can land between. */
export function destinationValues(order: GridListOrder, list: string, moved: string) {
  return (order[list] ?? []).filter((rowValue) => rowValue !== moved);
}

/** The drop target for inserting at `position` among the destination rows. */
export function targetAtPosition(
  order: GridListOrder,
  list: string,
  position: number,
  moved: string,
): GridListGroupDropTarget {
  const anchor = destinationValues(order, list, moved)[position];
  if (anchor === undefined) return { list, value: null, edge: "after" };
  return { list, value: anchor, edge: "before" };
}

/** The insertion slot the current target points at, or the moved row's own slot without one. */
export function currentPosition(
  order: GridListOrder,
  source: GridListGroupSource,
  target: GridListGroupDropTarget | null,
): ListPosition {
  if (!target) {
    return { list: source.list, position: (order[source.list] ?? []).indexOf(source.value) };
  }
  const destination = destinationValues(order, target.list, source.value);
  if (target.value === null) return { list: target.list, position: destination.length };
  const anchorIndex = destination.indexOf(target.value);
  return {
    list: target.list,
    position: target.edge === "before" ? anchorIndex : anchorIndex + 1,
  };
}

/**
 * The slots an arrow key tries, nearest first. Up and Down walk the current
 * list; Left and Right visit the neighboring list, starting at the same
 * position and fanning outward.
 */
export function keyboardCandidates(
  order: GridListOrder,
  source: GridListGroupSource,
  current: ListPosition,
  direction: "up" | "down" | "left" | "right",
) {
  const candidates: ListPosition[] = [];
  if (direction === "up" || direction === "down") {
    const last = destinationValues(order, current.list, source.value).length;
    const step = direction === "up" ? -1 : 1;
    for (let next = current.position + step; next >= 0 && next <= last; next += step) {
      candidates.push({ list: current.list, position: next });
    }
    return candidates;
  }
  const listNames = Object.keys(order);
  const nextList = listNames[listNames.indexOf(current.list) + (direction === "left" ? -1 : 1)];
  if (nextList === undefined) return candidates;
  const last = destinationValues(order, nextList, source.value).length;
  const preferred = Math.min(current.position, last);
  candidates.push({ list: nextList, position: preferred });
  for (let offset = 1; offset <= last; offset += 1) {
    const above = preferred - offset;
    const below = preferred + offset;
    if (above >= 0) candidates.push({ list: nextList, position: above });
    if (below <= last) candidates.push({ list: nextList, position: below });
  }
  return candidates;
}
