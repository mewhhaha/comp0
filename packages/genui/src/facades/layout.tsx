import { useId } from "react";
import { HeadingLevelContext, useHeadingLevel } from "../bridge/heading-level.js";
import { useBound, useComputed } from "../bridge/state.js";
import { type CatalogProps, defineEntry } from "../catalog/types.js";
import {
  stackProps,
  gridProps,
  cardProps,
  headingProps,
  textProps,
  imageProps,
  listProps,
} from "./layout.props.js";
import { gaps, aligns, tones } from "./tokens.js";
import { asNumber, asResult, asText, asToken, asStrings, safeImageSrc } from "../safe.js";

function clampInteger(value: unknown, min: number, max: number) {
  const number = asNumber(value);
  if (number === undefined) return undefined;
  return Math.min(max, Math.max(min, Math.round(number)));
}

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

export function GridFacade({ children, columns, gap }: CatalogProps<typeof gridProps>) {
  return (
    <div data-slot="grid" data-columns={clampInteger(columns, 1, 6)} data-gap={asToken(gap, gaps)}>
      {children}
    </div>
  );
}

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

export function ListFacade({ items, ordered }: CatalogProps<typeof listProps>) {
  const entries = asStrings(useBound(items));
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
