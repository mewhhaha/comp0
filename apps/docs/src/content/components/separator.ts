import { component, p, prop } from "../define.js";

export default component({
  slug: "separator",
  title: "Separator",
  group: "actions",
  summary: "A native rule that divides content into visually distinct groups.",
  analogy: "Like the printed line between sections on a paper form.",
  whenToUse: "Use it between groups of content or controls that should read as distinct.",
  steps: {
    main: "Place Separator between the groups it divides.",
    supporting:
      'Set orientation="vertical" between items in a horizontal row and give it a width and height.',
    behavior:
      'Pass role="presentation" when the line is purely decorative so nothing extra is announced.',
    code: '<Separator orientation="vertical" />;',
  },
  imports: ["Separator"],
  snippet: "<Separator />",
  parts: [
    p(
      "Separator",
      "root",
      "Native hr, or a div with the separator role when vertical.",
      true,
      false,
      [
        prop(
          "orientation",
          '"horizontal" | "vertical"',
          'Rendering direction; vertical renders a div with aria-orientation="vertical".',
        ),
        prop("role", "string", 'Pass "presentation" when the rule is purely decorative.'),
        prop(
          "className",
          "string",
          "Styles the rule; a vertical separator needs its own width and height.",
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
  stateHooks: [
    {
      attribute: "[data-orientation]",
      on: "Separator",
      meaning: 'The rendering direction: "horizontal" or "vertical".',
    },
  ],
  form: "No form behavior.",
  accessibility: [
    "Keep it non-focusable; a separator conveys grouping, not interaction.",
    'Use role="presentation" for lines that are only decoration.',
    "Do not rely on the line alone to explain a relationship; name groups when it matters.",
  ],
  related: ["toolbar", "menu"],
});
