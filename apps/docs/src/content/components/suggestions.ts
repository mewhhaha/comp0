import { component, p, prop } from "../define.js";

export default component({
  slug: "suggestions",
  title: "Suggestions",
  group: "actions",
  summary: "Quick replies: a labelled group of buttons that each send a value.",
  analogy: "Like the suggested answers under a chat message.",
  whenToUse:
    "Use it for a few short follow-ups the assistant proposes. For longer sets use a ListBox or Menu.",
  steps: {
    main: "Wrap Suggestion buttons in Suggestions and give the group an aria-label.",
    supporting: "Give each Suggestion a value, which is what gets sent, and visible text.",
    behavior: "Handle onSend on the root and disable the group while a reply is generating.",
    code: '<Suggestions aria-label="Quick replies" onSend={send} disabled={generating}>\n  <Suggestion value="Summarize this">Summarize</Suggestion>\n</Suggestions>;',
  },
  imports: ["Suggestion", "Suggestions"],
  snippet:
    '<Suggestions aria-label="Quick replies" onSend={(text) => console.log(text)}><Suggestion value="Tell me more">More</Suggestion><Suggestion value="Thanks">Thanks</Suggestion></Suggestions>',
  parts: [
    p("Suggestions", "root", "Labelled group that receives the chosen value.", true, false, [
      prop("onSend", "(value: string) => void", "Called with the value of the chosen suggestion."),
      prop("disabled", "boolean", "Disables every suggestion."),
      prop("as", "ElementType", "Renders another element in place of the div."),
    ]),
    p("Suggestion", "item", "A quick reply button.", true, false, [
      prop("value", "string", "Text sent through onSend; the children are the visible label."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves between suggestions in the normal tab order." },
    { keys: ["Enter"], action: "Sends the focused suggestion." },
    { keys: ["Space"], action: "Sends the focused suggestion." },
  ],
  stateHooks: [
    {
      attribute: "[data-disabled]",
      on: "Suggestions, Suggestion",
      meaning: "The group or suggestion is disabled.",
    },
  ],
  form: "Suggestions are plain buttons and submit nothing.",
  accessibility: [
    "Name the group; the buttons keep the normal tab order instead of a hidden arrow-key toolbar.",
    "Use visible text that makes sense out of context, since the value may differ from the label.",
    "Disable the group, rather than removing it, while a reply is generating so focus is not lost.",
  ],
  related: ["composer", "messages", "toolbar"],
});
