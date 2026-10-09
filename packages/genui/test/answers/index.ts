import { type JsonValue } from "../../src/json/parse.js";
import { bookingForm } from "./booking-form.js";
import { citedAnswer } from "./cited-answer.js";
import { dashboard } from "./dashboard.js";
import { explainer } from "./explainer.js";
import { garbage } from "./garbage.js";
import { planComparison } from "./plan-comparison.js";

/** The text a model would stream: pretty-printed so that cuts land inside names and strings. */
export function asJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

/** Realistic answers; together they use every catalog entry. */
export const answers = [
  { name: "plan comparison", value: planComparison, source: asJson(planComparison) },
  { name: "booking form", value: bookingForm, source: asJson(bookingForm) },
  { name: "dashboard", value: dashboard, source: asJson(dashboard) },
  { name: "explainer", value: explainer, source: asJson(explainer) },
  { name: "cited answer", value: citedAnswer, source: asJson(citedAnswer) },
] as const;

/** A hallucinating, hostile response; not part of the coverage check. */
export const hostile = {
  name: "garbage",
  value: garbage,
  // JSON.stringify cannot write a number beyond the double range; the model can.
  source: asJson(garbage).replace("1e+308", "1e999"),
} as const;
