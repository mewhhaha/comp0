import { component, p, prop } from "../define.js";

export default component({
  slug: "tooltip",
  title: "Tooltip",
  group: "pickers",
  summary: "A short description revealed from an existing control.",
  analogy: "Like a tiny sticky note that appears when you pause over an icon.",
  whenToUse: "Use it for brief help, never for essential instructions.",
  steps: {
    main: "Start Tooltip with the control people already use.",
    supporting:
      "Add TooltipContent with one short explanation, placed on the side you want, and a TooltipArrow caret styled to point back at the trigger.",
    behavior: "Give an icon-only trigger its own aria-label too.",
    code: '<Tooltip>\n  <TooltipTrigger aria-label="More information">i</TooltipTrigger>\n  <TooltipContent placement="top" offset={6}>\n    Helpful detail\n    <TooltipArrow />\n  </TooltipContent>\n</Tooltip>;',
  },
  imports: ["Tooltip", "TooltipArrow", "TooltipContent", "TooltipTrigger"],
  snippet:
    '<Tooltip>\n  <TooltipTrigger aria-label="More information">i</TooltipTrigger>\n  <TooltipContent placement="top" offset={6}>\n    Helpful detail\n    <TooltipArrow />\n  </TooltipContent>\n</Tooltip>;',
  parts: [
    p("Tooltip", "root", "Open-state provider.", false, false, [
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's data attributes and DOM props; without it the root renders no DOM.",
      ),
      prop(
        "id",
        "string",
        "Base for the generated trigger and content ids; also the wrapper id when as is set.",
      ),
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p("TooltipTrigger", "trigger", "Element that reveals help on focus or hover.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p("TooltipContent", "content", "Short descriptive text.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "top" or "bottom start"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the tooltip."),
    ]),
    p(
      "TooltipArrow",
      "content",
      "Optional decorative caret inside TooltipContent; style it to point at the trigger.",
      true,
      true,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Escape"], action: "Closes the tooltip." },
    { keys: ["Tab"], action: "Focus reveals the tooltip on its trigger." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "TooltipTrigger, TooltipContent",
      meaning: "The tooltip is visible.",
    },
    {
      attribute: ":popover-open",
      on: "TooltipContent",
      meaning: "Native pseudo-class equivalent.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Give the trigger its own accessible name.",
    "Keep tooltip text brief and descriptive.",
    "Do not put required interactive content inside a tooltip.",
    "When the trigger is inline text, merge TooltipTrigger onto a focusable element so keyboard users can reveal the same description as pointer users.",
  ],
  related: ["popover", "visually-hidden"],
  moreExamples: [
    {
      id: "type-info",
      title: "Type information",
      description:
        "Merge the trigger onto a focusable inline code symbol and position a brief type description beside it.",
    },
  ],
});
