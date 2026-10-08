import type {
  BoxPlotChartValue,
  CandlestickChartValue,
  CartesianChartValue,
  CategoricalChartValue,
  DumbbellChartValue,
  HeatmapChartValue,
  HistogramBinValue,
  MapChartValue,
  OpenToCloseChartValue,
  SankeyChartLinkValue,
  SankeyChartNodeValue,
  ScatterChartValue,
  StackedChartSegment,
  StackedChartValue,
} from "./chart-shared.js";

/** What a chart value exposes to ChartTooltip and to the tooltip's function children. */
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
    }
  | {
      kind: "scatter";
      index: number;
      label: string;
      value: ScatterChartValue;
      formattedX: string;
      formattedY: string;
    }
  | {
      kind: "dumbbell";
      index: number;
      label: string;
      value: DumbbellChartValue;
      formattedStart: string;
      formattedEnd: string;
    }
  | {
      kind: "boxplot";
      index: number;
      label: string;
      value: BoxPlotChartValue;
      formattedMin: string;
      formattedQ1: string;
      formattedMedian: string;
      formattedQ3: string;
      formattedMax: string;
    }
  | {
      kind: "open-to-close";
      index: number;
      label: string;
      value: OpenToCloseChartValue;
      formattedX: string;
      formattedOpen: string;
      formattedClose: string;
    }
  | {
      kind: "lollipop";
      index: number;
      label: string;
      value: CategoricalChartValue;
      formattedValue: string;
    }
  | {
      kind: "stacked-bar" | "stacked-column";
      index: number;
      label: string;
      value: StackedChartValue;
      segment: StackedChartSegment;
      formattedValue: string;
    }
  | {
      kind: "histogram";
      index: number;
      label: string;
      value: HistogramBinValue;
      formattedMin: string;
      formattedMax: string;
    }
  | {
      kind: "map";
      index: number;
      label: string;
      value: MapChartValue;
      formattedValue: string;
    }
  | {
      kind: "heatmap";
      index: number;
      label: string;
      value: HeatmapChartValue;
      formattedValue: string;
    }
  | {
      kind: "sankey";
      index: number;
      label: string;
      value: SankeyChartNodeValue;
      incoming: readonly SankeyChartLinkValue[];
      outgoing: readonly SankeyChartLinkValue[];
      formattedIncoming: string;
      formattedOutgoing: string;
    };
