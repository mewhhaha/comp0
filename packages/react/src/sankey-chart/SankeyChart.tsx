import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { sankeyChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type SankeyChartLinkValue, type SankeyChartNodeValue } from "../chart/chart-shared.js";

export type SankeyChartProps = ComponentProps<"figure"> &
  AsProp & {
    nodes: readonly SankeyChartNodeValue[];
    links: readonly SankeyChartLinkValue[];
    nodeLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function SankeyChart({
  nodes,
  links,
  nodeLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: SankeyChartProps) {
  const warn = useWarnOnce();
  const context = sankeyChartContext(warn, nodes, links, nodeLabel, valueLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
