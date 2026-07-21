import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../test/render.js";
import {
  ChartTooltip,
  Heatmap,
  HeatmapCell,
  HeatmapPlot,
  SankeyChart,
  SankeyChartLink,
  SankeyChartNode,
  SankeyChartPlot,
} from "./index.js";

describe("chart browser interactions", () => {
  it("moves through a heatmap as a two-dimensional roving tab stop", async () => {
    const values = [
      { x: "Morning", y: "Monday", value: 4 },
      { x: "Evening", y: "Monday", value: 8 },
      { x: "Morning", y: "Tuesday", value: 6 },
      { x: "Evening", y: "Tuesday", value: 3 },
    ] as const;
    const { unmount } = render(
      <Heatmap values={values} xLabel="Time" yLabel="Day" valueLabel="Requests">
        <HeatmapPlot aria-label="Requests by day and time">
          {(cell) => (
            <HeatmapCell key={`${cell.value.x}-${cell.value.y}`} cell={cell}>
              <rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} />
            </HeatmapCell>
          )}
        </HeatmapPlot>
        <ChartTooltip />
      </Heatmap>,
    );
    const first = page.getByRole("img", {
      name: "Time: Morning, Day: Monday, Requests: 4",
    });

    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(first.element());
    await act(async () => userEvent.keyboard("{ArrowRight}{ArrowDown}"));
    expect(document.activeElement).toBe(
      page.getByRole("img", { name: "Time: Evening, Day: Tuesday, Requests: 3" }).element(),
    );
    await expect
      .element(page.getByRole("tooltip"))
      .toHaveTextContent("Time: Evening, Day: Tuesday, Requests: 3");
    unmount();
  });

  it("moves along sankey connections and highlights links touching the active node", async () => {
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
    const { container, unmount } = render(
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

    await act(async () => userEvent.tab());
    expect(document.activeElement?.getAttribute("data-node-id")).toBe("visit");
    expect(
      container.querySelectorAll("[data-slot='sankey-chart-link'][data-connected]"),
    ).toHaveLength(2);
    await act(async () => userEvent.keyboard("{ArrowRight}"));
    expect(document.activeElement?.getAttribute("data-node-id")).toBe("cart");
    expect(
      container.querySelectorAll("[data-slot='sankey-chart-link'][data-connected]"),
    ).toHaveLength(2);
    unmount();
  });
});
