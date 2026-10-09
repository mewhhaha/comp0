import { type JsonValue } from "../../src/json/parse.js";

/** A pricing answer: a comparison table, a recommendation, and follow-up actions. */
export const planComparison: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "Which plan fits your team?", level: 2 },
    {
      type: "Text",
      text: "Pro is the best fit for teams of five to fifty. Free is enough to try the product, and Business adds single sign-on.",
    },
    {
      type: "Comparison",
      caption: "Plans compared",
      options: ["Free", "Pro", "Business"],
      features: [
        { name: "Projects", values: [3, "Unlimited", "Unlimited"] },
        { name: "Priority support", values: [false, true, true] },
        { name: "Single sign-on", values: [false, false, true] },
        { name: "Price per seat", values: ["$0", "$12", "$29"] },
        { name: "Audit log", values: [false, null, true] },
      ],
      recommended: "Pro",
    },
    {
      type: "Alert",
      message: "Prices are billed annually. Monthly billing costs 20 percent more.",
      tone: "info",
      title: "Billing",
    },
    {
      type: "Stack",
      direction: "row",
      gap: "sm",
      align: "center",
      wrap: true,
      children: [
        {
          type: "Button",
          label: "Start with Pro",
          variant: "primary",
          message: "I want to start with the Pro plan",
        },
        {
          type: "Button",
          label: "Talk to sales",
          variant: "secondary",
          message: "Connect me with sales",
        },
        { type: "Link", label: "Read the pricing FAQ", href: "https://example.com/pricing/faq" },
      ],
    },
    {
      type: "Suggestions",
      label: "Next steps",
      items: [
        "Compare Pro with Business",
        "What does annual billing save?",
        "Can I switch plans later?",
      ],
    },
  ],
};
