import { component, p, prop } from "../define.js";

export default component({
  slug: "calendar",
  title: "Calendar",
  group: "pickers",
  summary: "A month grid for choosing one day with the keyboard or a click.",
  analogy: "Like a wall calendar: one page per month, one finger on a day.",
  whenToUse: "Use it when seeing the whole month helps, alone or inside a DatePicker.",
  steps: {
    main: "Wrap CalendarHeader and CalendarGrid in Calendar; the grid renders the month on its own.",
    supporting:
      "Add CalendarPreviousButton and CalendarNextButton around the header for month paging.",
    behavior:
      "Read the choice from onChange as an ISO date, and fence the range with min/max; arrow keys walk days, PageUp/PageDown walk months.",
    code: '<Calendar defaultValue="2026-07-14" onChange={setDate}>\n  <CalendarHeader />\n  <CalendarGrid />\n</Calendar>;',
  },
  imports: [
    "Calendar",
    "CalendarCell",
    "CalendarGrid",
    "CalendarHeader",
    "CalendarNextButton",
    "CalendarPreviousButton",
  ],
  snippet:
    '<Calendar as="div" defaultValue="2026-07-14" onChange={setDate}><CalendarPreviousButton /><CalendarHeader /><CalendarNextButton /><CalendarGrid>{(cell) => <CalendarCell date={cell.iso} outsideMonth={cell.outsideMonth} />}</CalendarGrid></Calendar>',
  parts: [
    p("Calendar", "root", "Selected-date and visible-month provider.", false, false, [
      prop("value / defaultValue", "string", 'Controlled or initial date as "YYYY-MM-DD".'),
      prop("onChange", "(value: string) => void", "Receives the selected ISO date."),
      prop("min / max", "string", "Inclusive selectable range; days outside it are disabled."),
      prop(
        "locale",
        "string",
        "BCP 47 tag for month and weekday names and the week start; defaults to the browser locale.",
      ),
      prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
    ]),
    p("CalendarHeader", "label", "Live region announcing the visible month.", true, false, [
      prop(
        "children",
        "(label: string) => ReactNode",
        "Custom content receiving the localized month-and-year label.",
      ),
    ]),
    p(
      "CalendarPreviousButton",
      "trigger",
      "Native button that shows the previous month.",
      true,
      true,
      [
        prop(
          "aria-label",
          "string",
          'Defaults to the English "Previous month"; pass a translation.',
        ),
      ],
    ),
    p("CalendarNextButton", "trigger", "Native button that shows the next month.", true, true, [
      prop("aria-label", "string", 'Defaults to the English "Next month"; pass a translation.'),
    ]),
    p("CalendarGrid", "region", "Month table with localized weekday headers.", true, false, [
      prop(
        "children",
        "(cell: MonthMatrixCell) => ReactNode",
        "Custom day cell renderer; defaults to a plain CalendarCell.",
      ),
    ]),
    p("CalendarCell", "item", "Day cell wrapping the real day button.", true, true, [
      prop("date", "string", 'This cell\'s date as "YYYY-MM-DD".'),
      prop("outsideMonth", "boolean", "Marks a leading or trailing day from a neighboring month."),
      prop("children", "ReactNode", "Visible day content; defaults to the day number."),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowLeft"], action: "Moves focus one day toward the visual left." },
    { keys: ["ArrowRight"], action: "Moves focus one day toward the visual right." },
    { keys: ["ArrowUp"], action: "Moves focus one week back." },
    { keys: ["ArrowDown"], action: "Moves focus one week forward." },
    { keys: ["Home"], action: "Moves focus to the start of the week." },
    { keys: ["End"], action: "Moves focus to the end of the week." },
    { keys: ["PageUp"], action: "Shows the previous month." },
    { keys: ["PageDown"], action: "Shows the next month." },
    { keys: ["Shift", "PageUp"], action: "Shows the previous year." },
    { keys: ["Shift", "PageDown"], action: "Shows the next year." },
    { keys: ["Enter"], action: "Selects the focused day." },
    { keys: ["Space"], action: "Selects the focused day." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "CalendarCell", meaning: "The day is selected." },
    { attribute: "[data-today]", on: "CalendarCell", meaning: "The day is today." },
    {
      attribute: "[data-outside-month]",
      on: "CalendarCell",
      meaning: "The day belongs to a neighboring month.",
    },
    {
      attribute: "[data-disabled]",
      on: "CalendarCell",
      meaning: "The day falls outside min or max.",
    },
    { attribute: "[data-value]", on: "Calendar (with as)", meaning: "A date is selected." },
  ],
  form: "Selection does not create a native form value; pair the calendar with a named DateField, or mirror the value into a hidden input.",
  accessibility: [
    "The grid is one tab stop; arrow keys move between days, so keep custom cells as buttons.",
    "Horizontal day arrows mirror in RTL so focus follows the visual calendar order.",
    "Month and weekday names come from Intl for the given locale, but the prev/next button labels default to English aria-labels; translate them.",
    "The header is a polite live region, so month changes are announced without moving focus.",
  ],
  related: ["date-picker", "date-field", "select"],
});
