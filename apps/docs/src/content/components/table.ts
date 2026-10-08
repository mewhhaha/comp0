import { component, p, prop } from "../define.js";

export default component({
  slug: "table",
  title: "Table",
  group: "navigation",
  summary: "A native table you can walk cell by cell from the keyboard.",
  analogy: "Like a spreadsheet: one focus that moves in two directions.",
  whenToUse: "Use it for records where rows and columns both carry meaning.",
  steps: {
    main: "Start Table with TableHeader and one TableColumn per column.",
    supporting: "Add a TableRow of TableCell parts to TableBody for each record.",
    behavior: "Arrow keys move one cell; Home and End travel the row; Ctrl jumps to the corners.",
    code: '<Table aria-label="People">\n  <TableHeader>\n    <TableRow>\n      <TableColumn>Name</TableColumn>\n    </TableRow>\n  </TableHeader>\n  <TableBody>\n    <TableRow>\n      <TableCell>Ada</TableCell>\n    </TableRow>\n  </TableBody>\n</Table>;',
  },
  imports: [
    "Checkbox",
    "TableCaption",
    "Table",
    "TableBody",
    "TableCell",
    "TableColumn",
    "TableFooter",
    "Resizer",
    "TableHeader",
    "TableRow",
    "TableRowHeader",
  ],
  snippet:
    "<Table><TableCaption>People</TableCaption><TableHeader><TableRow><TableColumn>Name</TableColumn></TableRow></TableHeader><TableBody><TableRow><TableRowHeader>Ada</TableRowHeader></TableRow></TableBody><TableFooter><TableRow><TableCell>1 person</TableCell></TableRow></TableFooter></Table>",
  parts: [
    p("Table", "root", "Native table with the grid role and one tab stop.", true, false, [
      prop("aria-label", "string", "Names the table when there is no visible caption."),
      prop(
        "onRangeSelect",
        "(values: string[]) => void",
        "Receives anchor-to-row values on Shift+Click and Shift+ArrowUp/Down.",
      ),
    ]),
    p("TableCaption", "label", "Native caption that names the table.", true, true),
    p("TableHeader", "root", "Native thead holding the column header row."),
    p("TableColumn", "item", "Native th column header and grid cell.", true, false, [
      prop(
        "sort",
        '"ascending" | "descending" | "none"',
        "Current sort, exposed as aria-sort; you sort the rows.",
      ),
      prop("onSort", "() => void", "Runs on click, Enter, or Space."),
      prop(
        "onResize",
        "(width: number) => void",
        "Receives the next width from Shift+Arrow or a resizer drag.",
      ),
    ]),
    p("Resizer", "trigger", "Optional drag handle inside a resizable column.", true, true),
    p("TableBody", "root", "Native tbody holding the data rows."),
    p("TableRow", "item", "Native tr in either section.", true, false, [
      prop(
        "selected",
        "boolean",
        "Marks the row selected for aria and styling; you own the state.",
      ),
      prop("value", "string", "Row identity reported by onRangeSelect."),
    ]),
    p("TableRowHeader", "item", "Native th with scope=row for a row label and grid focus."),
    p("TableCell", "item", "Native td data cell and grid focus target."),
    p("TableFooter", "root", "Native tfoot for totals or summary rows.", true, true),
  ],
  keyboard: [
    { keys: ["ArrowRight"], action: "Moves visually right through cells and their controls." },
    { keys: ["ArrowLeft"], action: "Moves visually left through cells and their controls." },
    { keys: ["ArrowDown"], action: "Moves one cell down the column." },
    { keys: ["ArrowUp"], action: "Moves one cell up the column." },
    { keys: ["Home"], action: "Moves to the first cell in the row." },
    { keys: ["End"], action: "Moves to the last cell in the row." },
    { keys: ["Ctrl", "Home"], action: "Moves to the first cell of the table." },
    { keys: ["Ctrl", "End"], action: "Moves to the last cell of the table." },
  ],
  stateHooks: [
    {
      attribute: ":focus-visible",
      on: "TableColumn, TableCell",
      meaning: "The cell has keyboard focus.",
    },
  ],
  form: "No native form behavior; it presents data.",
  accessibility: [
    "Give the table an aria-label or a visible caption.",
    "Keep column headers in TableColumn so cells inherit their names.",
    "Horizontal arrows follow visual direction and reverse their DOM-order movement in RTL.",
    "Keep the focused cell visible while arrowing through the grid.",
  ],
  related: ["grid-list", "list-box"],
});
