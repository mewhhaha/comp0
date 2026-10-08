import { act } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { BarChart } from "../bar-chart/BarChart.js";
import { BarChartBar, BarChartPlot } from "../bar-chart/BarChartPlot.js";
import { PieChartLegend } from "../pie-chart/PieChartLegend.js";
import { ChartTable } from "./ChartTable.js";
import { ChartTooltip } from "./ChartTooltip.js";
import { LineChart } from "../line-chart/LineChart.js";
import { LineChartPlot, LineChartPoint } from "../line-chart/LineChartPlot.js";
import { MapChart } from "../map-chart/MapChart.js";
import { MapChartPlot, MapChartRegion } from "../map-chart/MapChartPlot.js";
import { PieChart } from "../pie-chart/PieChart.js";
import { PieChartPlot, PieChartSlice } from "../pie-chart/PieChartPlot.js";
import { HeatmapChart } from "../heatmap-chart/HeatmapChart.js";
import { HeatmapChartCell, HeatmapChartPlot } from "../heatmap-chart/HeatmapChartPlot.js";
import { SankeyChart } from "../sankey-chart/SankeyChart.js";
import {
  SankeyChartLink,
  SankeyChartNode,
  SankeyChartPlot,
} from "../sankey-chart/SankeyChartPlot.js";
import { ScatterChart } from "../scatter-chart/ScatterChart.js";
import { ScatterChartPlot, ScatterChartPoint } from "../scatter-chart/ScatterChartPlot.js";
import { StackedBarChart } from "../stacked-bar-chart/StackedBarChart.js";
import {
  StackedBarChartPlot,
  StackedBarChartSegment,
} from "../stacked-bar-chart/StackedBarChartPlot.js";
import { StackedColumnChart } from "../stacked-column-chart/StackedColumnChart.js";
import {
  StackedColumnChartPlot,
  StackedColumnChartSegment,
} from "../stacked-column-chart/StackedColumnChartPlot.js";

const quarterlyRevenue = [
  { label: "First quarter", value: 40 },
  { label: "Second quarter", value: -20 },
] as const;

const revenueTrend = [
  { x: 1, y: 40 },
  { x: 2, y: -20 },
  { x: 4, y: 10 },
] as const;

describe("chart keyboard navigation", () => {
  it("roves through chart values from one tab stop and exposes formatted labels", async () => {
    const { container, user } = setup(
      <LineChart
        values={revenueTrend}
        xLabel="Quarter"
        yLabel="Revenue"
        formatX={(value) => `Q${value}`}
        formatY={(value) => `$${value}k`}
      >
        <LineChartPlot aria-label="Quarterly revenue line chart">
          {({ path, points }) => (
            <>
              <path aria-hidden="true" d={path} />
              {points.map((point) => (
                <LineChartPoint key={point.index} point={point}>
                  <circle cx={point.x} cy={point.y} r="2" />
                </LineChartPoint>
              ))}
            </>
          )}
        </LineChartPlot>
        <ChartTooltip />
      </LineChart>,
    );

    const points = [...container.querySelectorAll<SVGGElement>("[data-slot='line-chart-point']")];
    const tooltip = container.querySelector<HTMLElement>("[data-slot='chart-tooltip']")!;
    expect(points.map((point) => point.tabIndex)).toEqual([0, -1, -1]);
    expect(points[0]?.getAttribute("aria-label")).toBe("Quarter: Q1, Revenue: $40k");

    await user.hover(points[0]!);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Quarter: Q1, Revenue: $40k");
    act(() => points[0]!.focus());
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Quarter: Q1, Revenue: $40k");
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(points[1]);
    expect(points.map((point) => point.tabIndex)).toEqual([-1, 0, -1]);
    expect(tooltip.textContent).toBe("Quarter: Q2, Revenue: $-20k");
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(points[2]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(points[2]);
    await user.keyboard("{Escape}");
    expect(tooltip.hidden).toBe(true);
  });

  it("uses vertical arrows for horizontal bar values", async () => {
    const { container, user } = setup(
      <BarChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
        <BarChartPlot aria-label="Quarterly revenue bars">
          {(bar) => (
            <BarChartBar bar={bar}>
              <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} />
            </BarChartBar>
          )}
        </BarChartPlot>
      </BarChart>,
    );
    const bars = [...container.querySelectorAll<SVGGElement>("[data-slot='bar-chart-bar']")];
    act(() => bars[0]!.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(bars[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(bars[1]);
  });

  it("pairs pie slices with a persistent legend and table", async () => {
    const shares = quarterlyRevenue.map((value) => ({ ...value, value: Math.abs(value.value) }));
    const { container, user } = setup(
      <PieChart
        values={shares}
        categoryLabel="Quarter"
        valueLabel="Share"
        formatValue={(value) => `${value}%`}
      >
        <PieChartPlot aria-label="Revenue share pie chart">
          {(slice) => (
            <PieChartSlice slice={slice}>
              <path
                d={slice.path}
                data-label={slice.value.label}
                data-percentage={slice.percentage}
              />
            </PieChartSlice>
          )}
        </PieChartPlot>
        <PieChartLegend />
        <ChartTable>
          <caption>Revenue share values</caption>
          <tbody>
            {shares.map((quarter) => (
              <tr key={quarter.label}>
                <th scope="row">{quarter.label}</th>
                <td>{`${quarter.value}%`}</td>
              </tr>
            ))}
          </tbody>
        </ChartTable>
      </PieChart>,
    );

    const slices = [...container.querySelectorAll("[data-slot='pie-chart-slice'] path")];
    for (const slice of slices) expect(slice.getAttribute("d")).not.toMatch(/\.\d{7}/);
    expect(Number(slices[0]?.getAttribute("data-percentage"))).toBeCloseTo(200 / 3);
    expect(Number(slices[1]?.getAttribute("data-percentage"))).toBeCloseTo(100 / 3);
    expect(container.querySelector("[data-slot='pie-chart-legend']")?.textContent).toContain(
      "First quarter40%66.7%",
    );
    expect(container.querySelector("tbody")?.textContent).toContain("Second quarter20%");

    const sliceGroups = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='pie-chart-slice']"),
    ];
    act(() => sliceGroups[0]!.focus());
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(sliceGroups[1]);
    const activeOutline = container.querySelector("[data-slot='pie-chart-active-slice']");
    expect(activeOutline?.getAttribute("d")).toBe(slices[1]?.getAttribute("d"));
    expect(container.querySelector("[data-slot='pie-chart-slices']")?.nextElementSibling).toBe(
      activeOutline,
    );
    expect(container.querySelector("[data-slot='chart-active-value-overlay']")).toBeNull();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(sliceGroups[0]);
  });

  it("positions scatter points independently and moves to the nearest point in a direction", async () => {
    const values = [
      { label: "Alpha", x: 1, y: 1 },
      { label: "Beta", x: 4, y: 2 },
      { label: "Gamma", x: 2, y: 5 },
    ] as const;
    const { container, user } = setup(
      <ScatterChart values={values} xLabel="Effort" yLabel="Impact">
        <ScatterChartPlot aria-label="Effort and impact scatter plot">
          {(point) => (
            <ScatterChartPoint key={point.index} point={point}>
              <circle cx={point.x} cy={point.y} r="2" />
            </ScatterChartPoint>
          )}
        </ScatterChartPlot>
      </ScatterChart>,
    );

    const points = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='scatter-chart-point']"),
    ];
    expect(points[0]?.getAttribute("aria-label")).toBe("Alpha, Effort: 1, Impact: 1");
    expect(points[1]?.querySelector("circle")?.getAttribute("cx")).toBe("116");
    act(() => points[0]!.focus());
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(points[2]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(points[1]);
  });

  it("matches caller-defined map paths to values and navigates by region centers", async () => {
    const values = [
      { id: "west", label: "West", value: 10 },
      { id: "east", label: "East", value: 12 },
    ] as const;
    const regions = [
      { id: "west", d: "M 2 2 H 48 V 48 H 2 Z", centerX: 25, centerY: 25 },
      { id: "east", d: "M 52 2 H 98 V 48 H 52 Z", centerX: 75, centerY: 25 },
    ] as const;
    const { container, user } = setup(
      <MapChart values={values} regionLabel="Region" valueLabel="Votes">
        <MapChartPlot aria-label="Regional votes" viewBox="0 0 100 50" regions={regions}>
          {(region) => (
            <MapChartRegion region={region}>
              <path d={region.region.d} />
            </MapChartRegion>
          )}
        </MapChartPlot>
      </MapChart>,
    );
    const mapRegions = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='map-chart-region']"),
    ];
    expect(mapRegions).toHaveLength(2);
    expect(mapRegions[0]?.getAttribute("role")).toBe("img");
    expect(mapRegions[0]?.getAttribute("aria-label")).toBe("Region: West, Votes: 10");
    expect(mapRegions[1]?.getAttribute("data-region-id")).toBe("east");
    act(() => mapRegions[0]!.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(mapRegions[1]);
  });

  it("composes stacked bar and column segments with two-dimensional arrow navigation", async () => {
    const values = [
      {
        label: "Web",
        segments: [
          { label: "New", value: 30 },
          { label: "Returning", value: 20 },
        ],
      },
      {
        label: "Store",
        segments: [
          { label: "New", value: 10 },
          { label: "Returning", value: 40 },
        ],
      },
    ] as const;
    const { container, user } = setup(
      <>
        <StackedBarChart values={values} categoryLabel="Channel" valueLabel="Orders">
          <StackedBarChartPlot aria-label="Orders by channel and customer type">
            {(segment) => (
              <StackedBarChartSegment
                key={`${segment.value.label}-${segment.segment.label}`}
                segment={segment}
              >
                <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} />
              </StackedBarChartSegment>
            )}
          </StackedBarChartPlot>
        </StackedBarChart>
        <StackedColumnChart values={values} categoryLabel="Channel" valueLabel="Orders">
          <StackedColumnChartPlot aria-label="Orders by channel and customer type">
            {(segment) => (
              <StackedColumnChartSegment
                key={`${segment.value.label}-${segment.segment.label}`}
                segment={segment}
              >
                <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} />
              </StackedColumnChartSegment>
            )}
          </StackedColumnChartPlot>
        </StackedColumnChart>
      </>,
    );

    const bars = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='stacked-bar-chart-segment']"),
    ];
    expect(bars.map((bar) => bar.getAttribute("aria-label"))).toEqual([
      "Channel: Web, Segment: New, Orders: 30",
      "Channel: Web, Segment: Returning, Orders: 20",
      "Channel: Store, Segment: New, Orders: 10",
      "Channel: Store, Segment: Returning, Orders: 40",
    ]);
    act(() => bars[0]!.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(bars[1]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(bars[3]);

    const columns = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='stacked-column-chart-segment']"),
    ];
    act(() => columns[0]!.focus());
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(columns[1]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(columns[3]);
  });

  it("orders heatmap cells into a matrix and follows row and column arrows", async () => {
    const values = [
      { x: "Morning", y: "Monday", value: 4 },
      { x: "Evening", y: "Monday", value: 8 },
      { x: "Morning", y: "Tuesday", value: 6 },
      { x: "Evening", y: "Tuesday", value: 3 },
    ] as const;
    const { container, user } = setup(
      <HeatmapChart
        values={values}
        xLabel="Time"
        yLabel="Day"
        valueLabel="Requests"
        formatValue={(value) => `${value}k`}
      >
        <HeatmapChartPlot aria-label="Requests by day and time">
          {(cell) => (
            <HeatmapChartCell key={`${cell.value.x}-${cell.value.y}`} cell={cell}>
              <rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} />
            </HeatmapChartCell>
          )}
        </HeatmapChartPlot>
      </HeatmapChart>,
    );

    const cells = [...container.querySelectorAll<SVGGElement>("[data-slot='heatmap-chart-cell']")];
    const cellsGroup = container.querySelector("[data-slot='heatmap-chart-cells']");
    const activeOverlay = container.querySelector("[data-slot='chart-active-value-overlay']");
    expect(cells[0]?.getAttribute("aria-label")).toBe("Time: Morning, Day: Monday, Requests: 4k");
    expect(cellsGroup?.nextElementSibling).toBe(activeOverlay);
    act(() => cells[0]!.focus());
    expect(activeOverlay?.querySelector("use")?.getAttribute("href")).toBe(`#${cells[0]!.id}`);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cells[1]);
    expect(activeOverlay?.querySelector("use")?.getAttribute("href")).toBe(`#${cells[1]!.id}`);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[3]);
  });

  it("skips empty heatmap coordinates when moving in a direction", async () => {
    const { container, user } = setup(
      <HeatmapChart
        values={[
          { x: "A", y: "Top", value: 1 },
          { x: "C", y: "Top", value: 2 },
          { x: "A", y: "Bottom", value: 3 },
        ]}
        xLabel="Column"
        yLabel="Row"
        valueLabel="Count"
      >
        <HeatmapChartPlot aria-label="Sparse counts">
          {(cell) => (
            <HeatmapChartCell cell={cell}>
              <rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} />
            </HeatmapChartCell>
          )}
        </HeatmapChartPlot>
      </HeatmapChart>,
    );
    const cells = [...container.querySelectorAll<SVGGElement>("[data-slot='heatmap-chart-cell']")];
    act(() => cells[0]!.focus());
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cells[1]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[1]);
    act(() => cells[0]!.focus());
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[2]);
  });

  it("lays out sankey links behind navigable nodes and highlights connected flows", async () => {
    const nodes = [
      { id: "visit", label: "Visit" },
      { id: "cart", label: "Cart" },
      { id: "leave", label: "Leave" },
      { id: "buy", label: "Purchase" },
    ] as const;
    const links = [
      { source: "visit", target: "cart", value: 60 },
      { source: "visit", target: "leave", value: 40 },
      { source: "cart", target: "buy", value: 35 },
    ] as const;
    const { container, user } = setup(
      <SankeyChart nodes={nodes} links={links} nodeLabel="Step" valueLabel="People">
        <SankeyChartPlot aria-label="Customer journey flow">
          {({ links: positionedLinks, nodes: positionedNodes }) => (
            <>
              {positionedLinks.map((link) => (
                <SankeyChartLink key={link.index} link={link}>
                  <path d={link.path} strokeWidth={link.width} />
                </SankeyChartLink>
              ))}
              {positionedNodes.map((node) => (
                <SankeyChartNode key={node.value.id} node={node}>
                  <rect x={node.x} y={node.y} width={node.width} height={node.height} />
                </SankeyChartNode>
              ))}
            </>
          )}
        </SankeyChartPlot>
      </SankeyChart>,
    );

    const nodesInPlot = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='sankey-chart-node']"),
    ];
    const visit = nodesInPlot.find((node) => node.getAttribute("data-node-id") === "visit")!;
    const cart = nodesInPlot.find((node) => node.getAttribute("data-node-id") === "cart")!;
    expect(visit.getAttribute("aria-label")).toBe(
      "Step: Visit, Incoming People: 0 across 0 connections, Outgoing People: 100 across 2 connections",
    );
    expect(visit.getAttribute("pointer-events")).toBe("bounding-box");
    expect(
      [...container.querySelectorAll("[data-slot='sankey-chart-link']")].every(
        (link) => link.getAttribute("pointer-events") === "none",
      ),
    ).toBe(true);
    act(() => visit.focus());
    const connectedLinks = [
      ...container.querySelectorAll("[data-slot='sankey-chart-link'][data-connected]"),
    ];
    expect(connectedLinks).toHaveLength(2);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cart);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(visit);
  });
});
