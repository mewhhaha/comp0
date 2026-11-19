// Recorded JSON responses, as a model would write them against the @comp0/genui catalog.
// The demo replays them token by token; nothing here talks to a model or the network.
export type DemoResponse = {
  id: string;
  title: string;
  prompt: string;
  response: string;
};

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export const demoResponses = [
  {
    id: "comparison",
    title: "Comparison",
    prompt: "Starter or Pro: which plan fits a team of five?",
    response: json({
      type: "Stack",
      children: [
        {
          type: "Text",
          text: "Pro fits a team of five: Starter allows one seat, and Pro adds review workflows and an audit log.",
        },
        {
          type: "Table",
          caption: "Starter and Pro compared",
          columns: ["Feature", "Starter", "Pro"],
          rows: [
            ["Projects", "3", "Unlimited"],
            ["Seats", "1", "Up to 25"],
            ["Audit log", "No", "Yes"],
            ["Price per seat", "$0", "$12 per month"],
          ],
        },
        {
          type: "Alert",
          title: "Billing",
          tone: "info",
          message:
            "Pro bills per seat each month. For five seats that is $60, and you can switch back at any time.",
        },
        {
          type: "Stack",
          direction: "row",
          children: [
            {
              type: "Button",
              label: "Stay on Starter",
              variant: "secondary",
              message: "I will stay on Starter",
            },
            {
              type: "Button",
              label: "Upgrade to Pro",
              variant: "primary",
              message: "Upgrade us to Pro",
            },
          ],
        },
      ],
    }),
  },
  {
    id: "form",
    title: "Form",
    prompt: "Book me a table for Saturday.",
    response: json({
      type: "Stack",
      children: [
        { type: "Text", text: "A few details and I can request a table for you." },
        {
          type: "Form",
          name: "booking",
          title: "Book a table",
          submitLabel: "Request table",
          children: [
            {
              type: "TextField",
              label: "Full name",
              name: "name",
              required: true,
              placeholder: "Jane Doe",
            },
            {
              type: "NumberField",
              label: "Guests",
              name: "guests",
              value: 2,
              min: 1,
              max: 12,
              step: 1,
              required: true,
            },
            {
              type: "DatePicker",
              label: "Date",
              name: "date",
              value: "2026-10-17",
              required: true,
            },
            {
              type: "RadioGroup",
              label: "Seating",
              name: "seating",
              options: [
                { value: "inside", label: "Inside" },
                { value: "terrace", label: "Terrace" },
              ],
              value: "inside",
            },
            {
              type: "TextArea",
              label: "Notes",
              name: "notes",
              placeholder: "Allergies or celebrations",
            },
          ],
        },
      ],
    }),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    prompt: "How did the product do this week?",
    response: json({
      type: "Stack",
      children: [
        { type: "Heading", text: "Weekly product pulse", level: 2 },
        {
          type: "Grid",
          columns: 3,
          children: [
            {
              type: "Card",
              title: "Uptime",
              children: [
                { type: "Meter", label: "Availability this week", value: 99.9, min: 95, max: 100 },
              ],
            },
            {
              type: "Card",
              title: "Support backlog",
              children: [{ type: "ProgressBar", label: "Tickets cleared", value: 72 }],
            },
            {
              type: "Card",
              title: "Satisfaction",
              children: [
                { type: "Meter", label: "Net promoter score", value: 46, min: 0, max: 100 },
              ],
            },
          ],
        },
        {
          type: "LineChart",
          title: "Daily active users",
          data: [
            { x: 1, y: 1180 },
            { x: 2, y: 1240 },
            { x: 3, y: 1275 },
            { x: 4, y: 1310 },
            { x: 5, y: 1290 },
            { x: 6, y: 940 },
            { x: 7, y: 1020 },
          ],
          description: "Usage dipped on the weekend and recovered by Sunday evening.",
          xLabel: "Day of the week",
          yLabel: "Active users",
        },
        {
          type: "BarChart",
          title: "Tickets by area",
          data: [
            { label: "Billing", value: 14 },
            { label: "Sign-in", value: 9 },
            { label: "Exports", value: 6 },
            { label: "Other", value: 4 },
          ],
          description: "Billing causes the most tickets, so start there.",
          categoryLabel: "Area",
          valueLabel: "Tickets",
        },
      ],
    }),
  },
  {
    id: "calculator",
    title: "Calculator",
    prompt: "What would five seats cost me for a year?",
    response: json({
      type: "Stack",
      children: [
        {
          type: "Text",
          text: "Pro costs $12 per seat each month. Move the slider to try other team sizes.",
        },
        {
          type: "Slider",
          label: "Seats",
          name: "seats",
          min: 1,
          max: 25,
          value: { $bind: "seats", initial: 5 },
        },
        {
          type: "Output",
          label: "Cost for a year",
          value: { $expr: "seats * 12 * 12" },
          unit: " USD",
        },
      ],
    }),
  },
  {
    id: "explainer",
    title: "Explainer",
    prompt: "Explain how OAuth works.",
    response: json({
      type: "Stack",
      children: [
        { type: "Text", text: "OAuth lets an app act for you without ever seeing your password." },
        {
          type: "List",
          ordered: true,
          items: [
            "The app sends you to the provider to sign in.",
            "You approve exactly what the app may do.",
            "The provider hands the app a short-lived token.",
            "The app calls the API with that token.",
          ],
        },
        {
          type: "Accordion",
          items: [
            {
              title: "What is a scope?",
              children: [
                {
                  type: "Text",
                  text: "A scope names one permission, such as reading your calendar.",
                },
              ],
            },
            {
              title: "What if I change my mind?",
              children: [
                {
                  type: "Text",
                  text: "Revoke the app in the provider settings and its token stops working.",
                },
              ],
            },
          ],
        },
        { type: "Link", label: "Read the OAuth 2.0 overview", href: "https://oauth.net/2/" },
      ],
    }),
  },
] satisfies DemoResponse[];

/** Splits a response into the small pieces a model would stream, deterministically. */
export function tokenize(response: string): string[] {
  return response.match(/[A-Za-z0-9$.]+|\s+|[^A-Za-z0-9$.\s]/g) ?? [];
}
