import { component, p, prop } from "../define.js";

export default component({
  slug: "date-field",
  title: "Date Field",
  group: "fields",
  summary: "Native date and time inputs with the shared label and feedback pieces.",
  analogy:
    "Like a printed form with boxes for day, month, and year: the browser fills in the format.",
  whenToUse: "Use them whenever people type or pick a plain date or time value.",
  steps: {
    main: "Start a TextField with a Label and put DateField (or TimeField) inside it.",
    supporting: "Add Description for a hint, FieldError for validation, and min/max ISO bounds.",
    behavior:
      "Give each input a name so the form submits its ISO value; the browser handles parsing and the platform picker.",
    code: '<TextField>\n  <Label>Departure</Label>\n  <DateField name="departure" min="2026-07-01" />\n</TextField>;',
  },
  imports: ["DateField", "Description", "Label", "TextField", "TimeField"],
  snippet:
    '<><TextField><Label>Departure</Label><DateField name="departure" min="2026-07-01" /><Description>Trips start in July.</Description></TextField><TextField><Label>Pickup</Label><TimeField name="pickup" step={900} /></TextField></>',
  parts: [
    p(
      "TextField",
      "root",
      "Optional shared field brain connecting the label, input, help, and errors.",
      false,
      true,
      [
        prop("value / defaultValue", "string", "Controlled or initial ISO value."),
        prop("onChange", "(value: string) => void", "Receives the next ISO value."),
        prop("disabled / invalid / required", "boolean", "Field-wide states."),
      ],
    ),
    p("Label", "label", "Visible name connected to the input."),
    p(
      "DateField",
      "input",
      "Native date input; the browser owns typing and validation.",
      true,
      false,
      [
        prop("name", "string", "Submission name; the value submits as YYYY-MM-DD."),
        prop("min / max", "string", 'Earliest and latest selectable dates as "YYYY-MM-DD".'),
        prop("disabled / required", "boolean", "Override the field-wide state for this control."),
        prop("aria-label", "string", "Names the input when there is no visible Label."),
      ],
    ),
    p("TimeField", "input", "Native time input over the same field wiring.", true, true, [
      prop("name", "string", "Submission name; the value submits as HH:mm."),
      prop("min / max", "string", 'Earliest and latest selectable times such as "09:00".'),
      prop(
        "step",
        "number",
        "Granularity in seconds; 60 is the browser default, 1 reveals seconds.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowUp"], action: "Steps the focused date or time segment up." },
    { keys: ["ArrowDown"], action: "Steps the focused date or time segment down." },
    { keys: ["ArrowLeft"], action: "Moves to the previous segment." },
    { keys: ["ArrowRight"], action: "Moves to the next segment." },
  ],
  stateHooks: [
    { attribute: "[data-value]", on: "DateField, TimeField", meaning: "The field has a value." },
    { attribute: "[data-invalid]", on: "DateField, TimeField", meaning: "The value is invalid." },
    {
      attribute: "[data-focus-visible]",
      on: "DateField, TimeField",
      meaning: "Keyboard focus is on the field.",
    },
  ],
  form: 'DateField and TimeField are native inputs: name them and they submit ISO values ("YYYY-MM-DD" and "HH:mm") with native min/max/required validation.',
  accessibility: [
    "Always name the input with a Label or an aria-label; the segments announce themselves.",
    "Native inputs bring the platform's own accessible date and time pickers for free; do not hide them without a replacement.",
    "Use min/max instead of custom validation so errors surface through the browser's constraint messages.",
  ],
  related: ["date-picker", "calendar", "select"],
});
