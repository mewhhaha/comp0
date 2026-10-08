import { component, p, prop } from "../define.js";

export default component({
  slug: "menubar",
  title: "Menubar",
  group: "navigation",
  summary: "A horizontal bar of menus that behaves like one desktop-style menu strip.",
  analogy:
    "Like the File / Edit / View strip at the top of a desktop app: one reach, many drawers.",
  whenToUse: "Use it when an application area offers several persistent groups of commands.",
  steps: {
    main: "Wrap your Menu components in Menubar and give the bar an aria-label.",
    supporting:
      "Each Menu keeps its usual MenuTrigger, MenuPopover, and MenuList; the trigger becomes the bar's menuitem automatically.",
    behavior:
      "Arrow keys rove the bar with one tab stop, and once a menu is open the openness follows focus to its neighbors.",
    code: '<Menubar aria-label="Notes">\n  <Menu>\n    <MenuTrigger>File</MenuTrigger>\n    <MenuPopover>\n      <MenuList>\n        <MenuItem>New note</MenuItem>\n      </MenuList>\n    </MenuPopover>\n  </Menu>\n</Menubar>;',
  },
  imports: [
    "Menu",
    "MenuItem",
    "MenuList",
    "MenuPopover",
    "MenuSeparator",
    "MenuTrigger",
    "Menubar",
  ],
  snippet:
    '<Menubar aria-label="Notes"><Menu><MenuTrigger>File</MenuTrigger><MenuPopover placement="bottom start"><MenuList><MenuItem>New note</MenuItem></MenuList></MenuPopover></Menu><Menu><MenuTrigger>Edit</MenuTrigger><MenuPopover placement="bottom start"><MenuList><MenuItem>Undo</MenuItem></MenuList></MenuPopover></Menu></Menubar>',
  parts: [
    p(
      "Menubar",
      "root",
      "Horizontal bar of menus that shares one tab stop; while a menu is open, openness follows focus across the bar.",
      true,
      false,
      [
        prop(
          "aria-label",
          "string",
          "Names the bar after the application area it commands, such as Notes.",
        ),
      ],
    ),
    p(
      "Menu",
      "root",
      "Open-state provider for one bar item; the same Menu component used standalone.",
      false,
      false,
      [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element that carries the root's data attributes; without it the root renders no DOM and DOM props are a type error.",
        ),
      ],
    ),
    p(
      "MenuTrigger",
      "trigger",
      "Inside a Menubar it renders as the bar's menuitem and joins the roving tab stop.",
      true,
      false,
      [prop("disabled", "boolean", "Disables opening and skips the item when arrowing.")],
    ),
    p("MenuPopover", "content", "Floating surface opened below its bar item.", true, false, [
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, usually "bottom start"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the bar item and the menu."),
    ]),
    p("MenuList", "root", "Menu collection inside the surface.", true, true),
    p("MenuSeparator", "label", "Rule between groups of items.", true, true),
    p("MenuItem", "item", "Action item.", true, false, [
      prop("onClick", "(event) => void", "Runs the action; preventDefault keeps the menu open."),
      prop("value", "string", "Optional identity for typeahead and data-value."),
      prop("disabled", "boolean", "Disables the action."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves into the bar to the last-used item; Tab again leaves." },
    {
      keys: ["ArrowRight"],
      action: "Moves to the item on the visual right, wrapping; while open, switches menus.",
    },
    {
      keys: ["ArrowLeft"],
      action: "Moves to the item on the visual left, wrapping; while open, switches menus.",
    },
    { keys: ["ArrowDown"], action: "Opens the focused item's menu and focuses the first item." },
    { keys: ["ArrowUp"], action: "Opens the focused item's menu and focuses the last item." },
    { keys: ["Enter"], action: "Opens the focused item's menu and focuses the first item." },
    { keys: ["Space"], action: "Opens the focused item's menu and focuses the first item." },
    { keys: ["Home"], action: "Moves to the first item." },
    { keys: ["End"], action: "Moves to the last item." },
    {
      keys: ["Escape"],
      action: "Closes the open menu and returns focus to its bar item.",
      scope: "open menu",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Opens inline-forward or closes inline-backward; physical keys reverse in RTL.",
      scope: "submenu",
    },
  ],
  stateHooks: [
    { attribute: "[data-open]", on: "MenuTrigger, MenuPopover", meaning: "That menu is open." },
    {
      attribute: ":popover-open",
      on: "MenuPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    {
      attribute: ":focus-visible",
      on: "MenuTrigger, MenuItem",
      meaning: "The item has visible keyboard focus.",
    },
    {
      attribute: "[data-disabled]",
      on: "MenuTrigger, MenuItem",
      meaning: "The item is disabled.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Give the menubar an aria-label naming the area it commands, such as Notes.",
    "Keep the bar for persistent application commands; a row of unrelated buttons should be a toolbar instead.",
    "Keep bar items in a visual order that matches the arrow-key order.",
    "Horizontal bar and submenu arrows mirror automatically in RTL.",
  ],
  related: ["menu"],
});
