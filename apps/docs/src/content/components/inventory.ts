import { component, p, prop } from "../define.js";

export default component({
  slug: "inventory",
  title: "Inventory",
  group: "navigation",
  summary: "A uniform spatial grid whose cards can move and span more rows or columns.",
  analogy:
    "Like arranging labelled crates on warehouse shelving: every crate occupies known slots, and larger crates reserve several together.",
  whenToUse:
    "Use it for customizable dashboards and boards where position and size must persist as grid units.",
  steps: {
    main: "Start Inventory with its column count, row count, and a complete layout.",
    supporting:
      "Render one InventoryItem per layout value; arrow between cards, then Tab through the focused card's optional move and resize handles.",
    behavior:
      "Add InventoryPreview for a styleable pointer or active keyboard landing overlay; blocked placements stay put and only the preview becomes invalid.",
    code: '<Inventory columns={6} rows={6} value={layout} onChange={setLayout}>\n  <InventoryPreview />\n  <InventoryItem value="sales" textValue="Sales">\n    <InventoryMoveHandle />\n    Sales\n    <InventoryResizeHandle />\n  </InventoryItem>\n</Inventory>;',
  },
  imports: [
    "Inventory",
    "InventoryItem",
    "InventoryMoveHandle",
    "InventoryPreview",
    "InventoryResizeHandle",
  ],
  snippet:
    '<Inventory columns={6} rows={6} value={layout} onChange={setLayout}><InventoryPreview /><InventoryItem value="sales" textValue="Sales"><InventoryMoveHandle />Sales<InventoryResizeHandle /></InventoryItem></Inventory>',
  parts: [
    p(
      "Inventory",
      "root",
      "Controlled or uncontrolled owner for one spatial list layout.",
      true,
      false,
      [
        prop("columns / rows", "number", "Positive integer bounds for the uniform grid."),
        prop(
          "value / defaultValue",
          "InventoryLayout",
          "Complete positions and spans as one-based grid units.",
        ),
        prop(
          "onChange",
          "(value: InventoryLayout) => void",
          "Receives the complete next layout during movement and resizing.",
        ),
        prop(
          "canChange",
          "(value, changedValue) => boolean",
          "Vetoes a proposed complete layout before it is emitted.",
        ),
      ],
    ),
    p(
      "InventoryItem",
      "item",
      "Roving-focus native list item placed from its matching layout entry.",
      true,
      false,
      [
        prop("value", "string", "Unique key matching one Inventory layout entry."),
        prop(
          "textValue",
          "string",
          "Readable card name used by default handle labels and announcements.",
        ),
      ],
    ),
    p(
      "InventoryPreview",
      "item",
      "Optional aria-hidden list item placed over the current provisional target.",
      true,
      true,
    ),
    p(
      "InventoryMoveHandle",
      "trigger",
      "Native button that moves its item by whole grid cells.",
      true,
      true,
    ),
    p(
      "InventoryResizeHandle",
      "trigger",
      "Native button that changes its item's row and column spans.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves focus to the closest item in that visual direction.",
      scope: "on InventoryItem",
    },
    {
      keys: ["Tab"],
      action: "Steps through the focused item's controls, then leaves Inventory.",
      scope: "on InventoryItem or one of its controls",
    },
    {
      keys: ["Shift", "Tab"],
      action: "Steps backward through the focused item's controls and back to its item.",
      scope: "on an InventoryItem control",
    },
    {
      keys: ["Enter", "Space"],
      action: "Starts moving or resizing; pressing it again commits the change.",
      scope: "on an Inventory move or resize handle",
    },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves the item one cell while movement is active.",
      scope: "on an active InventoryMoveHandle",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Shrinks or grows the column span while resizing is active.",
      scope: "on an active InventoryResizeHandle",
    },
    {
      keys: ["ArrowUp", "ArrowDown"],
      action: "Shrinks or grows the row span while resizing is active.",
      scope: "on an active InventoryResizeHandle",
    },
    {
      keys: ["Escape"],
      action:
        "Cancels an active interaction and restores its starting layout; leaving the handle does the same.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-column] / [data-row]",
      on: "InventoryItem",
      meaning: "The item's one-based grid position.",
    },
    {
      attribute: "[data-column-span] / [data-row-span]",
      on: "InventoryItem",
      meaning: "The number of grid tracks occupied by the item.",
    },
    {
      attribute: "[data-column] / [data-row]",
      on: "InventoryPreview",
      meaning: "The proposed landing position.",
    },
    {
      attribute: "[data-column-span] / [data-row-span]",
      on: "InventoryPreview",
      meaning: "The proposed landing size.",
    },
    {
      attribute: "[data-dragging]",
      on: "Inventory, InventoryItem, InventoryMoveHandle",
      meaning: "A pointer drag or armed keyboard move is in progress.",
    },
    {
      attribute: "[data-resizing]",
      on: "Inventory, InventoryItem, InventoryResizeHandle",
      meaning: "A pointer drag or armed keyboard resize is in progress.",
    },
    {
      attribute: "[data-invalid-placement]",
      on: "InventoryPreview",
      meaning: "The proposed position cannot fit or was vetoed.",
    },
  ],
  form: "Inventory does not create a form value; persist its layout in application state or storage.",
  accessibility: [
    "Give Inventory an aria-label or aria-labelledby; it renders a native ordered list with one roving item tab stop rather than claiming ARIA grid behavior.",
    "Arrow keys move item focus by persisted visual position. Tab enters the focused item's controls and leaves Inventory after its last control.",
    "Keep both handles visible and clearly named. Enter or Space activates one, arrows adjust its item, and Enter or Space commits the change.",
    "InventoryPreview is aria-hidden; use its valid and invalid styling only as visual reinforcement for the live announcements.",
    "Keep item DOM order meaningful even when visual positions change, and announce saved ordering separately when reading order must also change.",
    "A fixed spatial grid may need horizontal scrolling on narrow screens; do not silently rewrite persisted coordinates for visual responsiveness.",
  ],
  related: ["grid-list", "resizer"],
});
