import { component, p, prop } from "../define.js";

export default component({
  slug: "tour",
  title: "Tour",
  group: "pickers",
  summary: "A guided sequence of modal dialogs anchored to existing controls.",
  analogy: "Like a guide pointing out landmarks on a map while leaving the map itself intact.",
  whenToUse:
    "Use it for short, optional introductions to unfamiliar product areas; use inline help for instructions people need repeatedly.",
  steps: {
    main: "Declare the ordered steps once with stable target names, titles, descriptions, and placements.",
    supporting:
      "Mark existing controls with matching data-tour-target attributes and add TourTrigger wherever the tour starts.",
    behavior:
      "Render the current step through TourContent; its state supplies progress, navigation, dismissal, target anchoring, and final focus restoration.",
    code: '<Tour steps={steps}>\n  <TourTrigger>Start tour</TourTrigger>\n  <Button data-tour-target="search">Search</Button>\n  <TourContent aria-label="Product tour">\n    {({ step, next }) => <Button onClick={next}>{step.title}</Button>}\n  </TourContent>\n</Tour>;',
  },
  imports: ["Tour", "TourTrigger", "TourContent"],
  snippet:
    '<Tour steps={steps}><TourTrigger>Start tour</TourTrigger><button data-tour-target="search">Search</button><TourContent aria-label="Product tour">{({ step, next }) => <button onClick={next}>{step.title}</button>}</TourContent></Tour>',
  parts: [
    p(
      "Tour",
      "root",
      "Wrapper-free owner for the current step, external target anchor, and focus restoration.",
      false,
      false,
      [
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element that carries the root's data attributes and DOM props; without it the root renders no DOM.",
        ),
        prop(
          "steps",
          "readonly TourStep[]",
          "Ordered target, title, description, and placement definitions; target names must be unique.",
        ),
        prop("value", "number | null", "Controlled active step index; null closes the tour."),
        prop(
          "defaultValue",
          "number | null",
          "Initial uncontrolled step index; null keeps the tour closed.",
        ),
        prop(
          "onChange",
          "(step: number | null) => void",
          "Receives each step change and null when the tour closes.",
        ),
      ],
    ),
    p("TourTrigger", "trigger", "Button that starts the tour at its first step.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger behavior onto your own element child.",
      ),
    ]),
    p(
      "TourContent",
      "content",
      "Modal dialog anchored to the current external target.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("aria-label", "string", "Accessible name for the guided sequence."),
        prop("offset", "number", "Pixel gap between the active target and the dialog."),
        prop(
          "children",
          "ReactNode | (state: TourState) => ReactNode",
          "Static content or a render function receiving the step, position, and navigation actions.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Starts the tour from TourTrigger." },
    { keys: ["Space"], action: "Starts the tour from TourTrigger." },
    { keys: ["Tab"], action: "Cycles through controls in the step dialog." },
    { keys: ["Escape"], action: "Closes the tour and restores TourTrigger focus." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "TourTrigger",
      meaning: "The tour is open.",
    },
    {
      attribute: "[data-open]",
      on: "TourContent",
      meaning: "The step dialog is visible.",
    },
    {
      attribute: "[data-step]",
      on: "TourContent",
      meaning: "The zero-based active step index.",
    },
    {
      attribute: "[data-target]",
      on: "TourContent",
      meaning: "The active step's target name.",
    },
    {
      attribute: "[data-first]",
      on: "TourContent",
      meaning: "The first step is active.",
    },
    {
      attribute: "[data-last]",
      on: "TourContent",
      meaning: "The final step is active.",
    },
    {
      attribute: "[data-tour-active]",
      on: "Tour",
      meaning: "Applied to the external data-tour-target element for spotlight styling.",
    },
  ],
  form: "No native form behavior; controls targeted by the tour retain their existing behavior.",
  accessibility: [
    "Keep tours optional, short, and dismissible; do not hide required instructions exclusively inside a tour.",
    "Give every application target one unique, stable data-tour-target value that matches its step definition.",
    "Give TourContent an accessible name that describes the whole tour, while each step keeps a visible title.",
    "Tour moves focus into the active dialog and restores the TourTrigger when the sequence closes.",
  ],
  related: ["popover", "steps", "tooltip"],
});
