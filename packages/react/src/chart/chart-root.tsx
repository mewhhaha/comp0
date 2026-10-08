import { useState, type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { ChartInteractionProvider } from "./chart-interaction-context.js";
import { ChartMetaContext, type HistogramBinOptions } from "./chart-meta.js";
import { ChartContext, type ChartContextValue } from "./chart-shared.js";

export type ChartFigureProps = ComponentProps<"figure"> &
  AsProp & {
    context: ChartContextValue;
  };

/** The figure every chart root renders: shares the chart data, interaction state, and table hints. */
export function ChartFigure({ as, context, ...props }: ChartFigureProps) {
  const [title, setTitle] = useState<string | null>(null);
  const [histogramBins, setHistogramBins] = useState<HistogramBinOptions | null>(null);
  const Part = partElement(as, "figure");
  return (
    <ChartInteractionProvider>
      <ChartContext value={context}>
        <ChartMetaContext value={{ title, setTitle, histogramBins, setHistogramBins }}>
          <Part data-slot="chart" {...props} />
        </ChartMetaContext>
      </ChartContext>
    </ChartInteractionProvider>
  );
}
