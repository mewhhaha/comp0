import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createRequiredContext } from "../internal/context.js";
import { type ChartValueDetails } from "./chart-value-details.js";

export type ActiveChartValue = {
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

export const [ChartInteractionContext, useChartInteraction, useOptionalChartInteraction] =
  createRequiredContext<ChartInteractionContextValue>("a chart root");

export function useActiveChartValue() {
  return useOptionalChartInteraction()?.active?.details ?? null;
}

export type ChartInteractionProviderProps = {
  children: ReactNode;
};

/** Tracks the hovered and focused chart value so ChartTooltip can follow whichever was reached last. */
export function ChartInteractionProvider({ children }: ChartInteractionProviderProps) {
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
