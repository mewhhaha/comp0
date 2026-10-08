import { component, p, prop } from "../define.js";

export default component({
  slug: "steps",
  title: "Steps",
  group: "navigation",
  summary: "A numbered trail through a fixed process, showing one panel at a time.",
  analogy: "Like the stops printed on a boarding pass: done, you are here, still to come.",
  whenToUse: "Use it for checkout, signup, and other flows people finish in order.",
  steps: {
    main: "Start Steps with the value of the first step.",
    supporting:
      "Put one StepsItem per step inside StepsList, and give each StepsPanel the matching value.",
    behavior:
      "Advance the value from your own Continue button; every item before it marks itself completed.",
    code: '<Steps defaultValue="shipping">\n  <StepsList>\n    <StepsItem value="shipping">\n      <StepsTrigger>Shipping</StepsTrigger>\n    </StepsItem>\n  </StepsList>\n  <StepsPanel value="shipping">Address form</StepsPanel>\n</Steps>;',
  },
  imports: ["Steps", "StepsItem", "StepsList", "StepsPanel", "StepsTrigger"],
  snippet:
    '<Steps defaultValue="shipping">\n  <StepsList>\n    <StepsItem value="shipping">\n      <StepsTrigger>Shipping</StepsTrigger>\n    </StepsItem>\n  </StepsList>\n  <StepsPanel value="shipping">Address form</StepsPanel>\n</Steps>;',
  parts: [
    p("Steps", "root", "Current-step provider.", false, false, [
      prop("value / defaultValue", "string", "Controlled or initial current step."),
      prop("onChange", "(value: string) => void", "Receives the next step value."),
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's data attributes; without it the root renders no DOM and DOM props are a type error.",
      ),
    ]),
    p("StepsList", "root", "Native ordered list; the sequence itself is meaningful.", true, false, [
      prop("aria-label", "string", "Names the process for assistive technology."),
    ]),
    p(
      "StepsItem",
      "item",
      "List item for one step; items register in document order, so each knows its position and whether it is completed.",
      true,
      false,
      [prop("value", "string", "Identity that pairs this item with its panel.")],
    ),
    p("StepsTrigger", "trigger", "Optional button that jumps back to its step.", true, true, [
      prop("disabled", "boolean", "Keeps the step visible but not activatable."),
      prop("as", "ElementType", "Renders another element with button behavior attached."),
    ]),
    p("StepsPanel", "region", "Content for one step; hidden unless current.", true, true, [
      prop("value", "string", "The step this panel belongs to."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves focus through the step triggers." },
    { keys: ["Enter"], action: "Activates the focused step." },
    { keys: ["Space"], action: "Activates the focused step." },
  ],
  stateHooks: [
    { attribute: "[data-current]", on: "StepsItem", meaning: "This is the current step." },
    {
      attribute: "[data-completed]",
      on: "StepsItem",
      meaning: "This step comes before the current one.",
    },
    {
      attribute: "[data-step]",
      on: "StepsItem",
      meaning: "The item's 1-based position, for numbering.",
    },
    {
      attribute: "[aria-current]",
      on: "StepsTrigger",
      meaning: "The trigger belongs to the current step.",
    },
  ],
  form: "No native form behavior; the panels hold the real form fields.",
  accessibility: [
    'StepsTrigger marks the current step with aria-current="step"; do not duplicate that state manually.',
    "Each panel is labelled by its step item, so keep the visible step names meaningful.",
    "Only render StepsTrigger for steps that are safe to return to; use plain text for locked steps.",
    "Show completed and current states with more than color; the numbered circles or a checkmark carry the order.",
  ],
  related: ["tabs", "accordion", "progress-bar"],
  moreExamples: [
    {
      id: "generated-surface",
      title: "Constrained generated UI",
      description:
        "Stream a typed description into a trusted local registry that renders headings, summaries, steps, and actions without executing arbitrary generated code.",
    },
  ],
});
