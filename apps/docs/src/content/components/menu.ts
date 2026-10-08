import { component, p, prop } from "../define.js";

export default component({
  slug: "menu",
  title: "Menu",
  group: "navigation",
  summary: "A compact list of actions opened by a button.",
  analogy: "Like a restaurant menu: choose an action, then the menu goes away.",
  whenToUse: "Use it for actions, not choosing a persistent form value.",
  steps: {
    main: "Start Menu with MenuTrigger.",
    supporting: "Place MenuPopover after the trigger, then put MenuItem children inside MenuList.",
    behavior: "Give MenuList an aria-label when its purpose is not obvious.",
    code: '<Menu>\n  <MenuTrigger>Actions</MenuTrigger>\n  <MenuPopover>\n    <MenuList aria-label="Actions">\n      <MenuItem>Archive</MenuItem>\n    </MenuList>\n  </MenuPopover>\n</Menu>;',
  },
  imports: [
    "Menu",
    "MenuPopover",
    "MenuList",
    "MenuItem",
    "MenuGroup",
    "MenuSeparator",
    "MenuTrigger",
  ],
  snippet:
    '<Menu>\n  <MenuTrigger>Actions</MenuTrigger>\n  <MenuPopover>\n    <MenuList aria-label="Actions">\n      <MenuItem>Archive</MenuItem>\n    </MenuList>\n  </MenuPopover>\n</Menu>;',
  parts: [
    p(
      "Menu",
      "root",
      "Open-state provider; nest a whole Menu inside a MenuPopover to create a submenu.",
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
      "Button that opens the menu; inside a parent menu it becomes the submenu item.",
      true,
      false,
      [
        prop("disabled", "boolean", "Disables opening."),
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ],
    ),
    p("MenuPopover", "content", "Role-less floating surface around the menu.", true, false, [
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "bottom start" or "right top" for submenus; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the menu."),
    ]),
    p("MenuList", "root", "Menu collection and keyboard interaction boundary.", true, true, [
      prop("aria-label", "string", "Names the menu when the trigger text is vague."),
      prop("id", "string", "Overrides the collection id targeted by the trigger."),
    ]),
    p("MenuGroup", "root", "Optional labelled section.", true, true, [
      prop("aria-label", "string", "Names the group of items."),
    ]),
    p("MenuSeparator", "label", "Rule between groups of items.", true, true),
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
    { keys: ["ArrowDown"], action: "Opens from the trigger to the first item, or moves down." },
    { keys: ["ArrowUp"], action: "Opens from the trigger to the last item, or moves up." },
    { keys: ["Home"], action: "Moves to the first item." },
    { keys: ["End"], action: "Moves to the last item." },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Opens inline-forward or closes inline-backward; physical keys reverse in RTL.",
      scope: "submenu",
    },
    { keys: ["Enter"], action: "Activates the focused item." },
    { keys: ["Space"], action: "Activates the focused item." },
    { keys: ["Escape"], action: "Closes and returns focus to trigger." },
    { keys: ["Tab"], action: "Closes the menu and moves on." },
  ],
  stateHooks: [
    { attribute: "[data-open]", on: "MenuTrigger, MenuPopover", meaning: "The menu is open." },
    {
      attribute: ":popover-open",
      on: "MenuPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    {
      attribute: ":focus-visible",
      on: "MenuItem",
      meaning: "The item has visible keyboard focus.",
    },
    { attribute: "[data-disabled]", on: "MenuItem", meaning: "The item is disabled." },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Give MenuList an aria-label when trigger text is vague.",
    "Use MenuItem for actions, not a form selection.",
    "Submenu open and close arrows mirror in RTL so they continue to follow the panel's visual direction.",
    "Return focus to the trigger when the menu closes.",
  ],
  related: ["list-box", "popover"],
});
