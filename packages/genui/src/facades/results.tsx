import { Fragment, useId } from "react";
import { z } from "zod";
import {
  Citation,
  Citations,
  Comparison,
  ComparisonBody,
  ComparisonFeature,
  ComparisonHeader,
  ComparisonOption,
  ComparisonRow,
  ComparisonValue,
  Label,
  Output,
  Source,
  Sources,
  TableCaption,
  VisuallyHidden,
} from "@comp0/react";
import { useComputed } from "../bridge/state.js";
import { computed, url } from "../catalog/schema.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import { asRecords, asResult, asStrings, asText, safeHref } from "../safe.js";

const outputProps = z.object({
  label: z.string().describe("Names the result, such as 'Monthly total'. Required."),
  value: computed(z.union([z.string(), z.number()])).describe(
    'The result. Write {"$expr": "seats * 12"} so it recalculates as the person changes the controls bound to the names it reads.',
  ),
  unit: z.string().optional().describe('Text shown after a number, such as "%" or " per month".'),
});

export function OutputFacade({ label, value, unit }: CatalogProps<typeof outputProps>) {
  const id = useId();
  const text = asResult(useComputed(value));
  const suffix = text === "" ? "" : asText(unit);
  return (
    <div data-slot="output-field">
      <Label htmlFor={id}>{asText(label)}</Label>
      <Output id={id}>
        {text}
        {suffix}
      </Output>
    </div>
  );
}

const featureProps = z.object({
  name: z.string().describe("The feature, such as 'Projects'."),
  values: z
    .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .describe(
      "One value per option, in the order of the options. true means included and false not included; text or numbers are shown as written.",
    ),
});

const comparisonProps = z.object({
  caption: z.string().describe("What is compared; it names the table. Required."),
  options: z.array(z.string()).describe("The things compared, such as plan names, left to right."),
  features: z.array(featureProps).describe("The rows, each { name, values }."),
  recommended: z
    .string()
    .optional()
    .describe("The name of the option to recommend, exactly as written in options."),
});

export function ComparisonFacade({
  caption,
  options,
  features,
  recommended,
}: CatalogProps<typeof comparisonProps>) {
  const names = asStrings(options, 12);
  if (names.length === 0) return null;
  const suggested = asText(recommended).trim().toLowerCase();
  const rows = asRecords(features, 60).filter((feature) => asText(feature.name) !== "");
  return (
    <Comparison data-slot="comparison-table">
      <TableCaption>{asText(caption)}</TableCaption>
      <ComparisonHeader>
        <tr>
          <th scope="col">
            <VisuallyHidden>Feature</VisuallyHidden>
          </th>
          {names.map((name, index) => (
            <ComparisonOption
              key={index}
              value={String(index)}
              recommended={suggested !== "" && name.trim().toLowerCase() === suggested}
            >
              {name}
            </ComparisonOption>
          ))}
        </tr>
      </ComparisonHeader>
      <ComparisonBody>
        {rows.map((feature, rowIndex) => {
          const values = Array.isArray(feature.values) ? feature.values : [];
          return (
            <ComparisonRow key={rowIndex}>
              <ComparisonFeature>{asText(feature.name)}</ComparisonFeature>
              {names.map((_, index) => {
                const value = values[index];
                if (typeof value === "boolean") {
                  return (
                    <ComparisonValue key={index} option={String(index)} included={value}>
                      {value ? "✓" : "–"}
                    </ComparisonValue>
                  );
                }
                return (
                  <ComparisonValue key={index} option={String(index)}>
                    {asResult(value)}
                  </ComparisonValue>
                );
              })}
            </ComparisonRow>
          );
        })}
      </ComparisonBody>
    </Comparison>
  );
}

const sourceProps = z.object({
  title: z.string().describe("The name of the source, such as an article or document title."),
  href: url("link", "http(s) address of the source.").optional(),
  note: z.string().optional().describe("Publisher, date, or a short excerpt."),
});

const citedTextProps = z.object({
  text: z
    .string()
    .describe(
      "The answer as plain text. Mark each claim with the number of its source in square brackets, such as [1] or [2][3]. Blank lines separate paragraphs.",
    ),
  sources: z
    .array(sourceProps)
    .describe("The sources, each { title, href?, note? }, numbered from 1."),
});

type CitedSource = { title: string; href: string | undefined; note: string };

function citedSources(value: unknown): CitedSource[] {
  return asRecords(value, 100).map((record) => {
    const href = safeHref(record.href);
    const title = asText(record.title).trim();
    return {
      title: title === "" ? (href ?? "Untitled source") : title,
      href,
      note: asText(record.note),
    };
  });
}

/** Splits a paragraph at its `[n]` markers; markers without a source stay as written. */
function segments(paragraph: string, count: number) {
  const parts = paragraph.split(/(\[\d{1,3}\])/);
  return parts.map((part, index) => {
    const number = /^\[(\d{1,3})\]$/.exec(part)?.[1];
    const position = number === undefined ? 0 : Number(number);
    if (position < 1 || position > count) return <Fragment key={index}>{part}</Fragment>;
    return <Citation key={index} value={String(position - 1)} />;
  });
}

export function CitedTextFacade({ text, sources }: CatalogProps<typeof citedTextProps>) {
  const list = citedSources(sources);
  const paragraphs = asText(text)
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim() !== "");
  let sourceList = null;
  if (list.length > 0) {
    sourceList = (
      <Sources aria-label="Sources">
        {list.map((source, index) => (
          <Source key={index} value={String(index)} title={source.title} href={source.href}>
            {source.note === "" ? null : <span data-slot="source-note"> {source.note}</span>}
          </Source>
        ))}
      </Sources>
    );
  }
  return (
    <Citations as="div" data-slot="cited-text">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{segments(paragraph, list.length)}</p>
      ))}
      {sourceList}
    </Citations>
  );
}

export const resultEntries = [
  defineEntry({
    name: "Output",
    group: "Data",
    description:
      'A computed result shown next to the controls it depends on, such as a price or a total. Bind controls with {"$bind": name} and write the value as {"$expr": "..."} over those names, and it updates live. Requires label and value.',
    props: outputProps,
    component: OutputFacade,
  }),
  defineEntry({
    name: "Comparison",
    group: "Data",
    description:
      "Sets options side by side, such as plans or products, with a recommended one. Requires caption, options, and features; each feature has one value per option, true or false for included or not.",
    props: comparisonProps,
    component: ComparisonFacade,
  }),
  defineEntry({
    name: "CitedText",
    group: "Data",
    description:
      "An answer whose claims point at numbered sources. Requires text with [1]-style markers and the list of sources ({ title, href?, note? }); the sources are listed under the text and each marker links to its source.",
    props: citedTextProps,
    component: CitedTextFacade,
  }),
];
