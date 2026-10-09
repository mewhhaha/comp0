import { type JsonValue } from "../../src/json/parse.js";

/** An explainer: sliders and fields bound to names drive computed outputs. */
export const explainer: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "What will this loan cost?", level: 2 },
    {
      type: "Text",
      text: "Move the sliders and the numbers below recalculate. The monthly payment is an estimate.",
    },
    {
      type: "Stack",
      children: [
        {
          type: "Slider",
          label: "Amount to borrow",
          name: "principal",
          min: 1000,
          max: 100000,
          step: 1000,
          value: { $bind: "principal", initial: 20000 },
        },
        {
          type: "Slider",
          label: "Interest rate (percent)",
          name: "rate",
          min: 0,
          max: 15,
          step: 0.5,
          value: { $bind: "rate", initial: 4.5 },
        },
        {
          type: "NumberField",
          label: "Years",
          name: "years",
          min: 1,
          max: 40,
          step: 1,
          required: true,
          description: "Between 1 and 40.",
          value: { $bind: "years", initial: 10 },
        },
        {
          type: "Switch",
          label: "Add payment protection",
          name: "extra",
          checked: { $bind: "extra", initial: false },
        },
        {
          type: "RadioGroup",
          label: "Plan",
          name: "plan",
          options: [
            { value: "standard", label: "Standard" },
            { value: "flex", label: "Flexible" },
          ],
          value: { $bind: "plan", initial: "standard" },
        },
      ],
    },
    {
      type: "Grid",
      columns: 2,
      children: [
        {
          type: "Output",
          label: "Monthly payment",
          value: {
            $expr:
              "round((principal * (1 + rate / 100 * years)) / (years * 12) + (extra ? 5 : 0), 2)",
          },
          unit: " USD",
        },
        {
          type: "Output",
          label: "Total repaid",
          value: { $expr: "round(principal * (1 + rate / 100 * years), 0)" },
          unit: " USD",
        },
        {
          type: "Output",
          label: "Interest paid",
          value: { $expr: "round(principal * rate / 100 * years, 0)" },
          unit: " USD",
        },
        {
          type: "Output",
          label: "Chosen plan",
          value: {
            $expr:
              'plan == "flex" ? "Flexible, no penalty for early repayment" : "Standard, fixed term"',
          },
        },
      ],
    },
    {
      type: "Alert",
      message: "Paying a little extra each month shortens the loan.",
      tone: "success",
    },
    {
      type: "CopyButton",
      label: "Copy the loan terms",
      value: "Loan terms: amount, rate and years as set above",
    },
  ],
};
