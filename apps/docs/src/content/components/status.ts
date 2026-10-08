import { component, p, prop } from "../define.js";

export default component({
  slug: "status",
  title: "Status",
  group: "actions",
  summary:
    "A polite live message for advisory feedback that should not interrupt the current task.",
  analogy: "Like a quiet confirmation that a draft was saved.",
  whenToUse: "Use it for saves, background updates, and other useful but non-urgent results.",
  steps: {
    main: "Mount Status when new advisory information is ready.",
    supporting: "Keep its message short and visible as well as announced.",
    behavior: "Use Alert instead only when the message genuinely demands immediate attention.",
    code: "{\n  saved && <Status>Draft saved.</Status>;\n}",
  },
  imports: ["Button", "Status"],
  snippet: "{\n  saved && <Status>Draft saved.</Status>;\n}",
  parts: [
    p("Status", "feedback", "Polite live message rendered with role=status.", true, false, [
      prop("children", "ReactNode", "Visible advisory message."),
      prop(
        "as",
        "ElementType",
        "Renders another element in place of the default; Fragment merges the props into its single child.",
      ),
    ]),
  ],
  keyboard: [],
  stateHooks: [],
  form: "No form value; use it to report an advisory form or application result.",
  accessibility: [
    "Mount or update Status for advisory information that should wait until the current announcement finishes.",
    "Keep the same result visible instead of relying on the live announcement alone.",
    "Use Alert only when delaying the message could cause a real problem.",
  ],
  related: ["alert", "progress-bar", "toast"],
  moreExamples: [
    {
      id: "approval-request",
      title: "Inline approval request",
      description:
        "Compose advisory status, expandable evidence, and one-shot actions into a human approval checkpoint that resolves without opening a modal or stealing focus.",
    },
  ],
});
