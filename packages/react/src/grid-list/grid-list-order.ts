import { type GridListDropTarget } from "./grid-list-shared.js";

/** Pure order arithmetic for reordering the rows of one list. */

export function sameOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** The order after moving `moved` one step, or null when it is already at that edge. */
export function orderAfterStep(order: readonly string[], moved: string, delta: -1 | 1) {
  const from = order.indexOf(moved);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return null;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** The order a drop on `target` would produce, or null when it changes nothing. */
export function orderAfterDrop(
  order: readonly string[],
  moved: string,
  target: GridListDropTarget,
) {
  if (target.value === moved) return null;
  const next = order.filter((value) => value !== moved);
  const targetIndex = next.indexOf(target.value);
  if (targetIndex < 0) return null;
  next.splice(target.edge === "before" ? targetIndex : targetIndex + 1, 0, moved);
  if (sameOrder(next, order)) return null;
  return next;
}

/** The insertion slot a pending target points at, as an index into the other rows. */
export function insertionSlot(
  order: readonly string[],
  moved: string,
  target: GridListDropTarget | null,
) {
  if (!target) return order.indexOf(moved);
  const anchorIndex = order.filter((value) => value !== moved).indexOf(target.value);
  return target.edge === "before" ? anchorIndex : anchorIndex + 1;
}

export type KeyboardRetarget =
  | { kind: "blocked" }
  /** Landing on the row's own slot withdraws the pending move. */
  | { kind: "withdraw"; position: number; total: number }
  | { kind: "target"; target: GridListDropTarget; position: number; total: number };

/**
 * Where an Up or Down arrow moves a keyboard move's pending drop target.
 * Positions are 1-based; slots `allows` vetoes are skipped.
 */
export function retargetKeyboardMove(options: {
  order: readonly string[];
  moved: string;
  target: GridListDropTarget | null;
  direction: "up" | "down";
  allows?: ((proposed: string[]) => boolean) | undefined;
}): KeyboardRetarget {
  const { order, moved, target, direction, allows } = options;
  const destination = order.filter((value) => value !== moved);
  const step = direction === "up" ? -1 : 1;
  const last = destination.length;
  for (
    let next = insertionSlot(order, moved, target) + step;
    next >= 0 && next <= last;
    next += step
  ) {
    const proposed = [...destination];
    proposed.splice(next, 0, moved);
    if (sameOrder(proposed, order))
      return { kind: "withdraw", position: next + 1, total: last + 1 };
    if (allows && !allows(proposed)) continue;
    const anchor = destination[next];
    let candidate: GridListDropTarget = { value: destination[last - 1]!, edge: "after" };
    if (anchor !== undefined) candidate = { value: anchor, edge: "before" };
    return { kind: "target", target: candidate, position: next + 1, total: last + 1 };
  }
  return { kind: "blocked" };
}
