import { component, p, prop } from "../define.js";

export default component({
  slug: "preview",
  title: "Preview",
  group: "pickers",
  summary: "A rich card revealed by pausing on a link.",
  analogy: "Like peeking through a shop window before deciding to walk in.",
  whenToUse: "Use it to show what a link leads to, such as a profile or package card.",
  steps: {
    main: "Start Preview around the link people already follow.",
    supporting:
      "Give PreviewTrigger the real href and put the card in PreviewContent with a placement.",
    behavior: "Keep the link useful on its own; the card is a bonus, not the destination.",
    code: '<Preview>\n  <PreviewTrigger href="/users/ada">@ada</PreviewTrigger>\n  <PreviewContent placement="bottom start" offset={8}>\n    Ada Lovelace, first programmer\n  </PreviewContent>\n</Preview>;',
  },
  imports: ["Preview", "PreviewContent", "PreviewTrigger"],
  snippet:
    '<Preview>\n  <PreviewTrigger href="/users/ada">@ada</PreviewTrigger>\n  <PreviewContent placement="bottom start" offset={8}>\n    Ada Lovelace, first programmer\n  </PreviewContent>\n</Preview>;',
  parts: [
    p("Preview", "root", "Open-state provider with hover-intent timing.", false, false, [
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
      prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
      prop(
        "openDelay",
        "number",
        "Milliseconds the pointer must rest before opening; 600 by default. Focus opens immediately. Negative values warn in development and count as 0.",
      ),
      prop(
        "closeDelay",
        "number",
        "Milliseconds after the pointer or focus leaves before closing; 300 by default. Negative values warn in development and count as 0.",
      ),
    ]),
    p(
      "PreviewTrigger",
      "trigger",
      "Link that reveals the card on hover intent or focus.",
      true,
      false,
      [
        prop("href", "string", "Real destination; the preview never replaces it."),
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ],
    ),
    p("PreviewContent", "content", "Rich card that may hold interactive content.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "bottom start"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the card."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Focus reveals the card on its trigger." },
    { keys: ["Escape"], action: "Closes the card." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "PreviewTrigger, PreviewContent",
      meaning: "The card is visible.",
    },
  ],
  form: "Previews never hold form values; they only describe what a link leads to.",
  accessibility: [
    "Keep the trigger a real link with a clear name; the card must stay optional.",
    "Do not put content in the card that is not reachable another way.",
    "Escape closes the card from anywhere, and it stays open while hovered or focused (WCAG 1.4.13).",
  ],
  related: ["tooltip", "popover", "link"],
});
