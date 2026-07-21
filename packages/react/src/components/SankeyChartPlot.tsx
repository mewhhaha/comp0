import { dataAttr } from "@comp0/core";
import { type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartNavigationProvider, ChartValue, useActiveChartValue } from "./chart-interaction.js";
import {
  type SankeyChartLinkValue,
  type SankeyChartNodeValue,
  useChartContext,
} from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named flow and individually named interactive nodes. */

export type SankeyChartNodeState = {
  value: SankeyChartNodeValue;
  index: number;
  layer: number;
  x: number;
  y: number;
  width: number;
  height: number;
  incoming: readonly SankeyChartLinkValue[];
  outgoing: readonly SankeyChartLinkValue[];
};

export type SankeyChartLinkState = {
  value: SankeyChartLinkValue;
  index: number;
  path: string;
  width: number;
  source: SankeyChartNodeState;
  target: SankeyChartNodeState;
};

export type SankeyChartPlotState = {
  nodes: readonly SankeyChartNodeState[];
  links: readonly SankeyChartLinkState[];
};

export type SankeyChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  children?: ((state: SankeyChartPlotState) => ReactNode) | undefined;
};

export type SankeyChartNodeProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  node: SankeyChartNodeState;
  children: ReactNode;
};

export function SankeyChartNode({
  node,
  ref,
  ...props
}: SankeyChartNodeProps & RefProp<SVGGElement>) {
  const context = useChartContext("SankeyChartNode", "SankeyChart");
  if (context.kind !== "sankey") {
    throw new Error("SankeyChartNode must be rendered inside SankeyChart.");
  }
  const incomingTotal = node.incoming.reduce((sum, link) => sum + link.value, 0);
  const outgoingTotal = node.outgoing.reduce((sum, link) => sum + link.value, 0);
  const formattedIncoming = context.formatY(incomingTotal);
  const formattedOutgoing = context.formatY(outgoingTotal);
  return (
    <ChartValue
      {...props}
      ref={ref}
      pointerEvents={props.pointerEvents ?? "bounding-box"}
      details={{
        kind: "sankey",
        index: node.index,
        label: `${context.nodeLabel}: ${node.value.label}, Incoming ${context.valueLabel}: ${formattedIncoming} across ${node.incoming.length} connections, Outgoing ${context.valueLabel}: ${formattedOutgoing} across ${node.outgoing.length} connections`,
        value: node.value,
        incoming: node.incoming,
        outgoing: node.outgoing,
        formattedIncoming,
        formattedOutgoing,
      }}
      fallbackSlot="sankey-chart-node"
      data-layer={node.layer}
      data-node-id={node.value.id}
    />
  );
}

export type SankeyChartLinkProps = Omit<SVGAttributes<SVGGElement>, "children"> & {
  link: SankeyChartLinkState;
  children: ReactNode;
};

export function SankeyChartLink({
  link,
  ref,
  ...props
}: SankeyChartLinkProps & RefProp<SVGGElement>) {
  const context = useChartContext("SankeyChartLink", "SankeyChart");
  const active = useActiveChartValue();
  if (context.kind !== "sankey") {
    throw new Error("SankeyChartLink must be rendered inside SankeyChart.");
  }
  const connected =
    active?.kind === "sankey" &&
    (active.value.id === link.value.source || active.value.id === link.value.target);
  return (
    <g
      {...props}
      ref={ref}
      aria-hidden="true"
      pointerEvents="none"
      data-connected={dataAttr(connected)}
      data-slot={dataSlot(props, "sankey-chart-link")}
      data-source={link.value.source}
      data-target={link.value.target}
      data-value={link.value.value}
    />
  );
}

export function SankeyChartPlot({
  children,
  ref,
  ...props
}: SankeyChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("SankeyChartPlot", "SankeyChart");
  if (context.kind !== "sankey") {
    throw new Error("SankeyChartPlot must be rendered inside SankeyChart.");
  }
  const incomingByNode = new Map(
    context.nodes.map((node) => [node.id, context.links.filter((link) => link.target === node.id)]),
  );
  const outgoingByNode = new Map(
    context.nodes.map((node) => [node.id, context.links.filter((link) => link.source === node.id)]),
  );
  const layers = new Map(context.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < context.nodes.length; pass += 1) {
    for (const link of context.links) {
      layers.set(
        link.target,
        Math.max(layers.get(link.target) ?? 0, (layers.get(link.source) ?? 0) + 1),
      );
    }
  }
  const maximumLayer = Math.max(0, ...layers.values());
  const nodesByLayer = Array.from({ length: maximumLayer + 1 }, (_, layer) =>
    context.nodes.filter((node) => layers.get(node.id) === layer),
  );
  const nodeTotals = new Map(
    context.nodes.map((node) => {
      const incoming = (incomingByNode.get(node.id) ?? []).reduce(
        (sum, link) => sum + link.value,
        0,
      );
      const outgoing = (outgoingByNode.get(node.id) ?? []).reduce(
        (sum, link) => sum + link.value,
        0,
      );
      return [node.id, Math.max(incoming, outgoing)];
    }),
  );
  const top = 4;
  const bottom = 96;
  const left = 8;
  const right = 112;
  const nodeWidth = 6;
  const nodeGap = 5;
  const scaleCandidates = nodesByLayer
    .map((nodes) => {
      const total = nodes.reduce((sum, node) => sum + (nodeTotals.get(node.id) ?? 0), 0);
      const available = bottom - top - Math.max(0, nodes.length - 1) * nodeGap;
      return total > 0 ? available / total : Number.POSITIVE_INFINITY;
    })
    .filter(Number.isFinite);
  const flowScale = Math.min(...scaleCandidates, 1);
  const nodeStates: SankeyChartNodeState[] = [];
  for (const [layer, nodes] of nodesByLayer.entries()) {
    const heights = nodes.map((node) => Math.max(4, (nodeTotals.get(node.id) ?? 0) * flowScale));
    const groupHeight =
      heights.reduce((sum, height) => sum + height, 0) + Math.max(0, nodes.length - 1) * nodeGap;
    let y = top + (bottom - top - groupHeight) / 2;
    for (const [layerIndex, node] of nodes.entries()) {
      let x = (left + right - nodeWidth) / 2;
      if (maximumLayer > 0) {
        x = left + (layer / maximumLayer) * (right - left - nodeWidth);
      }
      nodeStates.push({
        value: node,
        index: nodeStates.length,
        layer,
        x,
        y,
        width: nodeWidth,
        height: heights[layerIndex] ?? 4,
        incoming: incomingByNode.get(node.id) ?? [],
        outgoing: outgoingByNode.get(node.id) ?? [],
      });
      y += (heights[layerIndex] ?? 4) + nodeGap;
    }
  }
  const nodesById = new Map(nodeStates.map((node) => [node.value.id, node]));
  const incomingOffsets = new Map(
    nodeStates.map((node) => {
      const total = node.incoming.reduce((sum, link) => sum + link.value, 0) * flowScale;
      return [node.value.id, node.y + (node.height - total) / 2];
    }),
  );
  const outgoingOffsets = new Map(
    nodeStates.map((node) => {
      const total = node.outgoing.reduce((sum, link) => sum + link.value, 0) * flowScale;
      return [node.value.id, node.y + (node.height - total) / 2];
    }),
  );
  const linkStates = context.links.map((value, index): SankeyChartLinkState => {
    const source = nodesById.get(value.source)!;
    const target = nodesById.get(value.target)!;
    const width = value.value * flowScale;
    const sourceY = (outgoingOffsets.get(value.source) ?? source.y) + width / 2;
    const targetY = (incomingOffsets.get(value.target) ?? target.y) + width / 2;
    outgoingOffsets.set(value.source, sourceY + width / 2);
    incomingOffsets.set(value.target, targetY + width / 2);
    const sourceX = source.x + source.width;
    const targetX = target.x;
    const middleX = (sourceX + targetX) / 2;
    return {
      value,
      index,
      source,
      target,
      width,
      path: `M ${sourceX} ${sourceY} C ${middleX} ${sourceY}, ${middleX} ${targetY}, ${targetX} ${targetY}`,
    };
  });
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = nodeStates[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    let candidates: SankeyChartNodeState[] = [];
    if (key === "ArrowLeft") {
      candidates = current.incoming.flatMap((link) => {
        const source = nodesById.get(link.source);
        return source ? [source] : [];
      });
    }
    if (key === "ArrowRight") {
      candidates = current.outgoing.flatMap((link) => {
        const target = nodesById.get(link.target);
        return target ? [target] : [];
      });
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      const stage = nodeStates.filter((node) => node.layer === current.layer);
      const stageIndex = stage.indexOf(current);
      const targetStageIndex = key === "ArrowUp" ? stageIndex - 1 : stageIndex + 1;
      const target = stage[targetStageIndex];
      return target?.index ?? currentIndex;
    }
    candidates.sort(
      (first, second) => Math.abs(first.y - current.y) - Math.abs(second.y - current.y),
    );
    return candidates[0]?.index ?? currentIndex;
  };
  const state = { nodes: nodeStates, links: linkStates };

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 100"
      role="group"
      data-slot={dataSlot(props, "sankey-chart-plot")}
    >
      <ChartNavigationProvider
        count={nodeStates.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        {children ? (
          children(state)
        ) : (
          <>
            <g role="presentation" data-slot="sankey-chart-links">
              {linkStates.map((link) => (
                <path
                  key={link.index}
                  aria-hidden="true"
                  d={link.path}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth={link.width}
                />
              ))}
            </g>
            <g role="presentation" data-slot="sankey-chart-nodes">
              {nodeStates.map((node) => (
                <g key={node.value.id} aria-hidden="true" data-slot="sankey-chart-node">
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    fill="currentColor"
                  />
                </g>
              ))}
            </g>
          </>
        )}
      </ChartNavigationProvider>
    </svg>
  );
}
