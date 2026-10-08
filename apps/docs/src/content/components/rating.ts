import { component, p, prop } from "../define.js";

export default component({
  slug: "rating",
  title: "Rating",
  group: "fields",
  summary: "A star scale built from hidden native radios, one per step.",
  analogy: "Like a row of hotel stars you can point at and pick.",
  whenToUse: "Use it to collect one score on a small fixed scale, such as one to five stars.",
  steps: {
    main: "Put Rating where the score belongs and give it a name.",
    supporting:
      "Add one RatingItem per step with its number as value and a star glyph as children.",
    behavior:
      "Style the stars through [data-active], which covers every step up to the hovered or selected one; use readOnly to display a score without allowing changes.",
    code: '<Rating name="stay" defaultValue={3}>\n  <RatingItem value={1} inputProps={{ "aria-label": "1 of 5 stars" }}>\n    ★\n  </RatingItem>\n</Rating>;',
  },
  imports: ["Rating", "RatingItem"],
  snippet:
    '<Rating name="stay" defaultValue={3}>\n  <RatingItem value={1}>★</RatingItem>\n  <RatingItem value={2}>★</RatingItem>\n  <RatingItem value={3}>★</RatingItem>\n</Rating>;',
  parts: [
    p("Rating", "root", "Container that names and manages the star radios.", true, false, [
      prop("name", "string", "Shared submission name for the item radios; generated when absent."),
      prop("value / defaultValue", "number", "Controlled or initial rating; 0 means none."),
      prop("onChange", "(value: number) => void", "Receives the next rating."),
      prop("required", "boolean", "Requires one item in the group to be selected."),
      prop("readOnly", "boolean", "Keeps the items focusable while preventing changes."),
      prop("disabled", "boolean", "Disables every item."),
    ]),
    p("RatingItem", "item", "Star label around one hidden native radio.", true, false, [
      prop("value", "number", "The rating this item stands for; 0.5 steps are allowed."),
      prop(
        "inputProps",
        "InputHTMLAttributes",
        "Extra props for the hidden radio, such as aria-label.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown", "ArrowRight"], action: "Moves to and selects the next star." },
    { keys: ["ArrowUp", "ArrowLeft"], action: "Moves to and selects the previous star." },
    { keys: ["Space"], action: "Selects the focused star." },
  ],
  stateHooks: [
    {
      attribute: "[data-active]",
      on: "RatingItem",
      meaning: "This step is at or below the hovered or selected rating.",
    },
    { attribute: "[data-selected]", on: "RatingItem", meaning: "This step is the exact rating." },
    {
      attribute: "[data-focus-visible]",
      on: "RatingItem",
      meaning: "Focus should show a visible ring.",
    },
    { attribute: "[data-disabled]", on: "Rating", meaning: "The rating is disabled." },
    { attribute: "[data-readonly]", on: "Rating", meaning: "The rating cannot be changed." },
  ],
  form: "The checked radio submits Rating.name and its value.",
  accessibility: [
    "Give each hidden radio a spoken name such as 3 of 5 stars via inputProps.",
    "Show the picked score with more than color; the glyphs themselves should fill.",
    "Use readOnly for a score people can inspect but not change; it stays focusable.",
  ],
  related: ["radio", "slider", "toggle-button"],
});
