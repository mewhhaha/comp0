import { dataAttr } from "@comp0/core";
import { useWarnOnce } from "../internal/dev.js";
import { type ReactNode, type ComponentProps } from "react";
import { useActiveChartValue } from "../chart/chart-interaction-context.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import {
  type SankeyChartLinkValue,
  type SankeyChartNodeValue,
  useChartKind,
} from "../chart/chart-shared.js";

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

export type SankeyChartNodeProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  node: SankeyChartNodeState;
  children: ReactNode;
};

export function SankeyChartNode({ node, ref, ...props }: SankeyChartNodeProps) {
  const context = useChartKind("SankeyChartNode", "SankeyChart", "sankey");
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

export type SankeyChartLinkProps = Omit<ComponentProps<"g">, "children"> & {
  link: SankeyChartLinkState;
  children: ReactNode;
};

export function SankeyChartLink({ link, ref, ...props }: SankeyChartLinkProps) {
  useChartKind("SankeyChartLink", "SankeyChart", "sankey");
  const active = useActiveChartValue();
  const connected =
    active?.kind === "sankey" &&
    (active.value.id === link.value.source || active.value.id === link.value.target);
  return (
    <g
      data-slot="sankey-chart-link"
      {...props}
      ref={ref}
      aria-hidden="true"
      pointerEvents="none"
      data-connected={dataAttr(connected)}
      data-source={link.value.source}
      data-target={link.value.target}
      data-value={link.value.value}
    />
  );
}

export type SankeyChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  children?: ((state: SankeyChartPlotState) => ReactNode) | undefined;
};

export function SankeyChartPlot({ children, ref, ...props }: SankeyChartPlotProps) {
  const context = useChartKind("SankeyChartPlot", "SankeyChart", "sankey");
  const warn = useWarnOnce();
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
      if (!Number.isFinite(incoming) || !Number.isFinite(outgoing)) {
        warn(
          `SankeyChartPlot:node-flow:${node.id}`,
          `SankeyChartPlot node "${node.id}" aggregate flow must be finite; received incoming=${incoming}, outgoing=${outgoing}. The node was drawn at its minimum size.`,
        );
        return [node.id, 0];
      }
      return [node.id, Math.max(incoming, outgoing)];
    }),
  );
  const top = 4;
  const bottom = 96;
  const left = 8;
  const right = 112;
  const nodeWidth = 6;
  const nodeGap = 5;
  const availableHeight = bottom - top;
  const scaleCandidates = nodesByLayer
    .map((nodes) => {
      const total = nodes.reduce((sum, node) => sum + (nodeTotals.get(node.id) ?? 0), 0);
      if (!Number.isFinite(total)) {
        warn(
          `SankeyChartPlot:layer-flow:${total}`,
          `SankeyChartPlot layer flow must be finite; received ${total}. The layer was ignored when sizing flows.`,
        );
        return Number.POSITIVE_INFINITY;
      }
      const available = availableHeight - Math.max(0, nodes.length - 1) * nodeGap;
      return total > 0 ? available / total : Number.POSITIVE_INFINITY;
    })
    .filter(Number.isFinite);
  const flowScale = Math.max(0, Math.min(...scaleCandidates, 1));
  const nodeStates: SankeyChartNodeState[] = [];
  for (const [layer, nodes] of nodesByLayer.entries()) {
    let layerGap = nodeGap;
    let heights = nodes.map((node) => Math.max(4, (nodeTotals.get(node.id) ?? 0) * flowScale));
    let groupHeight =
      heights.reduce((sum, height) => sum + height, 0) + Math.max(0, nodes.length - 1) * layerGap;
    if (groupHeight > availableHeight) {
      warn(
        `SankeyChartPlot:layer-height:${layer}:${nodes.length}`,
        `SankeyChartPlot layer ${layer} with ${nodes.length} nodes exceeds the available height of ${availableHeight}. Its nodes and gaps were shrunk to fit.`,
      );
      const shrink = availableHeight / groupHeight;
      layerGap *= shrink;
      heights = heights.map((height) => height * shrink);
      groupHeight = availableHeight;
    }
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
      y += (heights[layerIndex] ?? 4) + layerGap;
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
  let content: ReactNode = (
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
  );
  if (children) content = children(state);

  return (
    <svg data-slot="sankey-chart-plot" {...props} ref={ref} viewBox="0 0 120 100" role="group">
      <ChartNavigationProvider
        count={nodeStates.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        {content}
      </ChartNavigationProvider>
    </svg>
  );
}
