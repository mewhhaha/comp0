import { component, p, prop } from "../define.js";

export default component({
  slug: "split-button",
  title: "Split Button",
  group: "actions",
  summary: "A default-action button paired with a menu of alternatives.",
  analogy:
    "Like a door with a handle and a keypad: push for the usual way in, or open the options.",
  whenToUse:
    "Use it when one action is the common choice but a few related ones should stay one reach away.",
  steps: {
    main: "Wrap a Button and a Menu in SplitButton and give it an aria-label.",
    supporting:
      "Put the default action on the Button; give the MenuTrigger its own name such as More options.",
    behavior:
      "Arrow keys move between the two segments as one tab stop; the menu opens from its own button.",
    code: '<SplitButton aria-label="Save">\n  <Button onClick={save}>Save</Button>\n  <Menu>\n    <MenuTrigger aria-label="More save options">▾</MenuTrigger>\n    <MenuPopover>\n      <MenuList>\n        <MenuItem onClick={saveAs}>Save as…</MenuItem>\n      </MenuList>\n    </MenuPopover>\n  </Menu>\n</SplitButton>;',
  },
  imports: ["Button", "Menu", "MenuItem", "MenuList", "MenuPopover", "MenuTrigger", "SplitButton"],
  snippet:
    '<SplitButton aria-label="Save"><Button onClick={save}>Save</Button><Menu><MenuTrigger aria-label="More save options">▾</MenuTrigger><MenuPopover><MenuList><MenuItem onClick={saveAs}>Save as…</MenuItem><MenuItem onClick={saveCopy}>Save a copy…</MenuItem></MenuList></MenuPopover></Menu></SplitButton>',
  parts: [
    p(
      "SplitButton",
      "root",
      "Groups the default button and the menu button as one tab stop; arrow keys move between them.",
      true,
      false,
      [prop("aria-label", "string", "Names the whole control for assistive technology.")],
    ),
    p(
      "Button",
      "trigger",
      "The default action; disabling it drops it from the arrow-key order.",
      true,
      false,
      [
        prop("onClick", "(event) => void", "Runs the default action."),
        prop("disabled", "boolean", "Removes this segment from the tab stop."),
      ],
    ),
    p("MenuTrigger", "trigger", "The menu button that opens the alternatives.", true, false, [
      prop("aria-label", "string", "Names the menu segment, distinct from the default action."),
    ]),
    p(
      "MenuPopover / MenuList / MenuItem",
      "content",
      "The floating surface, action list, and alternative actions from the Menu family.",
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Moves into the control at the last-used segment; Tab again leaves.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next segment without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous segment without wrapping." },
    { keys: ["Home"], action: "Moves to the first segment." },
    { keys: ["End"], action: "Moves to the last segment." },
    {
      keys: ["ArrowDown", "ArrowUp"],
      action: "Opens the menu from the menu button.",
      scope: "menu button",
    },
    { keys: ["Enter"], action: "Presses the focused segment." },
    { keys: ["Space"], action: "Presses the focused segment." },
  ],
  stateHooks: [],
  form: "A split button does not create form values; its buttons submit their own.",
  accessibility: [
    "Give SplitButton an aria-label and the menu button its own distinct name.",
    "Keep the default action first so it reads and roves before the menu button.",
    "Offer the menu's actions somewhere else too; a hidden menu is easy to miss.",
  ],
  related: ["button", "menu", "toolbar"],
});
