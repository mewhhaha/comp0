import { type CSSProperties } from "react";

export type PopoverPlacement =
  | "top"
  | "top start"
  | "top end"
  | "bottom"
  | "bottom start"
  | "bottom end"
  | "left"
  | "left top"
  | "left bottom"
  | "right"
  | "right top"
  | "right bottom";

export type PopoverPlacementProps = {
  /** Trigger side to open on, with an optional aligned edge; positioned with CSS anchor positioning and flipped automatically when there is no room. */
  placement?: PopoverPlacement | undefined;
  /** Gap between the trigger and the surface in pixels; only used together with placement. */
  offset?: number | undefined;
};

const placementAreas: Record<PopoverPlacement, string> = {
  top: "block-start",
  "top start": "block-start span-inline-end",
  "top end": "block-start span-inline-start",
  bottom: "block-end",
  "bottom start": "block-end span-inline-end",
  "bottom end": "block-end span-inline-start",
  left: "left",
  "left top": "left span-bottom",
  "left bottom": "left span-top",
  right: "right",
  "right top": "right span-bottom",
  "right bottom": "right span-top",
};

/** CSS anchor names must be dashed idents, but React ids contain characters like «r1»; both the trigger and its surface derive the same name from the shared trigger id. */
export function popoverAnchorName(triggerId: string | undefined): string | undefined {
  if (!triggerId) return undefined;
  return `--comp0-anchor-${triggerId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function triggerAnchorStyle(
  triggerId: string | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  const anchorName = popoverAnchorName(triggerId);
  if (!anchorName) return style;
  return { anchorName, ...style } as CSSProperties;
}

export function placementSurfaceStyle(
  placement: PopoverPlacement | undefined,
  offset: number | undefined,
  triggerId: string | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (!placement) return style;
  // The UA popover stylesheet sets inset: 0 and margin: auto, which fight
  // position-area; the offset margin only follows the placement axis so a
  // flip fallback keeps the same gap.
  const onBlockAxis = placement.startsWith("top") || placement.startsWith("bottom");
  const computed: Record<string, string | number> = {
    inset: "auto",
    margin: 0,
    positionArea: placementAreas[placement],
    positionTryFallbacks: onBlockAxis ? "flip-block" : "flip-inline",
  };
  const anchorName = popoverAnchorName(triggerId);
  if (anchorName) computed["positionAnchor"] = anchorName;
  if (offset) computed[onBlockAxis ? "marginBlock" : "marginInline"] = `${offset}px`;
  return { ...computed, ...style } as CSSProperties;
}
