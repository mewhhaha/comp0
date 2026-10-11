// The results facades' props, written with ArkType and precompiled into results.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { computed, list, url } from "../catalog/schema.js";

export const outputProps = {
  label: type("string").describe("Names the result, such as 'Monthly total'. Required."),
  value: computed(
    type("string | number"),
    'The result. Write {"$expr": "seats * 12"} so it recalculates as the person changes the controls bound to the names it reads.',
  ),
  "unit?": type("string").describe('Text shown after a number, such as "%" or " per month".'),
};

const featureProps = {
  name: type("string").describe("The feature, such as 'Projects'."),
  values: type("(string | number | boolean | null)[]").describe(
    "One value per option, in the order of the options. true means included and false not included; text or numbers are shown as written.",
  ),
};

export const comparisonProps = {
  caption: type("string").describe("What is compared; it names the table. Required."),
  options: type("string[]").describe("The things compared, such as plan names, left to right."),
  features: list(featureProps, "The rows, each { name, values }."),
  "recommended?": type("string").describe(
    "The name of the option to recommend, exactly as written in options.",
  ),
};

const sourceProps = {
  title: type("string").describe("The name of the source, such as an article or document title."),
  "href?": url("link", "http(s) address of the source."),
  "note?": type("string").describe("Publisher, date, or a short excerpt."),
};

export const citedTextProps = {
  text: type("string").describe(
    "The answer as plain text. Mark each claim with the number of its source in square brackets, such as [1] or [2][3]. Blank lines separate paragraphs.",
  ),
  sources: list(sourceProps, "The sources, each { title, href?, note? }, numbered from 1."),
};
