import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SVGAttributes,
} from "react";
import { dataAttr, getRovingFocusTarget, useComposedRefs } from "@comp0/core";
import { dataSlot, resolveChildren, type RefProp, type StateChildren } from "../shared.js";
import {
  placementSurfaceStyle,
  triggerAnchorStyle,
  type PopoverPlacementProps,
} from "./overlay-shared.js";
import { writingDirection } from "./writing-direction.js";
import type {
  CandlestickChartValue,
  CartesianChartValue,
  CategoricalChartValue,
} from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Each SVG group is an individually named graphic within the chart. */

export type ChartValueDetails =
  | {
      kind: "bar" | "column";
      index: number;
      label: string;
      value: CategoricalChartValue;
      formattedValue: string;
    }
  | {
      kind: "line" | "area";
      index: number;
      label: string;
      value: CartesianChartValue;
      formattedX: string;
      formattedY: string;
    }
  | {
      kind: "pie";
      index: number;
      label: string;
      value: CategoricalChartValue;
      formattedValue: string;
      percentage: number;
    }
  | {
      kind: "candlestick";
      index: number;
      label: string;
      value: CandlestickChartValue;
      formattedX: string;
      formattedOpen: string;
      formattedHigh: string;
      formattedLow: string;
      formattedClose: string;
    };

type ActiveChartValue = {
  key: string;
  details: ChartValueDetails;
  element: SVGGElement;
};

type ChartInteractionContextValue = {
  active: ActiveChartValue | null;
  contentId: string;
  dismissedKey: string | null;
  hoveredKey: string | null;
  triggerId: string;
  cancelHoverClear: () => void;
  clearFocused: (key: string) => void;
  dismissActive: () => void;
  scheduleHoverClear: (key: string) => void;
  setFocused: (value: ActiveChartValue) => void;
  setHovered: (value: ActiveChartValue) => void;
};

const ChartInteractionContext = createContext<ChartInteractionContextValue | null>(null);

export function useActiveChartValue() {
  return useContext(ChartInteractionContext)?.active?.details ?? null;
}

export function ChartInteractionProvider({ children }: { children: ReactNode }) {
  const generatedId = useId();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [focused, setFocusedValue] = useState<ActiveChartValue | null>(null);
  const [hovered, setHoveredValue] = useState<ActiveChartValue | null>(null);
  const [lastInteraction, setLastInteraction] = useState<"focus" | "hover">("focus");
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  let active = focused ?? hovered;
  if (lastInteraction === "hover") active = hovered ?? focused;

  const cancelHoverClear = () => {
    clearTimeout(hoverTimer.current);
  };
  const context: ChartInteractionContextValue = {
    active,
    contentId: `${generatedId}-chart-tooltip`,
    dismissedKey,
    hoveredKey: hovered?.key ?? null,
    triggerId: `${generatedId}-chart-value`,
    cancelHoverClear,
    clearFocused(key) {
      setFocusedValue((current) => (current?.key === key ? null : current));
    },
    dismissActive() {
      if (active) setDismissedKey(active.key);
    },
    scheduleHoverClear(key) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => {
        setHoveredValue((current) => (current?.key === key ? null : current));
      }, 150);
    },
    setFocused(value) {
      setDismissedKey((current) => (current === value.key ? null : current));
      setLastInteraction("focus");
      setFocusedValue(value);
    },
    setHovered(value) {
      clearTimeout(hoverTimer.current);
      setDismissedKey((current) => (current === value.key ? null : current));
      setLastInteraction("hover");
      setHoveredValue(value);
    },
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  return <ChartInteractionContext value={context}>{children}</ChartInteractionContext>;
}

type ChartNavigationContextValue = {
  loop: boolean;
  orientation: "horizontal" | "vertical" | "both";
  setTabStopIndex: (index: number) => void;
  tabStopIndex: number;
};

const ChartNavigationContext = createContext<ChartNavigationContextValue | null>(null);

export function ChartNavigationProvider({
  children,
  count,
  loop = false,
  orientation,
}: {
  children: ReactNode;
  count: number;
  loop?: boolean | undefined;
  orientation: ChartNavigationContextValue["orientation"];
}) {
  const [tabStopIndex, setTabStopIndex] = useState(0);
  const resolvedTabStopIndex = tabStopIndex < count ? tabStopIndex : 0;
  return (
    <ChartNavigationContext
      value={{ loop, orientation, setTabStopIndex, tabStopIndex: resolvedTabStopIndex }}
    >
      {children}
    </ChartNavigationContext>
  );
}

type ChartValueProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  children: ReactNode;
  details: ChartValueDetails;
  fallbackSlot: string;
};

export function ChartValue({
  children,
  details,
  fallbackSlot,
  onBlur,
  onFocus,
  onKeyDown,
  onPointerEnter,
  onPointerLeave,
  ref,
  style,
  ...props
}: ChartValueProps & RefProp<SVGGElement>) {
  const generatedId = useId();
  const interaction = useContext(ChartInteractionContext);
  const navigation = useContext(ChartNavigationContext);
  if (!interaction) throw new Error("Chart value components must be rendered inside a chart root.");
  if (!navigation) throw new Error("Chart value components must be rendered inside a chart plot.");
  const active = interaction.active?.key === generatedId;

  const moveFocus = (event: KeyboardEvent<SVGGElement>) => {
    const plot = event.currentTarget.ownerSVGElement;
    if (!plot) return;
    const values = [...plot.querySelectorAll<SVGGElement>("[data-chart-value]")];
    const currentIndex = values.indexOf(event.currentTarget);
    if (currentIndex === -1) return;
    const targetKey = getRovingFocusTarget(
      values.map((_, index) => ({ key: String(index) })),
      String(currentIndex),
      event.key,
      {
        orientation: navigation.orientation,
        dir: writingDirection(event.currentTarget),
        loop: navigation.loop,
      },
    );
    if (targetKey === undefined) return;
    event.preventDefault();
    values[Number(targetKey)]?.focus();
  };
  return (
    <g
      {...props}
      ref={ref}
      role="img"
      tabIndex={details.index === navigation.tabStopIndex ? 0 : -1}
      aria-label={details.label}
      style={style}
      data-active={dataAttr(active)}
      data-chart-value=""
      data-slot={dataSlot(props, fallbackSlot)}
      onFocus={(event) => {
        onFocus?.(event);
        if (event.defaultPrevented) return;
        navigation.setTabStopIndex(details.index);
        interaction.setFocused({ key: generatedId, details, element: event.currentTarget });
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!event.defaultPrevented) interaction.clearFocused(generatedId);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) moveFocus(event);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) {
          interaction.setHovered({ key: generatedId, details, element: event.currentTarget });
        }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        if (!event.defaultPrevented) interaction.scheduleHoverClear(generatedId);
      }}
    >
      {children}
    </g>
  );
}

export type ChartTooltipProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  PopoverPlacementProps & {
    /** Renders details for the value currently reached by pointer or keyboard. */
    children?: StateChildren<ChartValueDetails>;
  };

export function ChartTooltip({
  children,
  offset = 8,
  onPointerEnter,
  onPointerLeave,
  placement = "top",
  ref,
  style,
  ...props
}: ChartTooltipProps & RefProp<HTMLDivElement>) {
  const interaction = useContext(ChartInteractionContext);
  if (!interaction) throw new Error("ChartTooltip must be rendered inside a chart root.");
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
      <div
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
        data-slot={dataSlot(props, "chart-tooltip")}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (!event.defaultPrevented) interaction.cancelHoverClear();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          const hoveredKey = interaction.hoveredKey;
          if (!event.defaultPrevented && hoveredKey) interaction.scheduleHoverClear(hoveredKey);
        }}
      >
        {activeDetails &&
          (children ? resolveChildren(children, activeDetails) : activeDetails.label)}
      </div>
    </>
  );
}
