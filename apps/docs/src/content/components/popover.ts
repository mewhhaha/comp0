import { component, p, prop } from "../define.js";

export default component({
  slug: "popover",
  title: "Popover",
  group: "pickers",
  summary: "A small non-modal layer attached to a trigger.",
  analogy: "Like a note that pops out beside the thing it explains.",
  whenToUse: "Use it for extra controls or detail that should not block the page.",
  steps: {
    main: "Start Popover with PopoverTrigger.",
    supporting: "Put PopoverContent after it and pick a placement such as bottom start.",
    behavior: "Use a visible label for the trigger.",
    code: '<Popover>\n  <PopoverTrigger>More</PopoverTrigger>\n  <PopoverContent placement="bottom start" offset={8}>\n    <PopoverArrow />\n    Extra choices\n  </PopoverContent>\n</Popover>;',
  },
  imports: ["Popover", "PopoverArrow", "PopoverContent", "PopoverTrigger"],
  snippet:
    "<Popover><PopoverTrigger>More</PopoverTrigger><PopoverContent><PopoverArrow />Extra choices</PopoverContent></Popover>",
  parts: [
    p("Popover", "root", "Non-modal open-state provider.", false, false, [
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
    p("PopoverTrigger", "trigger", "Button that opens content.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p("PopoverContent", "content", "Non-modal floating content.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop(
        "aria-label",
        "string",
        "Accessible name; the content is a dialog with no default name.",
      ),
      prop("popover", '"auto" | "manual" | "none"', "Top-layer mode; auto by default."),
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "bottom start"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the surface."),
    ]),
    p("PopoverArrow", "content", "Optional decorative arrow inside PopoverContent.", true, true, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens or closes from trigger." },
    { keys: ["Space"], action: "Opens or closes from trigger." },
    { keys: ["Escape"], action: "Closes and restores trigger focus." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "PopoverTrigger, PopoverContent",
      meaning: "The popover is open.",
    },
    {
      attribute: ":popover-open",
      on: "PopoverContent",
      meaning: "Native pseudo-class equivalent.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Name the trigger so people know what opens.",
    "Do not put essential instructions only in a popover.",
    "PopoverArrow is decorative and should not carry meaning.",
  ],
  related: ["dialog", "menu", "tooltip"],
});
