import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  SankeyChart,
  SankeyChartLink,
  SankeyChartNode,
  SankeyChartPlot,
} from "@comp0/react";

const journeyNodes = [
  { id: "visit", label: "Site visit" },
  { id: "browse", label: "Browse products" },
  { id: "search", label: "Use search" },
  { id: "cart", label: "Add to cart" },
  { id: "leave", label: "Leave site" },
  { id: "purchase", label: "Purchase" },
] as const;

const journeyLinks = [
  { source: "visit", target: "browse", value: 62 },
  { source: "visit", target: "search", value: 38 },
  { source: "browse", target: "cart", value: 31 },
  { source: "browse", target: "leave", value: 31 },
  { source: "search", target: "cart", value: 24 },
  { source: "search", target: "leave", value: 14 },
  { source: "cart", target: "purchase", value: 43 },
  { source: "cart", target: "leave", value: 12 },
] as const;

const nodeColors = [
  "fill-teal-700 dark:fill-teal-300",
  "fill-sky-600 dark:fill-sky-400",
  "fill-violet-600 dark:fill-violet-400",
  "fill-amber-500 dark:fill-amber-400",
  "fill-rose-500 dark:fill-rose-400",
  "fill-emerald-600 dark:fill-emerald-400",
] as const;

const linkColors: Record<string, string> = {
  visit:
    "stroke-teal-700/45 data-connected:stroke-teal-700/80 dark:stroke-teal-300/35 dark:data-connected:stroke-teal-300/75",
  browse:
    "stroke-sky-600/45 data-connected:stroke-sky-600/80 dark:stroke-sky-400/35 dark:data-connected:stroke-sky-400/75",
  search:
    "stroke-violet-600/45 data-connected:stroke-violet-600/80 dark:stroke-violet-400/35 dark:data-connected:stroke-violet-400/75",
  cart: "stroke-amber-500/45 data-connected:stroke-amber-500/80 dark:stroke-amber-400/35 dark:data-connected:stroke-amber-400/75",
  leave:
    "stroke-rose-500/45 data-connected:stroke-rose-500/80 dark:stroke-rose-400/35 dark:data-connected:stroke-rose-400/75",
  purchase:
    "stroke-emerald-600/45 data-connected:stroke-emerald-600/80 dark:stroke-emerald-400/35 dark:data-connected:stroke-emerald-400/75",
};

const formatPeople = (value: number) => `${value}k`;

export function Example() {
  return (
    <SankeyChart
      nodes={journeyNodes}
      links={journeyLinks}
      nodeLabel="Journey step"
      valueLabel="People"
      formatValue={formatPeople}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Customer journey
      </ChartTitle>
      <SankeyChartPlot
        aria-label="Sankey chart showing customer movement from site visit to purchase or exit"
        className="mx-auto mt-5 w-full max-w-xl overflow-visible"
      >
        {({ links, nodes }) => (
          <>
            <g role="presentation" data-slot="sankey-chart-links">
              {links.map((link) => {
                const targetColor = linkColors[link.value.target] ?? "stroke-zinc-400/45";
                return (
                  <SankeyChartLink key={link.index} link={link} className={targetColor}>
                    <path d={link.path} fill="none" strokeWidth={link.width} />
                  </SankeyChartLink>
                );
              })}
            </g>
            <g role="presentation" data-slot="sankey-chart-nodes">
              {nodes.map((node) => (
                <SankeyChartNode key={node.value.id} node={node} className="group outline-none">
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    className={`${nodeColors[journeyNodes.findIndex((value) => value.id === node.value.id)]} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
                    rx="1"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </SankeyChartNode>
              ))}
            </g>
            <g aria-hidden="true" pointerEvents="none" data-slot="sankey-chart-labels">
              {nodes.map((node) => (
                <text
                  key={node.value.id}
                  x={node.x < 60 ? node.x : node.x + node.width}
                  y={node.y - 1.5}
                  textAnchor={node.x < 60 ? "start" : "end"}
                  className="fill-zinc-700 text-[3px] dark:fill-zinc-300"
                >
                  {node.value.label}
                </text>
              ))}
            </g>
          </>
        )}
      </SankeyChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Search visitors reach the cart at a higher rate, while 43 thousand people complete a
        purchase.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Customer journey flows</caption>
        <thead>
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">People</th>
          </tr>
        </thead>
        <tbody>
          {journeyLinks.map((link) => (
            <tr key={`${link.source}-${link.target}`}>
              <th scope="row">{journeyNodes.find((node) => node.id === link.source)?.label}</th>
              <td>{journeyNodes.find((node) => node.id === link.target)?.label}</td>
              <td>{formatPeople(link.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip
        placement="right"
        className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950"
      >
        {(details) => {
          if (details.kind !== "sankey") return details.label;
          return `${details.value.label}: ${details.formattedIncoming} in, ${details.formattedOutgoing} out`;
        }}
      </ChartTooltip>
    </SankeyChart>
  );
}
