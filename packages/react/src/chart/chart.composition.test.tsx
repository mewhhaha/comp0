import { act, createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, setup } from "../../test/render.js";
import { AreaChart } from "../area-chart/AreaChart.js";
import { AreaChartPlot } from "../area-chart/AreaChartPlot.js";
import { BarChart } from "../bar-chart/BarChart.js";
import { BarChartPlot } from "../bar-chart/BarChartPlot.js";
import { BoxPlotChart } from "../boxplot-chart/BoxPlotChart.js";
import { BoxPlotChartBox, BoxPlotChartPlot } from "../boxplot-chart/BoxPlotChartPlot.js";
import { CandlestickChart } from "../candlestick-chart/CandlestickChart.js";
import { CandlestickChartPlot } from "../candlestick-chart/CandlestickChartPlot.js";
import { ChartDescription } from "./ChartDescription.js";
import { ChartTable } from "./ChartTable.js";
import { ChartTitle } from "./ChartTitle.js";
import { ColumnChart } from "../column-chart/ColumnChart.js";
import { ColumnChartPlot } from "../column-chart/ColumnChartPlot.js";
import { DumbbellChart } from "../dumbbell-chart/DumbbellChart.js";
import { DumbbellChartDumbbell, DumbbellChartPlot } from "../dumbbell-chart/DumbbellChartPlot.js";
import { LineChart } from "../line-chart/LineChart.js";
import { LineChartPlot } from "../line-chart/LineChartPlot.js";
import { LollipopChart } from "../lollipop-chart/LollipopChart.js";
import { LollipopChartLollipop, LollipopChartPlot } from "../lollipop-chart/LollipopChartPlot.js";
import { OpenToCloseChart } from "../open-to-close-chart/OpenToCloseChart.js";
import {
  OpenToCloseChartPlot,
  OpenToCloseChartRange,
} from "../open-to-close-chart/OpenToCloseChartPlot.js";
import { PieChart } from "../pie-chart/PieChart.js";
import { PieChartPlot } from "../pie-chart/PieChartPlot.js";
import { HistogramChart } from "../histogram-chart/HistogramChart.js";
import { HistogramChartBin, HistogramChartPlot } from "../histogram-chart/HistogramChartPlot.js";

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

  it("renders range, summary, and lollipop marks with named keyboard stops", async () => {
    const { container: dumbbellContainer, user } = setup(
      <DumbbellChart
        values={[
          { label: "Standard", start: 2, end: 8 },
          { label: "Express", start: 4, end: 10 },
        ]}
        categoryLabel="Service"
        valueLabel="Hours"
        formatValue={(value) => `${value}h`}
      >
        <DumbbellChartPlot aria-label="Delivery ranges">
          {(dumbbell) => (
            <DumbbellChartDumbbell dumbbell={dumbbell}>
              <line x1={dumbbell.startX} x2={dumbbell.endX} y1={dumbbell.y} y2={dumbbell.y} />
            </DumbbellChartDumbbell>
          )}
        </DumbbellChartPlot>
      </DumbbellChart>,
    );
    const dumbbells = [
      ...dumbbellContainer.querySelectorAll<SVGGElement>("[data-slot='dumbbell-chart-dumbbell']"),
    ];
    expect(dumbbells).toHaveLength(2);
    expect(dumbbells[0]?.getAttribute("aria-label")).toBe(
      "Service: Standard, Hours Start: 2h, Hours End: 8h",
    );
    act(() => dumbbells[0]!.focus());
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(dumbbells[1]);

    const { container: boxContainer } = render(
      <BoxPlotChart
        values={[{ label: "Read", min: 1, q1: 2, median: 3, q3: 4, max: 6 }]}
        categoryLabel="Operation"
        valueLabel="Latency"
      >
        <BoxPlotChartPlot aria-label="Latency spread">
          {(box) => (
            <BoxPlotChartBox box={box}>
              <rect x={box.x} y={box.q3Y} width={box.width} height={box.q1Y - box.q3Y} />
            </BoxPlotChartBox>
          )}
        </BoxPlotChartPlot>
      </BoxPlotChart>,
    );
    expect(
      boxContainer.querySelector("[data-slot='boxplot-chart-box']")?.getAttribute("aria-label"),
    ).toBe(
      "Operation: Read, Latency min: 1, Latency first quartile: 2, Latency median: 3, Latency third quartile: 4, Latency max: 6",
    );

    const { container: openToCloseContainer } = render(
      <OpenToCloseChart
        values={[
          { x: 1, open: 10, close: 12 },
          { x: 2, open: 12, close: 9 },
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        <OpenToCloseChartPlot aria-label="Opening and closing prices">
          {(range) => (
            <OpenToCloseChartRange range={range}>
              <line x1={range.x} x2={range.x} y1={range.openY} y2={range.closeY} />
            </OpenToCloseChartRange>
          )}
        </OpenToCloseChartPlot>
      </OpenToCloseChart>,
    );
    expect(
      [
        ...openToCloseContainer.querySelectorAll<SVGGElement>(
          "[data-slot='open-to-close-chart-range']",
        ),
      ].map((range) => range.getAttribute("data-direction")),
    ).toEqual(["up", "down"]);

    const { container: lollipopContainer } = render(
      <LollipopChart
        values={[{ label: "Email", value: 82 }]}
        categoryLabel="Feature"
        valueLabel="Adoption"
      >
        <LollipopChartPlot aria-label="Feature adoption">
          {(lollipop) => (
            <LollipopChartLollipop lollipop={lollipop}>
              <circle cx={lollipop.x} cy={lollipop.y} r="2" />
            </LollipopChartLollipop>
          )}
        </LollipopChartPlot>
      </LollipopChart>,
    );
    expect(
      lollipopContainer
        .querySelector("[data-slot='lollipop-chart-lollipop']")
        ?.getAttribute("data-value"),
    ).toBe("82");
  });

  it("derives the missing scale bound for empty plots", () => {
    const { container } = render(
      <BarChart values={[]} categoryLabel="Category" valueLabel="Value">
        <BarChartPlot aria-label="Empty values" xMin={5} />
      </BarChart>,
    );
    expect(container.querySelector("[data-slot='chart-x-axis']")?.textContent).toContain("5");
  });

  it("groups histogram observations into inclusive end bins", () => {
    const { container } = render(
      <HistogramChart values={[0, 1, 2, 3, 4]} valueLabel="Duration" frequencyLabel="Sessions">
        <HistogramChartPlot aria-label="Session duration distribution" binCount={2}>
          {(bin) => (
            <HistogramChartBin key={bin.index} bin={bin}>
              <rect x={bin.x} y={bin.y} width={bin.width} height={bin.height} />
            </HistogramChartBin>
          )}
        </HistogramChartPlot>
      </HistogramChart>,
    );

    const bins = [...container.querySelectorAll("[data-slot='histogram-chart-bin']")];
    expect(bins.map((bin) => bin.getAttribute("data-count"))).toEqual(["2", "3"]);
    expect(bins[1]?.getAttribute("aria-label")).toBe("Duration: 2 to 4, Sessions: 3");
  });
});
