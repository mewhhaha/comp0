import { component, p, prop } from "../define.js";

export default component({
  slug: "date-picker",
  title: "Date Picker",
  group: "pickers",
  summary: "A typed date input with a calendar popover sharing one value.",
  analogy: "Like a paper form beside a wall calendar: write the date or point at it.",
  whenToUse: "Use it when people know some dates by heart and browse for others.",
  steps: {
    main: "Put a Label, DateField, and DatePickerTrigger inside DatePicker; hide the browser-owned indicator so only the custom trigger is visible.",
    supporting:
      "Put a Calendar with CalendarHeader and CalendarGrid inside DatePickerPopover; it adopts the shared value automatically.",
    behavior:
      "Read the value from onChange as an ISO date; picking a day closes the popover and refills the DateField, and typing updates the calendar.",
    code: '<DatePicker defaultValue="2026-07-14">\n  <Label>Reservation</Label>\n  <DateField />\n  <DatePickerTrigger />\n  <DatePickerPopover>\n    <Calendar>\n      <CalendarHeader />\n      <CalendarGrid />\n    </Calendar>\n  </DatePickerPopover>\n</DatePicker>;',
  },
  imports: [
    "Calendar",
    "CalendarGrid",
    "CalendarHeader",
    "DateField",
    "DatePicker",
    "DatePickerPopover",
    "DatePickerTrigger",
    "Label",
  ],
  snippet:
    '<DatePicker defaultValue="2026-07-14">\n  <Label>Reservation</Label>\n  <DateField />\n  <DatePickerTrigger />\n  <DatePickerPopover>\n    <Calendar>\n      <CalendarHeader />\n      <CalendarGrid />\n    </Calendar>\n  </DatePickerPopover>\n</DatePicker>;',
  parts: [
    p(
      "DatePicker",
      "root",
      "Shared date value, open state, and field-context provider.",
      false,
      false,
      [
        prop("value / defaultValue", "string", 'Controlled or initial date as "YYYY-MM-DD".'),
        prop("onChange", "(value: string) => void", "Receives the selected ISO date."),
        prop("open / defaultOpen", "boolean", "Controlled or initial open state of the calendar."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        prop("name", "string", "Submission name for the selected ISO date."),
        prop("form", "string", "Associates the date value with a form by id."),
        prop("disabled / invalid / required", "boolean", "Field-wide states."),
        prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
      ],
    ),
    p("Label", "label", "Visible name connected to the DateField."),
    p(
      "DateField",
      "input",
      "Native date input that reads and writes the picker's value.",
      true,
      true,
      [prop("name", "string", "Submission name; the value submits as YYYY-MM-DD.")],
    ),
    p("DatePickerTrigger", "trigger", "Native button that opens the calendar.", true, false, [
      prop("aria-label", "string", 'Defaults to the English "Choose date"; pass a translation.'),
      prop("disabled", "boolean", "Disables opening."),
    ]),
    p("DatePickerPopover", "content", "The calendar dialog surface.", true, false, [
      prop("aria-label", "string", 'Defaults to the English "Calendar"; pass a translation.'),
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "bottom end"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the surface."),
    ]),
    p(
      "Calendar",
      "content",
      "Month grid that adopts the picker's value and closes it on selection.",
    ),
  ],
  keyboard: [
    {
      keys: ["Enter"],
      action: "Opens the calendar from the trigger; selects the focused day inside.",
    },
    {
      keys: ["Space"],
      action: "Opens the calendar from the trigger; selects the focused day inside.",
    },
    { keys: ["Escape"], action: "Closes the calendar and returns focus to the trigger." },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Move between days in the open calendar.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "DatePickerTrigger, DatePickerPopover",
      meaning: "The calendar is open.",
    },
    {
      attribute: ":popover-open",
      on: "DatePickerPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    { attribute: "[data-value]", on: "DatePicker (with as)", meaning: "A date is selected." },
  ],
  form: "The nested DateField owns form participation: give it a name and the shared value submits as YYYY-MM-DD with native validation.",
  accessibility: [
    "Keep the DateField: typing a date must stay possible without opening the calendar.",
    'The trigger and surface default to English aria-labels ("Choose date", "Calendar"); translate them for localized apps.',
    "Opening moves focus to the focused day and closing returns it to the trigger; Escape always closes without changing the value.",
    "When adding DatePickerTrigger, you must hide the browser-owned indicator so only one picker button is visible; keep the native DateField editable.",
  ],
  related: ["calendar", "date-field", "time-picker", "select"],
});
