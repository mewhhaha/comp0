import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { componentBySlug } from "../../content/catalog.js";
import { Anatomy } from "./Anatomy.js";

describe("Anatomy", () => {
  it("nests GridList row controls inside GridListItem", () => {
    const gridList = componentBySlug.get("grid-list");
    if (!gridList) throw new Error("Grid List documentation is missing.");

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<Anatomy parts={gridList.parts} />);

    const partName = (name: string) =>
      [...container.querySelectorAll("span")].find(
        (element) => element.classList.contains("font-mono") && element.textContent === name,
      );
    const partPin = (name: string) => {
      const number = gridList.parts.findIndex((part) => part.name === name) + 1;
      return [...container.querySelectorAll("[aria-hidden=true] span")].find(
        (element) =>
          element.classList.contains("font-mono") && element.textContent === String(number),
      );
    };
    const gridListItem = partName("GridListItem");
    const dragHandlePin = partPin("GridListDragHandle");
    const moveButtonPin = partPin("GridListMoveButton");

    expect(gridListItem).toBeDefined();
    expect(dragHandlePin).toBeDefined();
    expect(moveButtonPin).toBeDefined();
    expect(gridListItem!.parentElement?.contains(dragHandlePin!)).toBe(true);
    expect(gridListItem!.parentElement?.contains(moveButtonPin!)).toBe(true);
  });

  it("sketches every chart with its own graphic and exact-value table", () => {
    const renderChart = (slug: string) => {
      const chart = componentBySlug.get(slug);
      if (!chart) throw new Error(`${slug} documentation is missing.`);
      const container = document.createElement("div");
      container.innerHTML = renderToStaticMarkup(<Anatomy parts={chart.parts} />);
      return container;
    };

    const barChart = renderChart("bar-chart");
    const columnChart = renderChart("column-chart");
    const lineChart = renderChart("line-chart");
    const areaChart = renderChart("area-chart");
    const pieChart = renderChart("pie-chart");
    const candlestickChart = renderChart("candlestick-chart");

    expect(barChart.querySelectorAll("[style*='width']")).toHaveLength(4);
    expect(columnChart.querySelectorAll("[style*='height']")).toHaveLength(4);
    expect(lineChart.querySelectorAll("svg path")).toHaveLength(1);
    expect(areaChart.querySelectorAll("svg path")).toHaveLength(2);
    expect(pieChart.querySelector("[style*='conic-gradient']")).not.toBeNull();
    expect(candlestickChart.querySelectorAll("svg rect")).toHaveLength(4);

    for (const chart of [barChart, columnChart, lineChart, areaChart, pieChart, candlestickChart]) {
      const chartTable = [...chart.querySelectorAll("span")].find(
        (element) => element.textContent === "ChartTable",
      );
      expect(chartTable?.parentElement?.querySelectorAll("[aria-hidden=true] > span")).toHaveLength(
        6,
      );
    }
  });
});
