import { useCollection, type Collection, type CollectionItem } from "@comp0/core";
import { useState, type ReactNode } from "react";
import { createRequiredContext } from "../internal/context.js";

type ChartNavigationContextValue = {
  /** The plot's marks in document order; each ChartValue registers itself. */
  collection: Collection<CollectionItem<SVGElement>>;
  getTargetIndex?: ((currentIndex: number, key: string) => number | undefined) | undefined;
  loop: boolean;
  overlayElement: SVGGElement | null;
  orientation: "horizontal" | "vertical" | "both";
  setTabStopIndex: (index: number) => void;
  tabStopIndex: number;
};

export const [ChartNavigationContext, useChartNavigation] =
  createRequiredContext<ChartNavigationContextValue>("a chart plot");

export type ChartNavigationProviderProps = {
  children: ReactNode;
  count: number;
  getTargetIndex?: ChartNavigationContextValue["getTargetIndex"];
  loop?: boolean | undefined;
  orientation: ChartNavigationContextValue["orientation"];
  paintActiveLast?: boolean | undefined;
};

/** One roving tab stop across a plot's values, plus the overlay that paints the active value last. */
export function ChartNavigationProvider({
  children,
  count,
  getTargetIndex,
  loop = false,
  orientation,
  paintActiveLast = true,
}: ChartNavigationProviderProps) {
  const collection = useCollection<CollectionItem<SVGElement>>();
  const [tabStopIndex, setTabStopIndex] = useState(0);
  const [overlayElement, setOverlayElement] = useState<SVGGElement | null>(null);
  const resolvedTabStopIndex = tabStopIndex < count ? tabStopIndex : 0;
  return (
    <ChartNavigationContext
      value={{
        collection,
        getTargetIndex,
        loop,
        overlayElement,
        orientation,
        setTabStopIndex,
        tabStopIndex: resolvedTabStopIndex,
      }}
    >
      {children}
      {paintActiveLast && (
        <g
          ref={setOverlayElement}
          aria-hidden="true"
          pointerEvents="none"
          data-slot="chart-active-value-overlay"
        />
      )}
    </ChartNavigationContext>
  );
}
