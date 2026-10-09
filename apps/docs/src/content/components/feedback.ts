import { component, p, prop } from "../define.js";

export default component({
  slug: "feedback",
  title: "Feedback",
  group: "actions",
  summary: "Rate a response with an exclusive pair of Good and Bad toggle buttons.",
  analogy: "Like thumbs-up and thumbs-down under an answer, where pressing one releases the other.",
  whenToUse:
    "Use it to collect a quick rating on a generated response. For more levels use Rating.",
  steps: {
    main: "Wrap two FeedbackButton parts in Feedback and name the group.",
    supporting:
      "Give the buttons text names: Good response and Bad response. Hide any icon from assistive technology.",
    behavior:
      "Control the rating with value and onChange; pressing the active button withdraws the rating.",
    code: '<Feedback aria-label="Rate this response" value={rating} onChange={setRating}>\n  <FeedbackButton value="good">Good response</FeedbackButton>\n  <FeedbackButton value="bad">Bad response</FeedbackButton>\n</Feedback>;',
  },
  imports: ["Feedback", "FeedbackButton"],
  snippet:
    '<Feedback aria-label="Rate this response"><FeedbackButton value="good">Good response</FeedbackButton><FeedbackButton value="bad">Bad response</FeedbackButton></Feedback>',
  parts: [
    p("Feedback", "root", "Group that holds at most one rating.", true, false, [
      prop(
        "value / defaultValue",
        '"good" | "bad" | ""',
        "Controlled or initial rating; empty is unrated.",
      ),
      prop("onChange", '(value: "good" | "bad" | "") => void', "Receives the next rating."),
      prop("as", "ElementType", "Renders another element in place of the div."),
    ]),
    p("FeedbackButton", "item", "A toggle button for one rating.", true, false, [
      prop("value", '"good" | "bad"', "The rating this button sets."),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Presses the focused button." },
    { keys: ["Space"], action: "Presses the focused button." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "FeedbackButton", meaning: "This rating is chosen." },
  ],
  form: "Feedback is not form-associated; send the rating from onChange.",
  accessibility: [
    "Each button announces its pressed state through aria-pressed.",
    "Icon-only buttons still need a text name such as Good response.",
    "Confirm that feedback was recorded with a Status message if the rating is sent to a server.",
  ],
  related: ["toggle-button", "rating", "messages"],
});
