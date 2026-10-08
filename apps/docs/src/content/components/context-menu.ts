import { component, p, prop } from "../define.js";

export default component({
  slug: "context-menu",
  title: "Context Menu",
  group: "navigation",
  summary: "A menu opened from a right click instead of a button.",
  analogy:
    "Like flipping something over at a workbench: the tools for that exact spot appear under your hand.",
  whenToUse: "Use it for secondary actions on an object that already has a primary interaction.",
  steps: {
    main: "Wrap the right-clickable area in ContextMenuTrigger inside a ContextMenu.",
    supporting: "Put a labelled MenuList inside MenuPopover; no button labels the list for you.",
    behavior:
      "Anchor the popover at the pointer yourself: position: fixed with left/top from the exposed --comp0-context-menu-x/y variables.",
    code: '<ContextMenu>\n  <ContextMenuTrigger tabIndex={0}>Attachment</ContextMenuTrigger>\n  <MenuPopover\n    style={{\n      position: "fixed",\n      inset: "auto",\n      margin: 0,\n      left: "var(--comp0-context-menu-x)",\n      top: "var(--comp0-context-menu-y)",\n    }}\n  >\n    <MenuList aria-label="Attachment actions">\n      <MenuItem>Download</MenuItem>\n    </MenuList>\n  </MenuPopover>\n</ContextMenu>;',
  },
  imports: ["ContextMenu", "ContextMenuTrigger", "MenuItem", "MenuList", "MenuPopover"],
  snippet:
    '<ContextMenu><ContextMenuTrigger tabIndex={0}>Right-click here</ContextMenuTrigger><MenuPopover className="context-menu"><MenuList aria-label="Attachment actions"><MenuItem>Download</MenuItem></MenuList></MenuPopover></ContextMenu>',
  parts: [
    p(
      "ContextMenu",
      "root",
      "Open-state provider without a trigger button; it records the pointer position and restores focus on close.",
      false,
      false,
      [
        prop("id", "string", "Base for the generated trigger and list ids."),
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element that carries the root's data attributes; without it the root renders no DOM and DOM props are a type error.",
        ),
      ],
    ),
    p(
      "ContextMenuTrigger",
      "trigger",
      "The right-clickable area: a plain div that opens the menu at the pointer on contextmenu, or from the keyboard with Shift+F10.",
      true,
      false,
      [
        prop(
          "tabIndex",
          "number",
          "Give the area (or something inside it) a tab stop so keyboard users can reach the menu.",
        ),
      ],
    ),
    p(
      "MenuPopover",
      "content",
      "Floating surface. The recorded position arrives as --comp0-context-menu-x/y px values on this element; anchor it yourself with position: fixed; left: var(--comp0-context-menu-x); top: var(--comp0-context-menu-y).",
      true,
      false,
      [
        prop(
          "className / style",
          "string / CSSProperties",
          "Position the popover from the exposed CSS variables; no placement is applied for you.",
        ),
        prop(
          "placement / offset",
          "PopoverPlacement / number",
          "Anchor-positioning options; not needed here because you position the popover from the exposed CSS variables.",
        ),
      ],
    ),
    p("MenuList", "root", "Menu collection inside the positioned surface.", true, true, [
      prop("aria-label", "string", "Names the menu; required because no trigger button labels it."),
    ]),
    p("MenuItem", "item", "Action item.", true, false, [
      prop("onClick", "(event) => void", "Runs the action; preventDefault keeps the menu open."),
      prop("value", "string", "Optional identity for typeahead and data-value."),
      prop("disabled", "boolean", "Disables the action."),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
  ],
  keyboard: [
    {
      keys: ["Shift", "F10"],
      action: "Opens the menu at the focused element.",
      scope: "trigger area",
    },
    {
      keys: ["ContextMenu"],
      action: "Opens the menu at the focused element.",
      scope: "trigger area",
    },
    { keys: ["ArrowDown"], action: "Moves to the next item." },
    { keys: ["ArrowUp"], action: "Moves to the previous item." },
    { keys: ["Home"], action: "Moves to the first item." },
    { keys: ["End"], action: "Moves to the last item." },
    { keys: ["Enter"], action: "Activates the focused item." },
    { keys: ["Space"], action: "Activates the focused item." },
    { keys: ["Escape"], action: "Closes and restores focus to where it was." },
    { keys: ["Tab"], action: "Closes the menu and moves on." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "ContextMenuTrigger, MenuPopover",
      meaning: "The menu is open.",
    },
    {
      attribute: ":popover-open",
      on: "MenuPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    {
      attribute: "--comp0-context-menu-x/y",
      on: "MenuPopover",
      meaning: "The recorded pointer position in px, for your positioning CSS.",
    },
    {
      attribute: ":focus-visible",
      on: "MenuItem",
      meaning: "The item has visible keyboard focus.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Give the MenuList an aria-label; a context menu has no trigger button to borrow a name from.",
    "Keep the trigger area keyboard-reachable (tabIndex={0}) so Shift+F10 can open the menu without a mouse.",
    "Offer the same actions somewhere visible; right-click alone is not discoverable.",
  ],
  related: ["menu"],
});
