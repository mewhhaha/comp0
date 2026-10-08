import { component, p, prop } from "../define.js";

export default component({
  slug: "sankey-chart",
  title: "Sankey Chart",
  group: "charts",
  summary: "A directed flow whose link widths show quantities moving between named stages.",
  analogy:
    "Like streams splitting and rejoining: the channels reveal where volume travels or drops away.",
  whenToUse: "Use it for journeys, transfers, energy, budgets, and other acyclic flows.",
  steps: {
    main: "Start SankeyChart with uniquely identified nodes and positive links between them.",
    supporting:
      "Render links behind SankeyChartNode marks; node arrow keys move upstream, downstream, and within a stage.",
    behavior:
      "Include a native flow table because link widths alone are not an exact or sufficient text alternative.",
    code: '<SankeyChart nodes={nodes} links={links} nodeLabel="Step" valueLabel="People">\n  <ChartTitle>Customer journey</ChartTitle>\n  <SankeyChartPlot aria-label="Sankey chart of the customer journey">\n    {({ links, nodes }) => (\n      <>\n        {links.map((link) => (\n          <SankeyChartLink link={link}>\n            <path d={link.path} />\n          </SankeyChartLink>\n        ))}\n        {nodes.map((node) => (\n          <SankeyChartNode node={node}>\n            <rect x={node.x} y={node.y} width={node.width} height={node.height} />\n          </SankeyChartNode>\n        ))}\n      </>\n    )}\n  </SankeyChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</SankeyChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "SankeyChart",
    "SankeyChartLink",
    "SankeyChartNode",
    "SankeyChartPlot",
  ],
  snippet:
    '<SankeyChart nodes={nodes} links={links} nodeLabel="Step" valueLabel="People"><ChartTitle>Customer journey</ChartTitle><SankeyChartPlot aria-label="Sankey chart of the customer journey">{({ links, nodes }) => <>{links.map((link) => <SankeyChartLink link={link}><path d={link.path} /></SankeyChartLink>)}{nodes.map((node) => <SankeyChartNode node={node}><rect x={node.x} y={node.y} width={node.width} height={node.height} /></SankeyChartNode>)}</>}</SankeyChartPlot><ChartTable /><ChartTooltip /></SankeyChart>',
  parts: [
    p(
      "SankeyChart",
      "root",
      "Native figure validating an acyclic flow and sharing nodes, links, labels, and formatting.",
      true,
      false,
      [
        prop(
          "nodes",
          "readonly SankeyChartNodeValue[]",
          "Uniquely identified, visibly labelled stages.",
        ),
        prop(
          "links",
          "readonly SankeyChartLinkValue[]",
          "Positive directed flows between known nodes.",
        ),
        prop(
          "nodeLabel / valueLabel",
          "string",
          "Visible headings for node and flow table values.",
        ),
        prop("formatValue", "(value: number) => string", "Formats node totals and table cells."),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "SankeyChartPlot / SankeyChartLink / SankeyChartNode",
      "graphic",
      "Layered SVG nodes connected by proportional-width flow paths.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the flow and quantity."),
        prop(
          "children",
          "(state: SankeyChartPlotState) => ReactNode",
          "Custom renderer receiving positioned nodes and links.",
        ),
        prop(
          "link",
          "SankeyChartLinkState",
          "Link state passed to the visual SankeyChartLink wrapper.",
        ),
        prop(
          "node",
          "SankeyChartNodeState",
          "Node state passed to the keyboard-reachable SankeyChartNode.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing important movement or loss."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional incoming and outgoing node detail shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current node and leaves with one more Tab.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Moves upstream or downstream along a connected flow.",
    },
    { keys: ["ArrowUp", "ArrowDown"], action: "Moves between nodes in the same stage." },
    { keys: ["Home", "End"], action: "Moves to the first or last node." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-connected]",
      on: "SankeyChartLink",
      meaning: "The link touches the active node.",
    },
    {
      attribute: "[data-layer]",
      on: "SankeyChartNode",
      meaning: "The node's zero-based flow stage.",
    },
    {
      attribute: "[data-active]",
      on: "SankeyChartNode",
      meaning: "The node currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A node tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Give the plot an aria-label naming the flow and population or quantity.",
    "Keep links behind nodes and increase connected-link contrast when a node is active.",
    "Wrap nodes in SankeyChartNode; left and right move along connected flows while up and down move within a stage.",
    "Each node announces incoming and outgoing totals and connection counts.",
    "Include a native table listing every source, target, and exact flow value.",
    "Do not encode flow meaning through color alone.",
  ],
  related: ["heatmap-chart", "tree", "table"],
});
