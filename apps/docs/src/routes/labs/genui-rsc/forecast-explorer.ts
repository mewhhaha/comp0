/** A recorded model response: a control feeds a server tool through a Query into a chart. */
export const forecastExplorer = JSON.stringify({
  type: "Stack",
  children: [
    { type: "Heading", text: "Seven-day forecast", level: 2 },
    {
      type: "Text",
      text: "Pick a city. The chart asks the server for its forecast directly, without another turn.",
    },
    {
      type: "Select",
      label: "City",
      name: "city",
      options: ["Oslo", "Lisbon", "Tokyo", "Nairobi"],
      value: { $bind: "city", initial: "Oslo" },
    },
    { type: "Query", tool: "forecast", args: { city: { $bind: "city" } }, into: "forecast" },
    {
      type: "LineChart",
      title: "Daily high",
      data: { $bind: "forecast" },
      description: "Daily highs for the next seven days in the chosen city.",
      xLabel: "Day",
      yLabel: "Degrees Celsius",
    },
  ],
});
