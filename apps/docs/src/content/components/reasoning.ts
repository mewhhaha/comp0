import { component, p, prop } from "../define.js";

export default component({
  slug: "reasoning",
  title: "Reasoning",
  group: "navigation",
  summary: "A collapsed disclosure for a model's reasoning or tool activity, busy while it thinks.",
  analogy: "Like a 'show your work' flap that is closed until you ask.",
  whenToUse:
    "Use it for optional model thinking or tool traces. For ordinary extra details use Disclosure.",
  steps: {
    main: "Wrap ReasoningSummary and ReasoningContent in Reasoning.",
    supporting: "Write the summary yourself: 'Thinking…' while busy, then 'Thought for 4 seconds'.",
    behavior:
      "Set busy while the model thinks. It stays collapsed until the user opens it and never moves focus.",
    code: '<Reasoning busy={thinking}>\n  <ReasoningSummary>{thinking ? "Thinking…" : "Thought for 4 seconds"}</ReasoningSummary>\n  <ReasoningContent>{steps}</ReasoningContent>\n</Reasoning>;',
  },
  imports: ["Reasoning", "ReasoningContent", "ReasoningSummary"],
  snippet:
    "<Reasoning><ReasoningSummary>Thought for 4 seconds</ReasoningSummary><ReasoningContent>Checked each total twice.</ReasoningContent></Reasoning>",
  parts: [
    p("Reasoning", "root", "Native details element, collapsed by default.", true, false, [
      prop(
        "busy",
        "boolean",
        "The model is still thinking: sets aria-busy and holds nested warnings and focus moves.",
      ),
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p(
      "ReasoningSummary",
      "trigger",
      "Summary element that toggles the reasoning; its text states the phase.",
    ),
    p("ReasoningContent", "region", "The revealed reasoning or tool activity."),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Toggles the reasoning." },
    { keys: ["Space"], action: "Toggles the reasoning." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "Reasoning, ReasoningSummary, ReasoningContent",
      meaning: "The reasoning is open.",
    },
    {
      attribute: "[data-busy]",
      on: "Reasoning",
      meaning: "The model is thinking, or an ancestor is busy.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "The summary text is the status: change it when thinking ends so the new state is exposed to assistive technology.",
    "It never opens itself or takes focus while busy.",
    "Do not put controls inside the summary.",
  ],
  related: ["disclosure", "message", "messages"],
});
