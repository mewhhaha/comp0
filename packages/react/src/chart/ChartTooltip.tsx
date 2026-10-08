import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import {
  placementSurfaceStyle,
  triggerAnchorStyle,
  type PopoverPlacementProps,
} from "../internal/overlay/index.js";
import { useChartInteraction } from "./chart-interaction-context.js";
import { type ChartValueDetails } from "./chart-value-details.js";

export type ChartTooltipProps = Omit<ComponentProps<"div">, "children"> &
  AsProp &
  PopoverPlacementProps & {
    /** Details for the value currently reached by pointer or keyboard; defaults to its label. */
    children?: ReactNode | ((details: ChartValueDetails) => ReactNode);
  };

export function ChartTooltip({
  as,
  children,
  offset = 8,
  onPointerEnter,
  onPointerLeave,
  placement = "top",
  ref,
  style,
  ...props
}: ChartTooltipProps) {
  const interaction = useChartInteraction("ChartTooltip");
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(surfaceRef, ref);
  const open = Boolean(interaction.active && interaction.active.key !== interaction.dismissedKey);
  const activeDetails = interaction.active?.details;
  const activeElement = interaction.active?.element;
  const [anchorBounds, setAnchorBounds] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!open || !activeElement) {
      setAnchorBounds(null);
      return;
    }
    const ownerWindow = activeElement.ownerDocument.defaultView;
    const updateAnchorBounds = () => setAnchorBounds(activeElement.getBoundingClientRect());
    updateAnchorBounds();
    ownerWindow?.addEventListener("resize", updateAnchorBounds);
    ownerWindow?.addEventListener("scroll", updateAnchorBounds, true);
    return () => {
      ownerWindow?.removeEventListener("resize", updateAnchorBounds);
      ownerWindow?.removeEventListener("scroll", updateAnchorBounds, true);
    };
  }, [activeElement, open]);
  useEffect(() => {
    if (!open) return;
    const ownerDocument = surfaceRef.current?.ownerDocument;
    if (!ownerDocument) return;
    const dismiss = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") interaction.dismissActive();
    };
    ownerDocument.addEventListener("keydown", dismiss, true);
    return () => ownerDocument.removeEventListener("keydown", dismiss, true);
  }, [interaction, open]);

  let content: ReactNode;
  if (activeDetails) {
    content =
      typeof children === "function" ? children(activeDetails) : (children ?? activeDetails.label);
  }

  const Part = partElement(as, "div");
  return (
    <>
      <span
        aria-hidden="true"
        hidden={!anchorBounds}
        style={triggerAnchorStyle(interaction.triggerId, {
          position: "fixed",
          pointerEvents: "none",
          left: anchorBounds?.left,
          top: anchorBounds?.top,
          width: anchorBounds?.width,
          height: anchorBounds?.height,
        })}
      />
      <Part
        data-slot="chart-tooltip"
        {...props}
        ref={composedRef}
        id={props.id ?? interaction.contentId}
        role={props.role ?? "tooltip"}
        hidden={!open || !anchorBounds}
        style={placementSurfaceStyle(placement, offset, interaction.triggerId, {
          position: "fixed",
          ...style,
        })}
        data-open={dataAttr(open)}
        onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) interaction.cancelHoverClear();
        }}
        onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
          onPointerLeave?.(event);
          const hoveredKey = interaction.hoveredKey;
          if (!event.defaultPrevented && hoveredKey) interaction.scheduleHoverClear(hoveredKey);
        }}
      >
        {content}
      </Part>
    </>
  );
}
