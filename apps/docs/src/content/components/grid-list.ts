import { component, p, prop } from "../define.js";

export default component({
  slug: "grid-list",
  title: "Grid List",
  group: "navigation",
  summary: "A list of rows where each row can hold its own controls.",
  analogy: "Like a file manager: pick a row, or use the tools sitting on it.",
  whenToUse: "Use it when rows need buttons or fields inside them; use ListBox for plain options.",
  steps: {
    main: "Start GridList with an aria-label.",
    supporting: "Add a GridListItem with a value for each row.",
    behavior:
      "For a board, wrap named lists in GridListReorderGroup and add GridListMoveButton controls alongside an optional labelled drag grip.",
    code: '<GridList aria-label="Files">\n  <GridListItem value="report">report.pdf</GridListItem>\n</GridList>;',
  },
  imports: [
    "GridList",
    "GridListDragHandle",
    "GridListItem",
    "GridListMoveButton",
    "GridListReorderGroup",
  ],
  snippet:
    '<GridListReorderGroup value={columns} onChange={setColumns}><GridList name="todo" aria-label="To do"><GridListItem value="report"><GridListDragHandle />report.pdf<GridListMoveButton to="done">Move to done</GridListMoveButton></GridListItem></GridList><GridList name="done" aria-label="Done" /></GridListReorderGroup>',
  parts: [
    p(
      "GridListReorderGroup",
      "root",
      "Context-only owner for one atomic order shared by multiple named lists.",
      false,
      false,
      [
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element around the lists; without it the group renders no DOM and DOM props are a type error.",
        ),
        prop(
          "value",
          "Record<string, readonly string[]>",
          "Current row order keyed by GridList name; row values are unique across the group.",
        ),
        prop(
          "onChange",
          "(value, move) => void",
          "Receives the complete next order and one move descriptor for local or cross-list moves.",
        ),
        prop(
          "pending",
          "boolean",
          "Keeps a proposed move locked while an asynchronous owner decides; retaining value after pending clears rejects it.",
        ),
        prop(
          "canMove",
          "(value, move) => boolean",
          "Vetoes a proposed complete order for drag-and-drop, Alt+Arrow reorders, and GridListMoveButton moves.",
        ),
      ],
    ),
    p("GridList", "root", "Grid container and the list's single tab stop.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("aria-label", "string", "Names the grid; nothing labels it automatically."),
      prop("name", "string", "Column key required when the list is inside GridListReorderGroup."),
      prop("value / defaultValue", "string", "Controlled or initial selected row."),
      prop("onChange", "(value: string) => void", "Receives the next selected row."),
      prop(
        "onReorder",
        "(values: string[]) => void",
        "Receives the full new row order; providing it makes rows draggable and movable with Alt+Arrow keys, with moves announced to screen readers.",
      ),
      prop(
        "canReorder",
        "(values: string[], moved: string) => boolean",
        "Vetoes a proposed order: blocked drop positions show no drop preview and blocked keyboard moves are announced but not applied.",
      ),
    ]),
    p("GridListItem", "item", "Selectable row that can hold its own controls.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("value", "string", "This row’s selection key; required."),
      prop("id", "string", "The row's DOM id; generated when omitted."),
      prop("disabled", "boolean", "Disables the row."),
      prop(
        "draggable",
        "boolean",
        "Set false to keep the row selectable while excluding it from reordering.",
      ),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
    p(
      "GridListDragHandle",
      "trigger",
      "Optional labelled button that gives a row an explicit drag affordance; pointer drags can also start on non-interactive parts of the row body.",
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
    p(
      "GridListMoveButton",
      "trigger",
      "Optional click, tap, and keyboard path for appending a row to another named list.",
      true,
      true,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("to", "string", "Destination GridList name."),
        prop("aria-label", "string", "Names the row and destination for an icon-only control."),
      ],
    ),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Moves to the next row." },
    { keys: ["ArrowUp"], action: "Moves to the previous row." },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Moves into or out of row controls; inline direction mirrors in RTL.",
    },
    { keys: ["Home"], action: "Moves to the first row." },
    { keys: ["End"], action: "Moves to the last row." },
    { keys: ["Enter"], action: "Selects the focused row." },
    { keys: ["Space"], action: "Selects the focused row." },
    { keys: ["Alt", "ArrowUp"], action: "Moves the row up.", scope: "while reorderable" },
    {
      keys: ["Alt", "ArrowDown"],
      action: "Moves the row down.",
      scope: "while reorderable",
    },
    {
      keys: ["Enter"],
      action: "Moves the row to the named destination.",
      scope: "on GridListMoveButton",
    },
    {
      keys: ["Space"],
      action: "Moves the row to the named destination.",
      scope: "on GridListMoveButton",
    },
    {
      keys: ["Enter"],
      action: "Starts moving the row, then drops it at the chosen position.",
      scope: "on GridListDragHandle",
    },
    {
      keys: ["ArrowUp", "ArrowDown"],
      action: "Chooses a position in the list while moving.",
      scope: "on GridListDragHandle",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Chooses a position in a neighboring list while moving.",
      scope: "on GridListDragHandle, in a group",
    },
    {
      keys: ["Escape"],
      action: "Cancels the move.",
      scope: "on GridListDragHandle",
    },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "GridListItem", meaning: "The row is selected." },
    { attribute: "[data-disabled]", on: "GridListItem", meaning: "The row is disabled." },
    { attribute: "[data-dragging]", on: "GridListItem", meaning: "The row is being dragged." },
    {
      attribute: "[data-drag-previewing]",
      on: "GridListItem",
      meaning: "The dragged row has a valid destination; order: 1 in a flex column moves it there.",
    },
    {
      attribute: "[data-drop-target]",
      on: "GridList",
      meaning: "The dragged row will be inserted in this list, including when it is empty.",
    },
    {
      attribute: "[data-drop-before]",
      on: "GridListItem",
      meaning:
        "The dragged row will drop before this row; order: 2 on it and its later siblings completes the preview.",
    },
    {
      attribute: "[data-drop-after]",
      on: "GridListItem",
      meaning:
        "The dragged row will drop after this row; order: 2 on its later siblings completes the preview.",
    },
    {
      attribute: "[data-drop-preview]",
      on: "GridListItem",
      meaning: "The dragged row label, available for an in-flow destination preview.",
    },
    {
      attribute: "[data-drop-preview]",
      on: "GridList",
      meaning:
        "The dragged row label while this list is the drop target, for an insertion slot between the order bands.",
    },
    {
      attribute: ":focus-visible",
      on: "GridListItem, GridListDragHandle, GridListMoveButton",
      meaning: "The row or a control in it has keyboard focus.",
    },
  ],
  form: "Selection does not create a native form value; mirror it into a hidden input when a form needs it.",
  accessibility: [
    "Give the grid an aria-label when it has no visible heading.",
    "Keep row focus and row selection visibly distinct.",
    "Reach row controls with the inline-forward arrow: ArrowRight in LTR and ArrowLeft in RTL. Do not add extra tab stops.",
    "Reordering never requires a pointer: Alt+Arrow moves the focused row and a live region announces its new position.",
    "Enter on the drag handle starts a keyboard move: arrows choose a position — across lists in a group — with the same drop preview pointer drags show, Enter drops, Escape cancels, and every step is announced.",
    "For cross-list moves, render GridListMoveButton controls so the same operation works with a click, tap, Enter, or Space without dragging.",
  ],
  related: ["list-box", "table"],
  moreExamples: [
    {
      id: "reorder",
      title: "Reorder a list",
      description:
        "onReorder makes rows movable; drag any non-interactive part of a row, use the labelled grip as an explicit affordance, or press Alt+Arrow. draggable={false} excludes pinned notes.txt from reordering, while canReorder keeps other rows from displacing it.",
    },
    {
      id: "kanban",
      title: "Kanban board",
      description:
        "GridListReorderGroup owns one controlled order for all columns. Drag cards for precise placement, use Alt+Arrow within a column, or activate the arrow buttons to move without dragging.",
    },
    {
      id: "transfer-list",
      title: "Transfer list",
      description:
        "Compose two named Grid Lists for a transfer list. Checkboxes provide bulk selection, ordinary buttons move the selected rows, and each row retains the group's pointer, keyboard, and direct move paths.",
    },
    {
      id: "files",
      title: "File rows with actions",
      description:
        "Use Grid List when a selectable row needs its own link and controls. ArrowRight enters those interactive elements without turning the collection into a plain list of options.",
    },
  ],
});
