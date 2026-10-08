import { component, p, prop } from "../define.js";

export default component({
  slug: "alert",
  title: "Alert",
  group: "actions",
  summary: "An assertive live message for important feedback that needs immediate attention.",
  analogy: "Like a clear interruption when a payment fails.",
  whenToUse: "Use it for urgent failures or changes people must know about before continuing.",
  steps: {
    main: "Mount Alert when the important message becomes true.",
    supporting: "Write a concise message that includes the next useful action.",
    behavior:
      "Reserve Alert for urgency; use Status for ordinary confirmations and progress updates.",
    code: "{\n  failed && <Alert>Payment failed. Check the card details and try again.</Alert>;\n}",
  },
  imports: ["Alert", "Button"],
  snippet:
    "{\n  failed && <Alert>Payment failed. Check the card details and try again.</Alert>;\n}",
  parts: [
    p("Alert", "feedback", "Assertive live message rendered with role=alert.", true, false, [
      prop("children", "ReactNode", "Visible urgent message and any recovery action."),
      prop(
        "as",
        "ElementType",
        "Renders another element in place of the default; Fragment merges the props into its single child.",
      ),
    ]),
  ],
  keyboard: [],
  stateHooks: [],
  form: "No form value; use it to report an important form or application result.",
  accessibility: [
    "Mount Alert when new urgent information appears; content present before assistive technology starts observing may not be announced as a change.",
    "Reserve assertive interruption for failures and time-sensitive consequences, not routine confirmation.",
    "Keep the message visible and include a clear recovery action when one exists.",
  ],
  related: ["status", "error-summary", "toast"],
});
