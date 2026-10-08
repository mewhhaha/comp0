import { component, p, prop } from "../define.js";

export default component({
  slug: "tree-grid",
  title: "Tree Grid",
  group: "navigation",
  summary: "A hierarchical table where each row can expand, select, and reveal more columns.",
  analogy:
    "Like a project file browser: folders unfold while file details stay lined up in columns.",
  whenToUse:
    "Use it for structured hierarchies where columns such as owner, status, or modified date matter alongside the tree.",
  steps: {
    main: "Start TreeGrid with an aria-label, then add a header TreeGridRowGroup with TreeGridColumn cells.",
    supporting:
      "Render data rows flat in a second TreeGridRowGroup; give each TreeGridRow a unique value and use parentValue to describe its parent.",
    behavior:
      "Use value/onChange for selection and defaultOpen, or open with onOpenChange, for branches. Arrow keys move through visible rows, then into their cells.",
    code: '<TreeGrid aria-label="Project files" defaultOpen={["src"]}>\n  <TreeGridRowGroup as="thead">\n    <TreeGridRow>\n      <TreeGridColumn>Name</TreeGridColumn>\n    </TreeGridRow>\n  </TreeGridRowGroup>\n  <TreeGridRowGroup>\n    <TreeGridRow value="src">\n      <TreeGridCell>src</TreeGridCell>\n    </TreeGridRow>\n    <TreeGridRow value="index" parentValue="src">\n      <TreeGridCell>index.ts</TreeGridCell>\n    </TreeGridRow>\n  </TreeGridRowGroup>\n</TreeGrid>;',
  },
  imports: ["TreeGrid", "TreeGridRow", "TreeGridCell", "TreeGridColumn", "TreeGridRowGroup"],
  snippet:
    '<TreeGrid aria-label="Project files" defaultOpen={["src"]}><TreeGridRowGroup as="thead"><TreeGridRow><TreeGridColumn>Name</TreeGridColumn><TreeGridColumn>Type</TreeGridColumn></TreeGridRow></TreeGridRowGroup><TreeGridRowGroup><TreeGridRow value="src"><TreeGridCell>src</TreeGridCell><TreeGridCell>Folder</TreeGridCell></TreeGridRow><TreeGridRow value="index" parentValue="src"><TreeGridCell>index.ts</TreeGridCell><TreeGridCell>File</TreeGridCell></TreeGridRow></TreeGridRowGroup></TreeGrid>',
  parts: [
    p(
      "TreeGrid",
      "root",
      "Native table with treegrid semantics, one roving row or cell focus stop, and controlled selection and open rows.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the hierarchy; nothing labels it automatically."),
        prop("value / defaultValue", "string", "Controlled or initial selected row value."),
        prop("onChange", "(value: string) => void", "Receives the next selected row value."),
        prop(
          "open / defaultOpen",
          "string[]",
          "Controlled or initial open (expanded) parent-row values.",
        ),
        prop(
          "onOpenChange",
          "(open: string[]) => void",
          "Receives the next open parent-row values.",
        ),
      ],
    ),
    p(
      "TreeGridRowGroup",
      "root",
      'Native table section for header or data rows; use as="thead" for column headers.',
      true,
      false,
      [
        prop(
          "as",
          "ElementType",
          "Section element to render; defaults to tbody, use thead for headers.",
        ),
      ],
    ),
    p("TreeGridRow", "item", "Header row or selectable hierarchical data row.", true, false, [
      prop("value", "string", "Unique data-row identity; omit it for the column-header row."),
      prop("parentValue", "string", "Parent row value; rows stay flat and in DOM order."),
      prop("disabled", "boolean", "Removes the row from selection and keyboard navigation."),
    ]),
    p("TreeGridColumn", "item", "Native th column header with treegrid semantics."),
    p("TreeGridCell", "item", "Native td data cell and grid focus target."),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Moves into the tree grid at its active row or cell; Tab again leaves.",
    },
    {
      keys: ["ArrowDown"],
      action: "Moves to the next visible row, preserving the focused column.",
    },
    {
      keys: ["ArrowUp"],
      action: "Moves to the previous visible row, preserving the focused column.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action:
        "Inline-forward expands or enters cells; inline-backward moves through cells, collapses, or reaches the parent. Physical keys reverse in RTL.",
    },
    {
      keys: ["Home"],
      action: "Moves to the first visible row or first cell in the current row.",
    },
    { keys: ["End"], action: "Moves to the last visible row or last cell in the current row." },
    {
      keys: ["Ctrl", "Home"],
      action: "Moves to the first visible row while preserving the focused column.",
    },
    {
      keys: ["Ctrl", "End"],
      action: "Moves to the last visible row while preserving the focused column.",
    },
    { keys: ["Enter", "Space"], action: "Selects the focused row." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "TreeGridRow", meaning: "The row is selected." },
    { attribute: "[data-open]", on: "TreeGridRow", meaning: "The row’s branch is open." },
    { attribute: "[data-disabled]", on: "TreeGridRow", meaning: "The row is disabled." },
    {
      attribute: ":focus-visible",
      on: "TreeGridRow, TreeGridCell",
      meaning: "The row or cell has keyboard focus.",
    },
  ],
  form: "Selection does not create a native form value; mirror it into a hidden input when a form needs it.",
  accessibility: [
    "Give the TreeGrid an aria-label that names the hierarchy, such as Project files, and use TreeGridColumn for every column header.",
    "Rows announce their level, position, expansion, and selection automatically; keep the visible text in each row meaningful without its parent.",
    "The inline-forward arrow expands a row or enters its first cell, and inline-backward collapses it or returns to its parent; these are ArrowRight and ArrowLeft in LTR, reversed in RTL. Avoid buttons and links inside cells unless their independent keyboard behavior is essential.",
  ],
  related: ["tree", "table", "grid-list"],
});
