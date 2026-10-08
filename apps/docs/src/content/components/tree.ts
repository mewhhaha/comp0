import { component, p, prop } from "../define.js";

export default component({
  slug: "tree",
  title: "Tree",
  group: "navigation",
  summary: "A nested list where branches expand and collapse behind one tab stop.",
  analogy: "Like a filing cabinet: open a drawer to reveal the folders inside it.",
  whenToUse: "Use it for hierarchies such as file explorers, categories, or document outlines.",
  steps: {
    main: "Wrap top-level TreeItems in Tree and give it an aria-label.",
    supporting:
      "Nest a TreeGroup of child TreeItems inside an item to make it an expandable branch.",
    behavior:
      "Read the selection from onChange; pass defaultOpen, or open with onOpenChange, to manage the open branches. Clicking an expandable row selects it and toggles its branch.",
    code: '<Tree aria-label="Files" defaultOpen={["src"]}>\n  <TreeItem value="src">\n    src\n    <TreeGroup>\n      <TreeItem value="index">index.ts</TreeItem>\n    </TreeGroup>\n  </TreeItem>\n</Tree>;',
  },
  imports: ["Tree", "TreeGroup", "TreeItem"],
  snippet:
    '<Tree aria-label="Files" defaultOpen={["src"]}><TreeItem value="src">src<TreeGroup><TreeItem value="index">index.ts</TreeItem></TreeGroup></TreeItem><TreeItem value="readme">README.md</TreeItem></Tree>',
  parts: [
    p(
      "Tree",
      "root",
      "Hierarchy container and the tree's single tab stop; arrow keys walk visible rows.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the tree; nothing labels it automatically."),
        prop("value / defaultValue", "string", "Controlled or initial selected item."),
        prop("onChange", "(value: string) => void", "Receives the next selected item's value."),
        prop("open / defaultOpen", "string[]", "Controlled or initial open (expanded) items."),
        prop("onOpenChange", "(open: string[]) => void", "Receives the next open item values."),
      ],
    ),
    p(
      "TreeGroup",
      "region",
      "Container for one item's children; it gets the hidden attribute while its parent is collapsed.",
      true,
      true,
      [],
    ),
    p(
      "TreeItem",
      "item",
      "Selectable row; nesting a TreeGroup inside makes it an expandable branch.",
      true,
      false,
      [
        prop("value", "string", "This item's selection and expansion key."),
        prop("disabled", "boolean", "Disables the item and removes it from the arrow-key order."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from the row for typeahead when markup makes it ambiguous.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves into the tree to the active item; Tab again leaves." },
    { keys: ["ArrowDown"], action: "Moves to the next visible item without wrapping." },
    { keys: ["ArrowUp"], action: "Moves to the previous visible item without wrapping." },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action:
        "Inline-forward expands or enters a branch; inline-backward collapses or reaches its parent. Physical keys reverse in RTL.",
    },
    { keys: ["Home"], action: "Moves to the first visible item." },
    { keys: ["End"], action: "Moves to the last visible item." },
    { keys: ["Enter"], action: "Selects the focused item." },
    { keys: ["Space"], action: "Selects the focused item." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "TreeItem", meaning: "The item is selected." },
    { attribute: "[data-open]", on: "TreeItem", meaning: "The item's branch is open." },
    { attribute: "[data-disabled]", on: "TreeItem", meaning: "The item is disabled." },
    {
      attribute: ":focus-visible",
      on: "TreeItem",
      meaning: "The item has visible keyboard focus.",
    },
  ],
  form: "Selection does not create a native form value; mirror it into a hidden input when a form needs it.",
  accessibility: [
    "Give the tree an aria-label that names the hierarchy, such as Project files.",
    "Levels, positions, and expansion state are announced automatically; keep each row's visible text meaningful on its own and pass textValue when markup obscures it.",
    "Clicking an expandable row both selects it and toggles its branch. The inline-forward arrow expands and inline-backward collapses, so the physical keys reverse in RTL; avoid extra click targets inside rows.",
  ],
  related: ["grid-list", "list-box"],
  moreExamples: [
    {
      id: "activity",
      title: "Live execution tree",
      description:
        "Show nested work as an arrow-key tree while a progress bar and polite status report meaningful workflow transitions instead of every low-level update.",
    },
  ],
});
