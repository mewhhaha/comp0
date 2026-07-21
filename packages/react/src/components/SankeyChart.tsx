import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import {
  type ChartContextValue,
  type SankeyChartLinkValue,
  type SankeyChartNodeValue,
} from "./chart-shared.js";

export type SankeyChartProps = HTMLAttributes<HTMLElement> & {
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
}: SankeyChartProps & RefProp<HTMLElement>) {
  if (!nodeLabel.trim()) throw new Error("SankeyChart node label must not be empty.");
  if (!valueLabel.trim()) throw new Error("SankeyChart value label must not be empty.");
  const nodesById = new Map<string, SankeyChartNodeValue>();
  for (const [index, node] of nodes.entries()) {
    if (!node.id.trim() || !node.label.trim()) {
      throw new Error(`SankeyChart node at index ${index} must have a non-empty id and label.`);
    }
    if (nodesById.has(node.id)) throw new Error(`SankeyChart node id "${node.id}" is duplicated.`);
    nodesById.set(node.id, node);
  }
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  for (const [index, link] of links.entries()) {
    if (!nodesById.has(link.source) || !nodesById.has(link.target)) {
      throw new Error(
        `SankeyChart link at index ${index} references unknown nodes source="${link.source}", target="${link.target}".`,
      );
    }
    if (link.source === link.target) {
      throw new Error(
        `SankeyChart link at index ${index} cannot connect node "${link.source}" to itself.`,
      );
    }
    if (!Number.isFinite(link.value) || link.value <= 0) {
      throw new Error(
        `SankeyChart link from "${link.source}" to "${link.target}" must have a finite positive value; received ${link.value}.`,
      );
    }
    outgoing.get(link.source)?.push(link.target);
    indegree.set(link.target, (indegree.get(link.target) ?? 0) + 1);
  }
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) break;
    visited += 1;
    for (const target of outgoing.get(id) ?? []) {
      const nextIndegree = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, nextIndegree);
      if (nextIndegree === 0) queue.push(target);
    }
  }
  if (visited !== nodes.length) {
    throw new Error("SankeyChart links must form an acyclic flow from left to right.");
  }
  const context: ChartContextValue = {
    kind: "sankey",
    nodes,
    links,
    nodeLabel,
    valueLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
