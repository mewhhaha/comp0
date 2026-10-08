import { component, p, prop } from "../define.js";

export default component({
  slug: "visually-hidden",
  title: "Visually Hidden",
  group: "actions",
  summary: "Extra words that screen readers can hear but sighted people do not see.",
  analogy: "Like a quiet backstage narrator.",
  whenToUse: "Use it for helpful context that would make the visible screen noisy.",
  steps: {
    main: "Write the missing context first.",
    supporting: "Wrap only that extra text.",
    behavior: "Keep the visible control and its normal label visible.",
    code: "<VisuallyHidden>Loading messages</VisuallyHidden>;",
  },
  imports: ["VisuallyHidden"],
  snippet: "<VisuallyHidden>Loading messages</VisuallyHidden>;",
  parts: [
    p(
      "VisuallyHidden",
      "root",
      "Wrapper that hides children visually but keeps them available to assistive technology.",
      true,
      false,
      [
        prop(
          "focusable",
          "boolean",
          "Reveals the content while it or a descendant has focus, as a skip link does.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [],
  form: "No form behavior.",
  accessibility: [
    "Use it for extra context, not to hide essential visible instructions.",
    "Do not accidentally hide the only focusable control.",
    "Keep hidden text short and useful.",
  ],
  related: ["tooltip", "button"],
});
