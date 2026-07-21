import { act, createRef } from "react";
import { describe, expect, it } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { AreaChart } from "./components/AreaChart.js";
import { AreaChartPlot } from "./components/AreaChartPlot.js";
import { BarChart } from "./components/BarChart.js";
import { BarChartBar, BarChartPlot } from "./components/BarChartPlot.js";
import { CandlestickChart } from "./components/CandlestickChart.js";
import { CandlestickChartPlot } from "./components/CandlestickChartPlot.js";
import { ChartDescription } from "./components/ChartDescription.js";
import { ChartLegend } from "./components/ChartLegend.js";
import { ChartTable } from "./components/ChartTable.js";
import { ChartTitle } from "./components/ChartTitle.js";
import { ChartTooltip } from "./components/chart-interaction.js";
import { ColumnChart } from "./components/ColumnChart.js";
import { ColumnChartPlot } from "./components/ColumnChartPlot.js";
import { LineChart } from "./components/LineChart.js";
import { LineChartPlot, LineChartPoint } from "./components/LineChartPlot.js";
import { PieChart } from "./components/PieChart.js";
import { PieChartPlot, PieChartSlice } from "./components/PieChartPlot.js";

const quarterlyRevenue = [
  { label: "First quarter", value: 40 },
  { label: "Second quarter", value: -20 },
] as const;

const revenueTrend = [
  { x: 1, y: 40 },
  { x: 2, y: -20 },
  { x: 4, y: 10 },
] as const;

const sharePrices = [
  { x: 1, open: 100, high: 112, low: 96, close: 108 },
  { x: 2, open: 108, high: 110, low: 90, close: 94 },
] as const;

function firePointerOver(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("pointerover", { bubbles: true }));
  });
}

describe("chart composition", () => {
  it("renders a bar chart as a labelled figure with axes and an exact-value table", () => {
    const chartRef = createRef<HTMLElement>();
    const plotRef = createRef<SVGSVGElement>();
    const { container } = render(
      <BarChart
        ref={chartRef}
        values={quarterlyRevenue}
        categoryLabel="Quarter"
        valueLabel="Revenue"
        formatValue={(value) => `$${value}k`}
      >
        <ChartTitle>Quarterly revenue</ChartTitle>
        <BarChartPlot ref={plotRef} aria-label="Bar chart of quarterly revenue" />
        <ChartDescription>Revenue fell in the second quarter.</ChartDescription>
        <ChartTable>
          <caption>Quarterly revenue values</caption>
          <thead>
            <tr>
              <th scope="col">Quarter</th>
              <th scope="col">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {quarterlyRevenue.map((quarter) => (
              <tr key={quarter.label}>
                <th scope="row">{quarter.label}</th>
                <td>{`$${quarter.value}k`}</td>
              </tr>
            ))}
          </tbody>
        </ChartTable>
      </BarChart>,
    );

    expect(chartRef.current).toBe(container.querySelector("figure"));
    expect(plotRef.current?.getAttribute("role")).toBe("group");
    expect(container.querySelector("figcaption")?.textContent).toBe("Quarterly revenue");
    expect(container.querySelector("[data-slot='chart-x-axis']")?.textContent).toContain("Revenue");
    expect(container.querySelector("[data-slot='chart-y-axis']")?.textContent).toContain("Quarter");
    expect(
      [...container.querySelectorAll("tbody tr")].map((row) =>
        [...row.children].map((cell) => cell.textContent),
      ),
    ).toEqual([
      ["First quarter", "$40k"],
      ["Second quarter", "$-20k"],
    ]);
  });

  it("draws positive and negative horizontal bars from the visible zero baseline", () => {
    const { container } = render(
      <BarChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
        <BarChartPlot aria-label="Revenue bars" />
      </BarChart>,
    );

    const bars = [...container.querySelectorAll("rect")];
    const firstX = Number(bars[0]?.getAttribute("x"));
    const secondX = Number(bars[1]?.getAttribute("x"));
    const secondWidth = Number(bars[1]?.getAttribute("width"));
    expect(firstX).toBeCloseTo(secondX + secondWidth);
    expect(secondX).toBeCloseTo(32);
  });

  it("roves through chart values from one tab stop and exposes formatted labels", () => {
    const { container } = render(
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

    firePointerOver(points[0]!);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Quarter: Q1, Revenue: $40k");
    act(() => points[0]!.focus());
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.textContent).toBe("Quarter: Q1, Revenue: $40k");
    fireKeyDown(points[0]!, "ArrowRight");
    expect(document.activeElement).toBe(points[1]);
    expect(points.map((point) => point.tabIndex)).toEqual([-1, 0, -1]);
    expect(tooltip.textContent).toBe("Quarter: Q2, Revenue: $-20k");
    fireKeyDown(points[1]!, "End");
    expect(document.activeElement).toBe(points[2]);
    fireKeyDown(points[2]!, "ArrowRight");
    expect(document.activeElement).toBe(points[2]);
    fireKeyDown(points[2]!, "Escape");
    expect(tooltip.hidden).toBe(true);
  });

  it("uses vertical arrows for horizontal bar values", () => {
    const { container } = render(
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
    fireKeyDown(bars[0]!, "ArrowRight");
    expect(document.activeElement).toBe(bars[0]);
    fireKeyDown(bars[0]!, "ArrowDown");
    expect(document.activeElement).toBe(bars[1]);
  });

  it("draws positive and negative columns from the visible zero baseline", () => {
    const { container } = render(
      <ColumnChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
        <ColumnChartPlot aria-label="Revenue columns" />
      </ColumnChart>,
    );

    const columns = [...container.querySelectorAll("rect")];
    const firstY = Number(columns[0]?.getAttribute("y"));
    const firstHeight = Number(columns[0]?.getAttribute("height"));
    const secondY = Number(columns[1]?.getAttribute("y"));
    const secondHeight = Number(columns[1]?.getAttribute("height"));
    expect(firstY + firstHeight).toBeCloseTo(secondY);
    expect(secondY + secondHeight).toBeCloseTo(94);
  });

  it("positions line values using their numeric x distances", () => {
    const { container } = render(
      <LineChart
        values={revenueTrend}
        xLabel="Quarter"
        yLabel="Revenue"
        formatX={(value) => `Q${value}`}
      >
        <LineChartPlot aria-label="Quarterly revenue line chart">
          {({ path, points }) => (
            <path d={path} data-points={points.map((point) => point.value.x).join(",")} />
          )}
        </LineChartPlot>
        <ChartTable>
          <caption>Quarterly revenue values</caption>
          <tbody>
            {revenueTrend.map((quarter) => (
              <tr key={quarter.x}>
                <th scope="row">{`Q${quarter.x}`}</th>
                <td>{quarter.y}</td>
              </tr>
            ))}
          </tbody>
        </ChartTable>
      </LineChart>,
    );

    const line = container.querySelector("[data-slot='line-chart-line'] path");
    expect(line?.getAttribute("d")).toMatch(/^M 20 .* L 52 .* L 116 .*/);
    expect(line?.getAttribute("data-points")).toBe("1,2,4");
    expect(container.querySelector("[data-slot='chart-x-axis']")?.textContent).toContain("Q4");
    expect(container.querySelector("tbody")?.textContent).toContain("Q2");
  });

  it("closes an area chart against the visible zero baseline", () => {
    const { container } = render(
      <AreaChart values={revenueTrend} xLabel="Quarter" yLabel="Revenue">
        <AreaChartPlot aria-label="Quarterly revenue area chart">
          {({ areaPath, baseline, linePath }) => (
            <path d={areaPath} data-baseline={baseline} data-line={linePath} />
          )}
        </AreaChartPlot>
      </AreaChart>,
    );

    const area = container.querySelector("[data-slot='area-chart-area'] path");
    expect(Number(area?.getAttribute("data-baseline"))).toBeCloseTo(64);
    expect(area?.getAttribute("data-line")).toMatch(/^M 20 .* L 52 .* L 116 .*/);
    expect(area?.getAttribute("d")).toMatch(/^M 20 64 L 20 .* L 52 .* L 116 .* L 116 64 Z$/);
  });

  it("pairs pie slices with a persistent legend and table", () => {
    const shares = quarterlyRevenue.map((value) => ({ ...value, value: Math.abs(value.value) }));
    const { container } = render(
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
        <ChartLegend />
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
    expect(container.querySelector("[data-slot='chart-legend']")?.textContent).toContain(
      "First quarter40%66.7%",
    );
    expect(container.querySelector("tbody")?.textContent).toContain("Second quarter20%");

    const sliceGroups = [
      ...container.querySelectorAll<SVGGElement>("[data-slot='pie-chart-slice']"),
    ];
    act(() => sliceGroups[0]!.focus());
    fireKeyDown(sliceGroups[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(sliceGroups[1]);
    const activeOutline = container.querySelector("[data-slot='pie-chart-active-slice']");
    expect(activeOutline?.getAttribute("d")).toBe(slices[1]?.getAttribute("d"));
    expect(container.querySelector("[data-slot='pie-chart-slices']")?.nextElementSibling).toBe(
      activeOutline,
    );
    fireKeyDown(sliceGroups[1]!, "ArrowRight");
    expect(document.activeElement).toBe(sliceGroups[0]);
  });

  it("draws a one-value pie as a complete circle", () => {
    const { container } = render(
      <PieChart
        values={[{ label: "Direct", value: 100 }]}
        categoryLabel="Source"
        valueLabel="Share"
      >
        <PieChartPlot aria-label="Traffic share pie chart" />
      </PieChart>,
    );

    const path = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(path.match(/ A 50 50 /g)).toHaveLength(2);
  });

  it("draws rising and falling candlesticks and tabulates every OHLC value", () => {
    const { container } = render(
      <CandlestickChart
        values={sharePrices}
        xLabel="Day"
        yLabel="Share price"
        formatX={(value) => `Day ${value}`}
        formatY={(value) => `$${value}`}
      >
        <CandlestickChartPlot aria-label="Two-day share price candlestick chart" />
        <ChartTable>
          <caption>Daily share prices</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Open</th>
              <th scope="col">High</th>
              <th scope="col">Low</th>
              <th scope="col">Close</th>
            </tr>
          </thead>
          <tbody>
            {sharePrices.map((price) => (
              <tr key={price.x}>
                <th scope="row">{`Day ${price.x}`}</th>
                <td>{`$${price.open}`}</td>
                <td>{`$${price.high}`}</td>
                <td>{`$${price.low}`}</td>
                <td>{`$${price.close}`}</td>
              </tr>
            ))}
          </tbody>
        </ChartTable>
      </CandlestickChart>,
    );

    const candles = [...container.querySelectorAll("[data-slot='candlestick-chart-candle']")];
    expect(candles.map((candle) => candle.getAttribute("data-direction"))).toEqual(["up", "down"]);
    expect(candles[0]?.querySelectorAll("line")).toHaveLength(1);
    expect(candles[0]?.querySelector("rect")).not.toBeNull();
    const candleBodies = [
      ...container.querySelectorAll("[data-slot='candlestick-chart-candle'] rect"),
    ];
    const firstBodyX = Number(candleBodies[0]?.getAttribute("x"));
    const lastBody = candleBodies.at(-1)!;
    const lastBodyRight =
      Number(lastBody.getAttribute("x")) + Number(lastBody.getAttribute("width"));
    expect(firstBodyX).toBeGreaterThanOrEqual(32);
    expect(lastBodyRight).toBeLessThanOrEqual(112);
    expect(
      [...container.querySelectorAll("tbody tr")].map((row) =>
        [...row.children].map((cell) => cell.textContent),
      ),
    ).toEqual([
      ["Day 1", "$100", "$112", "$96", "$108"],
      ["Day 2", "$108", "$110", "$90", "$94"],
    ]);
  });

  it("rejects malformed and unordered chart values at their roots", () => {
    expect(() =>
      render(
        <BarChart
          values={[{ label: "Unknown", value: Number.NaN }]}
          categoryLabel="Quarter"
          valueLabel="Revenue"
        />,
      ),
    ).toThrow('BarChart value "Unknown" must be finite; received NaN.');

    expect(() =>
      render(
        <LineChart
          values={[
            { x: 2, y: 10 },
            { x: 1, y: 20 },
          ]}
          xLabel="Quarter"
          yLabel="Revenue"
        />,
      ),
    ).toThrow("LineChart x values must increase; index 0 is 2 and index 1 is 1.");

    expect(() =>
      render(
        <CandlestickChart
          values={[{ x: 1, open: 100, high: 105, low: 90, close: 110 }]}
          xLabel="Day"
          yLabel="Price"
        />,
      ),
    ).toThrow(
      "CandlestickChart high at index 0 must not be below open or close; received high=105, open=100, close=110.",
    );
  });

  it("throws when a shared or chart-specific part has no matching root", () => {
    expect(() => render(<BarChartPlot aria-label="Orphaned plot" />)).toThrow(
      "BarChartPlot must be rendered inside BarChart.",
    );
    expect(() => render(<ColumnChartPlot aria-label="Orphaned plot" />)).toThrow(
      "ColumnChartPlot must be rendered inside ColumnChart.",
    );
    expect(() => render(<CandlestickChartPlot aria-label="Orphaned plot" />)).toThrow(
      "CandlestickChartPlot must be rendered inside CandlestickChart.",
    );
    expect(() =>
      render(
        <BarChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
          <ChartLegend />
        </BarChart>,
      ),
    ).toThrow("ChartLegend must be rendered inside PieChart.");
    expect(() =>
      render(
        <AreaChart values={revenueTrend} xLabel="Quarter" yLabel="Revenue">
          <LineChartPlot aria-label="Wrong plot" />
        </AreaChart>,
      ),
    ).toThrow("LineChartPlot must be rendered inside LineChart.");
  });
});
