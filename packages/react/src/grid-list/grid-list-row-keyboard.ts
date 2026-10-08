export type RowControlMove = {
  /** Whether the key press was consumed and its default must be prevented. */
  handled: boolean;
  /** The element that receives focus, when the key moved it. */
  focus?: HTMLElement | undefined;
};

/**
 * Resolves the inline-forward and inline-backward arrows inside a row: forward
 * steps into the next control, backward steps out to the previous control or
 * the row itself. Returns null for any other key. `target` is the element that
 * had focus; `focusables` are the row's controls in order.
 */
export function resolveRowControlMove(options: {
  key: string;
  dir: "ltr" | "rtl";
  row: HTMLElement;
  target: HTMLElement;
  focusables: readonly HTMLElement[];
}): RowControlMove | null {
  const { key, dir, row, target, focusables } = options;
  const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
  const insideRow = target !== row;
  if (key === forward) {
    const next = focusables[(insideRow ? focusables.indexOf(target) : -1) + 1];
    return { handled: next !== undefined, focus: next };
  }
  if (key === backward) {
    if (!insideRow) return { handled: false };
    return { handled: true, focus: focusables[focusables.indexOf(target) - 1] ?? row };
  }
  return null;
}
