import { component, p, prop } from "../define.js";

export default component({
  slug: "date-range-picker",
  title: "Date Range Picker",
  group: "pickers",
  summary: "Two typed date inputs and a range calendar sharing one date span.",
  analogy: "Like a travel form beside a wall calendar: type either edge or point at both days.",
  whenToUse: "Use it for stays, booking windows, and any start–end date pair.",
  steps: {
    main: "Put a Label, both date fields, and a trigger inside DateRangePicker; hide both browser-owned indicators so only the custom trigger is visible.",
    supporting: "Place a RangeCalendar inside DateRangePickerPopover so it adopts the same range.",
    behavior:
      "Pass name to submit `${name}-start` and `${name}-end`; choosing a second day closes the popover and returns focus to the trigger.",
    code: '<DateRangePicker name="stay">\n  <Label>Stay dates</Label>\n  <DateRangePickerStartField />\n  <DateRangePickerEndField />\n  <DateRangePickerTrigger />\n  <DateRangePickerPopover>\n    <RangeCalendar>\n      <RangeCalendarGrid />\n    </RangeCalendar>\n  </DateRangePickerPopover>\n</DateRangePicker>;',
  },
  imports: [
    "CalendarHeader",
    "CalendarNextButton",
    "CalendarPreviousButton",
    "DateRangePicker",
    "DateRangePickerEndField",
    "DateRangePickerPopover",
    "DateRangePickerStartField",
    "DateRangePickerTrigger",
    "Label",
    "RangeCalendar",
    "RangeCalendarGrid",
  ],
  snippet:
    '<DateRangePicker name="stay"><Label>Stay dates</Label><DateRangePickerStartField /><DateRangePickerEndField /><DateRangePickerTrigger /><DateRangePickerPopover><RangeCalendar><CalendarHeader /><RangeCalendarGrid /></RangeCalendar></DateRangePickerPopover></DateRangePicker>',
  parts: [
    p(
      "DateRangePicker",
      "root",
      "Range value, field wiring, form serialization, and popover-state provider.",
      false,
      false,
      [
        prop(
          "value / defaultValue",
          "[string, string]",
          'Controlled or initial [start, end] dates as "YYYY-MM-DD".',
        ),
        prop("onChange", "(value: DateRange) => void", "Receives the next start and end pair."),
        prop("open / defaultOpen", "boolean", "Controlled or initial calendar popover state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next popover state."),
        prop("name", "string", "Submits `${name}-start` and `${name}-end` date inputs."),
        prop("form", "string", "Associates both submitted dates with a form by id."),
        prop("disabled / invalid / required", "boolean", "Field-wide states for both dates."),
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element carrying the root's data attributes; there is no DOM without it.",
        ),
      ],
    ),
    p("Label", "label", "Visible name wired to the start field."),
    p(
      "DateRangePickerStartField",
      "input",
      "Native start-date input; the default label comes from Label.",
    ),
    p(
      "DateRangePickerEndField",
      "input",
      'Native end-date input; defaults to the English label "End date".',
    ),
    p(
      "DateRangePickerTrigger",
      "trigger",
      'Button opening the range calendar; defaults to "Choose dates".',
    ),
    p(
      "DateRangePickerPopover",
      "content",
      "Floating calendar dialog; defaults to the English label Calendar.",
      true,
      false,
      [
        prop("placement", "PopoverPlacement", "Side to open on, with automatic flipping."),
        prop("offset", "number", "Pixel gap between trigger and popover."),
      ],
    ),
    p(
      "RangeCalendar",
      "content",
      "Range month grid that adopts the picker value and completes the range.",
    ),
  ],
  keyboard: [
    {
      keys: ["Enter", "Space"],
      action: "Opens the calendar from the trigger or selects the focused day.",
    },
    { keys: ["Escape"], action: "Closes the calendar and returns focus to the trigger." },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves through days in the open calendar.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "DateRangePickerTrigger, DateRangePickerPopover",
      meaning: "The calendar is open.",
    },
    {
      attribute: "[data-complete]",
      on: "DateRangePicker",
      meaning: "Both start and end dates have values.",
    },
    {
      attribute: "[data-start-value] / [data-end-value]",
      on: "DateRangePicker",
      meaning: "The selected ISO dates.",
    },
    {
      attribute: "[data-disabled] / [data-invalid] / [data-required]",
      on: "DateRangePicker",
      meaning: "The shared field state.",
    },
  ],
  form: "DateRangePicker submits two native date inputs named `${name}-start` and `${name}-end` and restores uncontrolled values on form reset.",
  accessibility: [
    "Keep both date fields editable; the calendar must not be the only way to enter a range.",
    "When adding DateRangePickerTrigger, you must hide both browser-owned indicators so only one picker button is visible.",
    'The trigger and popover default to English labels ("Choose dates" and "Calendar"); translate them for localized apps.',
    "Opening focuses a date in the calendar and completing a range returns focus to the trigger; Escape closes without changing the values.",
  ],
  related: ["range-calendar", "date-picker", "date-field"],
});
