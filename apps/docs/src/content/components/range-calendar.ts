import { component, p, prop } from "../define.js";

export default component({
  slug: "range-calendar",
  title: "Range Calendar",
  group: "pickers",
  summary: "A month grid that selects a start and end date as one range.",
  analogy: "Like stretching a ribbon across a wall calendar from check-in to check-out.",
  whenToUse:
    "Use it when seeing the span between two dates matters, alone or inside a Date Range Picker.",
  steps: {
    main: "Wrap RangeCalendarGrid and the shared calendar header controls in RangeCalendar.",
    supporting:
      "Use RangeCalendarCell when custom day styling needs range start, end, and interior states.",
    behavior:
      "Read onChange as a [start, end] ISO pair; the first selection starts the range and the second completes it.",
    code: '<RangeCalendar defaultValue={["2026-07-14", "2026-07-18"]}>\n  <CalendarHeader />\n  <RangeCalendarGrid />\n</RangeCalendar>;',
  },
  imports: [
    "CalendarHeader",
    "CalendarNextButton",
    "CalendarPreviousButton",
    "RangeCalendar",
    "RangeCalendarCell",
    "RangeCalendarGrid",
  ],
  snippet:
    '<RangeCalendar defaultValue={["2026-07-14", "2026-07-18"]}><CalendarPreviousButton /><CalendarHeader /><CalendarNextButton /><RangeCalendarGrid>{(cell) => <RangeCalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />}</RangeCalendarGrid></RangeCalendar>',
  parts: [
    p(
      "RangeCalendar",
      "root",
      "Start-and-end date state provider sharing Calendar month navigation.",
      false,
      false,
      [
        prop(
          "value / defaultValue",
          "[string, string]",
          "Controlled or initial [start, end] ISO dates; an empty end is incomplete.",
        ),
        prop(
          "onChange",
          "(value: DateRange) => void",
          "Receives the next [start, end] ISO date pair.",
        ),
        prop("min / max", "string", "Inclusive selectable ISO date bounds."),
        prop("locale", "string", "BCP 47 locale for month and weekday names."),
        prop("disabled", "boolean", "Disables every day and navigation control."),
        prop("id", "string", "Id of the calendar element when rendered with as."),
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element carrying the root's data attributes; there is no DOM without it.",
        ),
      ],
    ),
    p("CalendarHeader", "label", "Polite live region announcing the visible month."),
    p(
      "CalendarPreviousButton / CalendarNextButton",
      "trigger",
      "Month paging controls shared with Calendar.",
      true,
      true,
    ),
    p(
      "RangeCalendarGrid",
      "region",
      "Month grid with aria-multiselectable and a range cell renderer.",
      true,
      false,
      [
        prop(
          "children",
          "(cell: MonthMatrixCell) => ReactNode",
          "Custom renderer; defaults to RangeCalendarCell.",
        ),
      ],
    ),
    p(
      "RangeCalendarCell",
      "item",
      "Day cell that marks selected endpoints and interior dates.",
      true,
      true,
      [
        prop("date", "string", 'Cell date as "YYYY-MM-DD".'),
        prop(
          "outsideMonth",
          "boolean",
          "Marks a leading or trailing day from a neighboring month.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["ArrowLeft", "ArrowRight"], action: "Moves focus one day backward or forward." },
    { keys: ["ArrowUp", "ArrowDown"], action: "Moves focus one week backward or forward." },
    { keys: ["Home", "End"], action: "Moves focus to the start or end of the week." },
    { keys: ["PageUp", "PageDown"], action: "Shows the previous or next month." },
    { keys: ["Enter", "Space"], action: "Starts or completes the range at the focused day." },
  ],
  stateHooks: [
    {
      attribute: "[data-complete]",
      on: "RangeCalendar (with as)",
      meaning: "Both start and end dates have values.",
    },
    {
      attribute: "[data-start-value] / [data-end-value]",
      on: "RangeCalendar (with as)",
      meaning: "Carry the selected ISO start and end dates.",
    },
    { attribute: "[data-today]", on: "RangeCalendarCell", meaning: "The day is today." },
    {
      attribute: "[data-range-start]",
      on: "RangeCalendarCell",
      meaning: "The first selected day.",
    },
    {
      attribute: "[data-range-end]",
      on: "RangeCalendarCell",
      meaning: "The final selected day.",
    },
    {
      attribute: "[data-in-range]",
      on: "RangeCalendarCell",
      meaning: "A day falls strictly inside a completed range.",
    },
    {
      attribute: "[data-range-preview]",
      on: "RangeCalendarCell",
      meaning: "A day falls inside the provisional range while choosing its endpoint.",
    },
    {
      attribute: "[data-outside-month]",
      on: "RangeCalendarCell",
      meaning: "The day belongs to a neighboring month.",
    },
    {
      attribute: "[data-disabled]",
      on: "RangeCalendarCell",
      meaning: "The day falls outside min or max.",
    },
  ],
  form: "RangeCalendar does not create form values; pair it with Date Range Picker or mirror the two ISO dates into form controls.",
  accessibility: [
    "The grid is one tab stop; retain the day buttons when customizing cells so arrow-key navigation keeps working.",
    "Translate the default English previous and next month button labels for localized apps.",
    "Style the start, end, and interior states distinctly so the selected span is understandable without color alone.",
  ],
  related: ["calendar", "date-range-picker", "date-picker"],
});
