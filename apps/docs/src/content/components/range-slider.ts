import { component, p, prop } from "../define.js";

export default component({
  slug: "range-slider",
  title: "Range Slider",
  group: "fields",
  summary: "A two-thumb slider for choosing a range between bounds.",
  analogy: "Like setting both ends of a thermostat schedule: a lowest and a highest point.",
  whenToUse: "Use it for price bands, date spans, or any from–to pair on one scale.",
  steps: {
    main: 'Wrap a RangeSliderTrack and two RangeSliderThumbs (thumb="start" and thumb="end") in RangeSlider with an aria-label.',
    supporting:
      "Give each thumb its own aria-label; the thumbs clamp at each other so the range cannot cross.",
    behavior:
      "Position the parts with the --comp0-range-slider-start and --comp0-range-slider-end fractions; pass name to submit both ends.",
    code: '<RangeSlider name="price" defaultValue={[20, 60]} aria-label="Price range">\n  <RangeSliderTrack />\n  <RangeSliderThumb thumb="start" aria-label="Minimum price" />\n  <RangeSliderThumb thumb="end" aria-label="Maximum price" />\n</RangeSlider>;',
  },
  imports: ["RangeSlider", "RangeSliderThumb", "RangeSliderTrack"],
  snippet:
    '<RangeSlider name="price" defaultValue={[20, 60]} aria-label="Price range">\n  <RangeSliderTrack />\n  <RangeSliderThumb thumb="start" aria-label="Minimum price" />\n  <RangeSliderThumb thumb="end" aria-label="Maximum price" />\n</RangeSlider>;',
  parts: [
    p(
      "RangeSlider",
      "root",
      "Group that owns the [start, end] pair and exposes the thumb positions as --comp0-range-slider-start/--comp0-range-slider-end 0..1 fractions for styling.",
      true,
      false,
      [
        prop(
          "value / defaultValue",
          "[number, number]",
          "Controlled or initial [start, end] pair.",
        ),
        prop(
          "onChange",
          "(value: [number, number]) => void",
          "Receives the next [start, end] pair.",
        ),
        prop("min / max / step", "number", "Range bounds and step grid; default 0, 100, and 1."),
        prop(
          "name",
          "string",
          "Submits two hidden inputs named `${name}-start` and `${name}-end`.",
        ),
        prop("form", "string", "Associates both hidden values with a form by id."),
        prop(
          "orientation",
          '"horizontal" | "vertical"',
          'Announced direction; defaults to "horizontal".',
        ),
        prop("disabled", "boolean", "Disables both thumbs and the track."),
        prop("aria-label", "string", "Names the group for assistive technology; required."),
      ],
    ),
    p(
      "RangeSliderTrack",
      "region",
      "The rail the thumbs travel along; pressing it moves and focuses the nearest thumb.",
      true,
      false,
      [prop("className", "string", "Style the rail; position it relative to the root.")],
    ),
    p(
      "RangeSliderThumb",
      "input",
      "Focusable slider for one end of the range; its announced bounds interlock with the sibling so the thumbs never cross.",
      true,
      false,
      [
        prop("thumb", '"start" | "end"', "Which end of the range this thumb controls."),
        prop(
          "aria-label",
          "string",
          'Names this thumb, such as "Minimum price"; required per thumb.',
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves between the two thumbs." },
    { keys: ["ArrowRight"], action: "Increases the focused thumb by one step." },
    { keys: ["ArrowUp"], action: "Increases the focused thumb by one step." },
    { keys: ["ArrowLeft"], action: "Decreases the focused thumb by one step." },
    { keys: ["ArrowDown"], action: "Decreases the focused thumb by one step." },
    { keys: ["PageUp"], action: "Increases the focused thumb by ten steps." },
    { keys: ["PageDown"], action: "Decreases the focused thumb by ten steps." },
    {
      keys: ["Home"],
      action: "Moves the thumb to its own minimum: min for start, the start value for end.",
    },
    {
      keys: ["End"],
      action: "Moves the thumb to its own maximum: the end value for start, max for end.",
    },
  ],
  stateHooks: [
    {
      attribute: '[data-thumb="start"], [data-thumb="end"]',
      on: "RangeSliderThumb",
      meaning: "Which end of the range the thumb controls, so the two can be styled apart.",
    },
    {
      attribute: "[data-dragging]",
      on: "RangeSliderThumb",
      meaning: "The thumb is being dragged with a captured pointer.",
    },
    {
      attribute: "[data-disabled]",
      on: "RangeSlider, RangeSliderThumb",
      meaning: "The range slider is disabled.",
    },
    {
      attribute: "[data-orientation]",
      on: "RangeSlider, RangeSliderTrack",
      meaning: "The travel direction, horizontal or vertical.",
    },
    {
      attribute: ":focus-visible",
      on: "RangeSliderThumb",
      meaning: "The thumb has keyboard focus.",
    },
  ],
  form: "Submits two hidden inputs, `${name}-start` and `${name}-end`, carrying the pair.",
  accessibility: [
    "Name the group and both thumbs: an aria-label on RangeSlider and one per RangeSliderThumb.",
    "Each thumb announces interlocked bounds, so screen readers hear how far it can move right now.",
    "Show the selected values as visible text; the colored track alone is not enough.",
  ],
  related: ["slider", "number-field"],
});
