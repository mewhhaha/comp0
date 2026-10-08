import { createRequiredContext } from "../internal/context.js";

export type HistogramBinOptions = {
  binCount: number | undefined;
  xMin: number | undefined;
  xMax: number | undefined;
};

/**
 * What the default ChartTable cannot read from the chart's data: the text of the
 * ChartTitle and, for histograms, how the plot grouped observations into bins.
 * ChartTitle and HistogramChartPlot register these after mount so server and
 * first client renders agree.
 */
export type ChartMetaContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
  histogramBins: HistogramBinOptions | null;
  setHistogramBins: (options: HistogramBinOptions | null) => void;
};

export const [ChartMetaContext, useChartMeta] =
  createRequiredContext<ChartMetaContextValue>("a chart root");
