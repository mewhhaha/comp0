// Generated from results.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { computed, fromJsonSchema, list, url } from "../catalog/schema.js";

export const outputProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Names the result, such as 'Monthly total'. Required.",
  }),
  value: computed(
    fromJsonSchema<number | string>({ anyOf: [{ type: "number" }, { type: "string" }] }),
    'The result. Write {"$expr": "seats * 12"} so it recalculates as the person changes the controls bound to the names it reads.',
  ),
  "unit?": fromJsonSchema<string>({
    type: "string",
    description: 'Text shown after a number, such as "%" or " per month".',
  }),
};
export const comparisonProps = {
  caption: fromJsonSchema<string>({
    type: "string",
    description: "What is compared; it names the table. Required.",
  }),
  options: fromJsonSchema<string[]>({
    type: "array",
    description: "The things compared, such as plan names, left to right.",
    items: { type: "string" },
  }),
  features: list(
    {
      name: fromJsonSchema<string>({
        type: "string",
        description: "The feature, such as 'Projects'.",
      }),
      values: fromJsonSchema<(number | string | boolean | null)[]>({
        type: "array",
        description:
          "One value per option, in the order of the options. true means included and false not included; text or numbers are shown as written.",
        items: {
          anyOf: [{ type: "number" }, { type: "string" }, { type: "boolean" }, { type: "null" }],
        },
      }),
    },
    "The rows, each { name, values }.",
  ),
  "recommended?": fromJsonSchema<string>({
    type: "string",
    description: "The name of the option to recommend, exactly as written in options.",
  }),
};
export const citedTextProps = {
  text: fromJsonSchema<string>({
    type: "string",
    description:
      "The answer as plain text. Mark each claim with the number of its source in square brackets, such as [1] or [2][3]. Blank lines separate paragraphs.",
  }),
  sources: list(
    {
      title: fromJsonSchema<string>({
        type: "string",
        description: "The name of the source, such as an article or document title.",
      }),
      "href?": url("link", "http(s) address of the source."),
      "note?": fromJsonSchema<string>({
        type: "string",
        description: "Publisher, date, or a short excerpt.",
      }),
    },
    "The sources, each { title, href?, note? }, numbered from 1.",
  ),
};
