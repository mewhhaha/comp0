import { type JsonValue } from "../../src/json/parse.js";

/** A live view: a control feeds a host tool through a Query, and a chart shows the result. */
export const liveExplorer: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "Weekly forecast", level: 2 },
    {
      type: "Select",
      label: "City",
      name: "city",
      options: ["Oslo", "Lisbon", "Tokyo"],
      value: { $bind: "city", initial: "Oslo" },
    },
    { type: "Query", tool: "forecast", args: { city: { $bind: "city" } }, into: "forecast" },
    {
      type: "LineChart",
      title: "Daily high",
      data: { $bind: "forecast" },
      description: "Highs for the next seven days in the chosen city.",
      xLabel: "Day",
      yLabel: "Degrees Celsius",
    },
    { type: "Slot", name: "map" },
    {
      type: "Button",
      label: "Refresh the forecast",
      action: [
        { call: "forecast", args: { city: { $bind: "city" } }, into: "forecast" },
        { send: "I refreshed the forecast." },
      ],
    },
  ],
};
