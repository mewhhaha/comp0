import { type JsonValue } from "../../src/json/parse.js";

/** A dashboard: metrics, one of every chart, a table, and tabs of detail. */
export const dashboard: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "Product dashboard", level: 1 },
    {
      type: "Grid",
      columns: 2,
      gap: "md",
      children: [
        {
          type: "Card",
          title: "Revenue",
          description: "Quarter to date",
          tone: "accent",
          children: [
            {
              type: "Text",
              text: "$57k this quarter, up 36 percent.",
              tone: "success",
              size: "lg",
            },
          ],
        },
        {
          type: "Card",
          title: "Active users",
          children: [{ type: "Text", text: "12,400 weekly active users." }],
        },
        {
          type: "Card",
          title: "Uptime",
          children: [
            {
              type: "Meter",
              label: "Uptime this month",
              value: 99.95,
              min: 99,
              max: 100,
              low: 99.5,
              high: 99.9,
              optimum: 100,
            },
          ],
        },
        {
          type: "Card",
          title: "Import",
          children: [
            { type: "ProgressBar", label: "Importing customers", value: 64 },
            { type: "ProgressBar", label: "Waiting for the queue" },
          ],
        },
      ],
    },
    {
      type: "Grid",
      columns: 2,
      gap: "lg",
      children: [
        {
          type: "BarChart",
          title: "Revenue by region",
          data: [
            { label: "North", value: 40 },
            { label: "South", value: 25 },
            { label: "East", value: 18 },
            { label: "West", value: 12 },
          ],
          description: "North earns the most.",
          categoryLabel: "Region",
          valueLabel: "Revenue",
          unit: "k",
        },
        {
          type: "ColumnChart",
          title: "Revenue by quarter",
          data: [
            { label: "Q1", value: 18 },
            { label: "Q2", value: 31 },
            { label: "Q3", value: 42 },
            { label: "Q4", value: 57 },
          ],
          description: "Every quarter beat the last.",
          categoryLabel: "Quarter",
          valueLabel: "Revenue",
          unit: "k",
        },
        {
          type: "LineChart",
          title: "Weekly signups",
          data: [
            { x: 1, y: 120 },
            { x: 2, y: 150 },
            { x: 3, y: 90 },
            { x: 4, y: 210 },
          ],
          description: "Week 3 dipped during the outage.",
          xLabel: "Week",
          yLabel: "Signups",
        },
        {
          type: "AreaChart",
          title: "Cumulative users",
          data: [
            { x: 1, y: 120 },
            { x: 2, y: 270 },
            { x: 3, y: 360 },
            { x: 4, y: 570 },
          ],
          description: "Growth is steady.",
          xLabel: "Week",
          yLabel: "Users",
        },
        {
          type: "PieChart",
          title: "Traffic sources",
          data: [
            { label: "Direct", value: 45 },
            { label: "Search", value: 35 },
            { label: "Referral", value: 20 },
          ],
          description: "Direct visits lead.",
          categoryLabel: "Source",
          valueLabel: "Share",
          unit: "%",
        },
      ],
    },
    {
      type: "Tabs",
      label: "Dashboard details",
      tabs: [
        {
          label: "Revenue",
          children: [
            {
              type: "Table",
              caption: "Revenue by quarter",
              columns: ["Quarter", "Revenue", "Growth", "On target"],
              rows: [
                ["Q1", 18, "n/a", true],
                ["Q2", 31, "72%", true],
                ["Q3", 42, "35%", false],
                ["Q4", 57, "36%", true],
              ],
            },
          ],
        },
        {
          label: "Notes",
          children: [
            {
              type: "Accordion",
              items: [
                {
                  title: "Method",
                  open: true,
                  children: [{ type: "Text", text: "Revenue is recognized monthly." }],
                },
                {
                  title: "Caveats",
                  children: [{ type: "List", items: ["Excludes refunds", "In US dollars"] }],
                },
              ],
            },
          ],
        },
        {
          label: "Report",
          children: [
            {
              type: "Image",
              src: "/reports/q4.png",
              alt: "Revenue climbing from 18k to 57k across four quarters",
              caption: "Revenue by quarter",
            },
            { type: "Link", label: "Open the full report", href: "https://example.com/report" },
          ],
        },
      ],
    },
    {
      type: "Stack",
      children: [
        {
          type: "Alert",
          message: "The import is still running.",
          tone: "warning",
          title: "Heads up",
        },
        { type: "Separator", orientation: "horizontal" },
        { type: "Text", text: "Updated a minute ago.", tone: "muted", size: "sm" },
      ],
    },
  ],
};
