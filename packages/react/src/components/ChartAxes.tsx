type ChartPlotBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export const chartPlotBounds: ChartPlotBounds = {
  bottom: 94,
  left: 20,
  right: 116,
  top: 4,
} as const;

type ChartTick = {
  label: string;
  position: number;
};

type ChartAxesProps = {
  bounds?: ChartPlotBounds | undefined;
  xGrid?: boolean | undefined;
  xLabel: string;
  xTicks: readonly ChartTick[];
  yGrid?: boolean | undefined;
  yLabel: string;
  yTicks: readonly ChartTick[];
};

export function ChartAxes({
  bounds = chartPlotBounds,
  xGrid = false,
  xLabel,
  xTicks,
  yGrid = true,
  yLabel,
  yTicks,
}: ChartAxesProps) {
  const { bottom, left, right, top } = bounds;
  const width = right - left;
  const height = bottom - top;

  return (
    <g aria-hidden="true" data-slot="chart-axes" fill="currentColor" fontSize="4">
      <g data-slot="chart-y-axis">
        {yTicks.map((tick, index) => {
          const y = bottom - tick.position * height;
          return (
            <g key={`${tick.label}-${index}`}>
              {yGrid && (
                <line
                  x1={left}
                  x2={right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <text x={left - 3} y={y} textAnchor="end" dominantBaseline="middle">
                {tick.label}
              </text>
            </g>
          );
        })}
        <text
          x="5"
          y={top + height / 2}
          textAnchor="middle"
          transform={`rotate(-90 5 ${top + height / 2})`}
        >
          {yLabel}
        </text>
      </g>
      <g data-slot="chart-x-axis">
        <line
          x1={left}
          x2={right}
          y1={bottom}
          y2={bottom}
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
        {xTicks.map((tick, index) => {
          const x = left + tick.position * width;
          return (
            <g key={`${tick.label}-${index}`}>
              {xGrid && (
                <line
                  x1={x}
                  x2={x}
                  y1={top}
                  y2={bottom}
                  stroke="currentColor"
                  strokeOpacity="0.12"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <line
                x1={x}
                x2={x}
                y1={bottom}
                y2={bottom + 2}
                stroke="currentColor"
                vectorEffect="non-scaling-stroke"
              />
              <text x={x} y={bottom + 7} textAnchor="middle">
                {tick.label}
              </text>
            </g>
          );
        })}
        <text x={left + width / 2} y="116" textAnchor="middle">
          {xLabel}
        </text>
      </g>
    </g>
  );
}
