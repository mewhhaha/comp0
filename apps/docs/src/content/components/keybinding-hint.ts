import { component, p, prop } from "../define.js";

export default component({
  slug: "keybinding-hint",
  title: "Keybinding Hint",
  group: "actions",
  summary: "A visible, semantic reminder for a keyboard shortcut implemented elsewhere.",
  analogy: "Like the shortcut printed beside an application menu command.",
  whenToUse:
    "Use it beside actions that already respond to a discoverable, non-conflicting shortcut.",
  steps: {
    main: "Put KeybindingHint inside or beside the action it accelerates.",
    supporting:
      "Describe simultaneous keys with + and sequential chords with spaces; Mod displays as Command on Apple platforms and Control elsewhere.",
    behavior:
      "Put the real combinations on the action with aria-keyshortcuts and implement the keyboard behavior separately.",
    code: '<Button aria-keyshortcuts="Control+K Meta+K">\n  Search <KeybindingHint keys="Mod+K" />\n</Button>;',
  },
  imports: ["Button", "Input", "KeybindingHint", "Label", "TextField"],
  snippet:
    '<Button aria-keyshortcuts="Control+K Meta+K">\n  Search <KeybindingHint keys="Mod+K" />\n</Button>;',
  parts: [
    p(
      "KeybindingHint",
      "value",
      "Visible shortcut text composed from semantic kbd elements; it installs no keyboard behavior.",
      true,
      false,
      [
        prop(
          "keys",
          "string",
          "Chords joined by + and sequential chords separated by spaces; Mod adapts to the visitor's platform.",
        ),
        prop("aria-label", "string", "Overrides the generated spoken key description."),
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
  form: "No form behavior and no keyboard handler; the related action owns both.",
  accessibility: [
    "A hint only documents a shortcut; implement the same keys on the related action and expose them through aria-keyshortcuts.",
    "Avoid single-character global shortcuts. They can be triggered accidentally by speech input and must be disableable, remappable, or limited to a focused component.",
    "Do not override browser, operating-system, or assistive-technology shortcuts.",
  ],
  related: ["button", "visually-hidden"],
});
