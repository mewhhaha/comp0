/** Snaps to the step grid anchored at min and clamps into [min, max]. */
export function snapToStep(next: number, min: number, max: number, step: number) {
  const snapped = min + Math.round((next - min) / step) * step;
  const clamped = Math.min(max, Math.max(min, snapped));
  // Trim floating-point residue such as 30.000000000000004.
  return Number(clamped.toFixed(10));
}

/** Converts a pointer position over the track rect into a slider value. */
export function valueAtPointer(
  point: { clientX: number; clientY: number },
  rect: { left: number; bottom: number; width: number; height: number },
  orientation: "horizontal" | "vertical",
  min: number,
  max: number,
  rtl = false,
) {
  let fraction: number;
  if (orientation === "horizontal") {
    if (rect.width === 0) return undefined;
    fraction = (point.clientX - rect.left) / rect.width;
    if (rtl) fraction = 1 - fraction;
  } else {
    if (rect.height === 0) return undefined;
    fraction = (rect.bottom - point.clientY) / rect.height;
  }
  return min + Math.min(1, Math.max(0, fraction)) * (max - min);
}

/** A horizontal track's low end sits on the right in right-to-left layouts. */
export function isRtl(element: HTMLElement) {
  return getComputedStyle(element).direction === "rtl";
}
