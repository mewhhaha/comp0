import { component, p, prop } from "../define.js";

export default component({
  slug: "pagination",
  title: "Pagination",
  group: "navigation",
  summary: "A navigation landmark that exposes the current page and page controls.",
  analogy:
    "Like the numbered tabs along the edge of a book: jump directly or turn one page at a time.",
  whenToUse: "Use it to move between discrete pages of results, not to load more content in place.",
  steps: {
    main: "Start Pagination with totalPages and render its pages state in a PaginationList.",
    supporting:
      "Wrap every control or generated page in PaginationItem; render ellipsis entries with PaginationEllipsis.",
    behavior:
      "Use value and onChange for controlled navigation, or defaultValue for an initial page; previous and next controls disable at their bounds.",
    code: '<Pagination totalPages={20}>\n  {({ pages }) => (\n    <PaginationList>\n      {pages.map((page) => (\n        <PaginationItem key={page}>\n          {typeof page === "number" ? (\n            <PaginationPage value={page}>{page}</PaginationPage>\n          ) : (\n            <PaginationEllipsis />\n          )}\n        </PaginationItem>\n      ))}\n    </PaginationList>\n  )}\n</Pagination>;',
  },
  imports: [
    "Pagination",
    "PaginationEllipsis",
    "PaginationFirst",
    "PaginationItem",
    "PaginationLast",
    "PaginationList",
    "PaginationNext",
    "PaginationPage",
    "PaginationPrevious",
  ],
  snippet:
    '<Pagination defaultValue={6} totalPages={20}>{({ pages }) => <PaginationList><PaginationItem><PaginationPrevious>Previous</PaginationPrevious></PaginationItem>{pages.map((entry) => <PaginationItem key={entry}>{typeof entry === "number" ? <PaginationPage value={entry}>{entry}</PaginationPage> : <PaginationEllipsis />}</PaginationItem>)}<PaginationItem><PaginationNext>Next</PaginationNext></PaginationItem></PaginationList>}</Pagination>',
  parts: [
    p(
      "Pagination",
      "root",
      "Native navigation landmark that owns the current page and visible page range.",
      true,
      false,
      [
        prop("value / defaultValue", "number", "Controlled or initial one-based page."),
        prop("onChange", "(value: number) => void", "Receives the next clamped page."),
        prop("totalPages", "number", "Required positive number of pages."),
        prop(
          "siblingCount / boundaryCount",
          "number",
          "How many neighboring and edge pages stay visible.",
        ),
        prop("aria-label", "string", 'Navigation name; defaults to "Pagination".'),
      ],
    ),
    p("PaginationList", "region", "Native ul for the controls.", true, false),
    p("PaginationItem", "item", "Native li wrapping one control or ellipsis.", true, false),
    p("PaginationPage", "trigger", "Button or link that selects a numbered page.", true, false, [
      prop("value", "number", "The one-based page to select."),
      prop("as", "ElementType", "Renders a router-style link while keeping pagination behavior."),
    ]),
    p(
      "PaginationPrevious / PaginationNext",
      "trigger",
      "Move one page and disable at their bounds.",
      true,
      true,
    ),
    p(
      "PaginationFirst / PaginationLast",
      "trigger",
      "Move to the first or last page and disable at their bounds.",
      true,
      true,
    ),
    p(
      "PaginationEllipsis",
      "value",
      "Presentational omission marker hidden from assistive technology.",
      true,
      true,
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves through the available page controls." },
    { keys: ["Enter"], action: "Selects the focused page or direction." },
    { keys: ["Space"], action: "Selects the focused page or direction." },
  ],
  stateHooks: [
    { attribute: "[data-page]", on: "Pagination", meaning: "The current one-based page." },
    { attribute: "[data-current]", on: "PaginationPage", meaning: "This page is current." },
    {
      attribute: "[data-first] / [data-last]",
      on: "Pagination",
      meaning: "The current page is at a boundary.",
    },
    {
      attribute: ":disabled",
      on: "PaginationFirst, PaginationPrevious, PaginationNext, PaginationLast",
      meaning: "That direction is unavailable.",
    },
  ],
  form: "Pagination changes application navigation state and does not create form values.",
  accessibility: [
    "Use a navigation label that distinguishes this pagination from other page navigation.",
    "PaginationPage marks the current page with aria-current=page; do not duplicate that state manually.",
    "Ellipses are hidden from assistive technology, so expose only real reachable page controls.",
  ],
  related: ["breadcrumbs", "tabs", "feed"],
});
