import { useId } from "react";
import { z } from "zod";
import { HeadingLevelContext, useHeadingLevel } from "../bridge/heading-level.js";
import { useComputed } from "../bridge/state.js";
import { computed, nodes, url } from "../catalog/schema.js";
import { type CatalogProps, defineEntry } from "../catalog/types.js";
import { asNumber, asResult, asText, asToken, asStrings, safeImageSrc } from "../safe.js";

const gaps = ["xs", "sm", "md", "lg", "xl"] as const;
const aligns = ["start", "center", "end", "stretch"] as const;
const tones = ["default", "muted", "success", "warning", "danger"] as const;

function clampInteger(value: unknown, min: number, max: number) {
  const number = asNumber(value);
  if (number === undefined) return undefined;
  return Math.min(max, Math.max(min, Math.round(number)));
}

const stackProps = z.object({
  children: nodes("Components to lay out, in order."),
  direction: z.enum(["column", "row"]).optional().describe('"column" (default) stacks vertically.'),
  gap: z.enum(gaps).optional().describe('Space between children; "md" by default.'),
  align: z.enum(aligns).optional().describe("Cross-axis alignment."),
  wrap: z.boolean().optional().describe("Let a row wrap onto several lines."),
});

export function StackFacade({
  children,
  direction,
  gap,
  align,
  wrap,
}: CatalogProps<typeof stackProps>) {
  return (
    <div
      data-slot="stack"
      data-direction={asToken(direction, ["column", "row"] as const)}
      data-gap={asToken(gap, gaps)}
      data-align={asToken(align, aligns)}
      data-wrap={wrap === true ? "" : undefined}
    >
      {children}
    </div>
  );
}

const gridProps = z.object({
  children: nodes("Components to place in grid cells, in order."),
  columns: z.number().optional().describe("Number of equal columns, 1 to 6; 2 by default."),
  gap: z.enum(gaps).optional().describe('Space between cells; "md" by default.'),
});

export function GridFacade({ children, columns, gap }: CatalogProps<typeof gridProps>) {
  return (
    <div data-slot="grid" data-columns={clampInteger(columns, 1, 6)} data-gap={asToken(gap, gaps)}>
      {children}
    </div>
  );
}

const cardProps = z.object({
  title: z.string().describe("Heading of the card; it also names the card for screen readers."),
  children: nodes("Content of the card."),
  description: z.string().optional().describe("One short supporting sentence under the title."),
  tone: z.enum(["default", "muted", "accent"]).optional().describe("Visual emphasis."),
});

export function CardFacade({ title, children, description, tone }: CatalogProps<typeof cardProps>) {
  const headingId = useId();
  const level = useHeadingLevel();
  const descriptionText = asText(description);
  const titleText = asText(title);
  const named = titleText.trim() !== "";
  let heading = null;
  if (named) {
    heading = (
      <CardTitle id={headingId} level={level}>
        {titleText}
      </CardTitle>
    );
  }
  return (
    <section
      data-slot="card"
      data-tone={asToken(tone, ["default", "muted", "accent"] as const)}
      // A card without a title is an unnamed group, not a region with an empty heading.
      aria-labelledby={named ? headingId : undefined}
    >
      {heading}
      {descriptionText === "" ? null : <p data-slot="card-description">{descriptionText}</p>}
      <HeadingLevelContext value={level + 1}>{children}</HeadingLevelContext>
    </section>
  );
}

type CardTitleProps = { id: string; level: 1 | 2 | 3 | 4 | 5 | 6; children: string };

function CardTitle({ id, level, children }: CardTitleProps) {
  if (level === 1)
    return (
      <h1 id={id} data-slot="card-title">
        {children}
      </h1>
    );
  if (level === 2)
    return (
      <h2 id={id} data-slot="card-title">
        {children}
      </h2>
    );
  if (level === 3)
    return (
      <h3 id={id} data-slot="card-title">
        {children}
      </h3>
    );
  if (level === 4)
    return (
      <h4 id={id} data-slot="card-title">
        {children}
      </h4>
    );
  if (level === 5)
    return (
      <h5 id={id} data-slot="card-title">
        {children}
      </h5>
    );
  return (
    <h6 id={id} data-slot="card-title">
      {children}
    </h6>
  );
}

const headingProps = z.object({
  text: z.string().describe("The heading text."),
  level: z.number().optional().describe("Heading level 1 to 6; 2 by default. Do not skip levels."),
});

export function HeadingFacade({ text, level }: CatalogProps<typeof headingProps>) {
  const resolved = clampInteger(level, 1, 6) ?? 2;
  const content = asText(text);
  // An empty heading is announced as a heading with no name.
  if (content.trim() === "") return null;
  if (resolved === 1) return <h1 data-slot="heading">{content}</h1>;
  if (resolved === 3) return <h3 data-slot="heading">{content}</h3>;
  if (resolved === 4) return <h4 data-slot="heading">{content}</h4>;
  if (resolved === 5) return <h5 data-slot="heading">{content}</h5>;
  if (resolved === 6) return <h6 data-slot="heading">{content}</h6>;
  return <h2 data-slot="heading">{content}</h2>;
}

const textProps = z.object({
  text: computed(z.string()).describe(
    'Plain text. Markdown and HTML are shown literally. May be {"$expr": "..."} over bound names.',
  ),
  tone: z.enum(tones).optional().describe('Meaning of the text; "default" unless it matters.'),
  size: z.enum(["sm", "md", "lg"]).optional().describe('Text size; "md" by default.'),
});

export function TextFacade({ text, tone, size }: CatalogProps<typeof textProps>) {
  return (
    <p
      data-slot="text"
      data-tone={asToken(tone, tones)}
      data-size={asToken(size, ["sm", "md", "lg"] as const)}
    >
      {asResult(useComputed(text))}
    </p>
  );
}

const imageProps = z.object({
  src: url("image", "http(s) or relative URL of the image. data: URLs are not rendered."),
  alt: z
    .string()
    .describe("Text alternative describing what the image shows. Required; never a filename."),
  caption: z.string().optional().describe("Visible caption under the image."),
});

export function ImageFacade({ src, alt, caption }: CatalogProps<typeof imageProps>) {
  const safeSrc = safeImageSrc(src);
  const captionText = asText(caption);
  // While the URL streams in there is nothing safe to load yet.
  if (safeSrc === undefined) return null;
  return (
    <figure data-slot="image">
      <img
        src={safeSrc}
        alt={asText(alt)}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      {captionText === "" ? null : <figcaption>{captionText}</figcaption>}
    </figure>
  );
}

const listProps = z.object({
  items: z.array(z.string()).describe("One short text per item."),
  ordered: z.boolean().optional().describe("Number the items; bulleted by default."),
});

export function ListFacade({ items, ordered }: CatalogProps<typeof listProps>) {
  const entries = asStrings(items);
  const content = entries.map((item, index) => <li key={index}>{item}</li>);
  if (ordered === true) return <ol data-slot="list">{content}</ol>;
  return <ul data-slot="list">{content}</ul>;
}

export const layoutEntries = [
  defineEntry({
    name: "Stack",
    group: "Layout",
    description:
      "Lays out components in order, vertically by default or in a row. Use it for the root and to group related components. Requires children.",
    props: stackProps,
    component: StackFacade,
  }),
  defineEntry({
    name: "Grid",
    group: "Layout",
    description:
      "Places components in equal columns, for dashboards and side-by-side cards. Requires children; columns defaults to 2.",
    props: gridProps,
    component: GridFacade,
  }),
  defineEntry({
    name: "Card",
    group: "Layout",
    description:
      "A titled section that groups related content, such as one metric, one result, or one step. Requires a title and children.",
    props: cardProps,
    component: CardFacade,
  }),
  defineEntry({
    name: "Heading",
    group: "Layout",
    description:
      "A heading that titles the content below it. Use it to structure a long response. Requires text; keep levels in order.",
    props: headingProps,
    component: HeadingFacade,
  }),
  defineEntry({
    name: "Text",
    group: "Layout",
    description:
      "A paragraph of plain text. Use it for explanations around other components. Requires text.",
    props: textProps,
    component: TextFacade,
  }),
  defineEntry({
    name: "Image",
    group: "Layout",
    description:
      "An image from an http(s) or relative URL. Requires src and alt text that describes the image; add a caption when the image needs explaining.",
    props: imageProps,
    component: ImageFacade,
  }),
  defineEntry({
    name: "List",
    group: "Layout",
    description:
      "A bulleted or numbered list of short text items. Use it for steps, options, or highlights. Requires items.",
    props: listProps,
    component: ListFacade,
  }),
];
