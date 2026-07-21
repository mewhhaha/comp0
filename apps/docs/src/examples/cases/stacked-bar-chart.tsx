import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  StackedBarChart,
  StackedBarChartPlot,
  StackedBarChartSegment,
} from "@comp0/react";

const orders = [
  {
    label: "Online",
    segments: [
      { label: "New", value: 48 },
      { label: "Returning", value: 72 },
    ],
  },
  {
    label: "Retail",
    segments: [
      { label: "New", value: 34 },
      { label: "Returning", value: 51 },
    ],
  },
  {
    label: "Partners",
    segments: [
      { label: "New", value: 22 },
      { label: "Returning", value: 28 },
    ],
  },
] as const;

const colors = [
  "bg-teal-600 fill-teal-600 dark:bg-teal-400 dark:fill-teal-400",
  "bg-sky-600 fill-sky-600 dark:bg-sky-400 dark:fill-sky-400",
] as const;

const formatOrders = (value: number) => `${value}k`;

export function Example() {
  return (
    <StackedBarChart
      values={orders}
      categoryLabel="Channel"
      valueLabel="Orders"
      formatValue={formatOrders}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Orders by channel and customer type
      </ChartTitle>
      <div className="mt-3 flex gap-4 text-sm">
        {orders[0].segments.map((segment, index) => (
          <span key={segment.label} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-3 rounded-sm ${colors[index]}`} />
            {segment.label}
          </span>
        ))}
      </div>
      <StackedBarChartPlot
        aria-label="Stacked horizontal bar chart comparing orders by channel and customer type"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(segment) => (
          <StackedBarChartSegment
            key={`${segment.value.label}-${segment.segment.label}`}
            segment={segment}
            className="group outline-none"
          >
            <rect
              x={segment.x}
              y={segment.y}
              width={segment.width}
              height={segment.height}
              className={`${colors[segment.segmentIndex]} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </StackedBarChartSegment>
        )}
      </StackedBarChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Online orders lead both customer groups, and returning customers are the larger segment in
        every channel.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Orders by channel and customer type</caption>
        <thead>
          <tr>
            <th scope="col">Channel</th>
            <th scope="col">New</th>
            <th scope="col">Returning</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((channel) => (
            <tr key={channel.label}>
              <th scope="row">{channel.label}</th>
              {channel.segments.map((segment) => (
                <td key={segment.label}>{formatOrders(segment.value)}</td>
              ))}
              <td>
                {formatOrders(channel.segments.reduce((sum, segment) => sum + segment.value, 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </StackedBarChart>
  );
}
