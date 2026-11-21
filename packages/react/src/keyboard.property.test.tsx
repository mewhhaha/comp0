import type { ReactElement } from "react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  Button,
  GridList,
  GridListItem,
  Inventory,
  InventoryItem,
  InventoryMoveHandle,
  InventoryResizeHandle,
  ListBox,
  ListBoxOption,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Menubar,
  SplitButton,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TagList,
  Toolbar,
  Tree,
  TreeGrid,
  TreeGridCell,
  TreeGridRow,
  TreeGridRowGroup,
  TreeItem,
} from "./index.js";
import { cleanupRoots, setup } from "../test/render.js";

/**
 * Property tests for the keyboard contract every roving composite shares (WCAG 2.1.1 Keyboard,
 * 2.1.2 No Keyboard Trap, 2.4.3 Focus Order). fast-check generates the collection (size and
 * which items are disabled) and a sequence of navigation keys, then checks invariants after
 * every key instead of the handful of paths an example-based test happens to cover:
 *
 * - focus never leaves the composite on a navigation key, and never lands on a disabled item;
 * - the composite keeps exactly one tab stop, and it is the focused item;
 * - one Tab leaves the composite and one Shift+Tab returns to the item that was focused.
 *
 * A failure prints the shrunk counterexample (items, disabled set, keys) to replay by hand.
 *
 * Covered: ListBox, GridList, TagGroup, Tabs, Tree, TreeGrid, Menubar, Toolbar, SplitButton (its two
 * fixed parts), and Inventory, which has no disabled items and moves in two dimensions, so it has
 * its own generator (single-cell layouts on a grid) and checks each move against a model of the
 * nearest neighbour.
 *
 * Table (interactive) is left out by design: its cells are never disabled (`useTableCell` in
 * table/table-shared.tsx), so a generated disabled set has nothing to apply to. Its single
 * roving stop is pinned by table/table.composition.test.tsx.
 */

type Composite = {
  name: string;
  role: string;
  /** Navigation keys this composite is driven with; defaults to every arrow, Home and End. */
  keys?: readonly string[];
  /** Fixed part count, for a composite whose parts are set (SplitButton); defaults to 1–6 items. */
  size?: number;
  render: (labels: string[], disabled: boolean[]) => ReactElement;
};

const composites: Composite[] = [
  {
    name: "ListBox",
    role: "listbox",
    render: (labels, disabled) => (
      <ListBox aria-label="Items">
        {labels.map((label, index) => (
          <ListBoxOption key={label} value={label} disabled={disabled[index]}>
            {label}
          </ListBoxOption>
        ))}
      </ListBox>
    ),
  },
  {
    name: "GridList",
    role: "grid",
    render: (labels, disabled) => (
      <GridList aria-label="Items">
        {labels.map((label, index) => (
          <GridListItem key={label} value={label} disabled={disabled[index]}>
            {label}
          </GridListItem>
        ))}
      </GridList>
    ),
  },
  {
    name: "TagGroup",
    role: "grid",
    render: (labels, disabled) => (
      <TagGroup>
        <TagList aria-label="Items">
          {labels.map((label, index) => (
            <Tag key={label} value={label} disabled={disabled[index]}>
              {label}
            </Tag>
          ))}
        </TagList>
      </TagGroup>
    ),
  },
  {
    name: "Tabs",
    role: "tablist",
    render: (labels, disabled) => (
      <Tabs>
        <TabList aria-label="Items">
          {labels.map((label, index) => (
            <Tab key={label} value={label} disabled={disabled[index]}>
              {label}
            </Tab>
          ))}
        </TabList>
        {labels.map((label) => (
          <TabPanel key={label} value={label}>
            {label} panel
          </TabPanel>
        ))}
      </Tabs>
    ),
  },
  {
    name: "Tree",
    role: "tree",
    render: (labels, disabled) => (
      <Tree aria-label="Items">
        {labels.map((label, index) => (
          <TreeItem key={label} value={label} disabled={disabled[index]}>
            {label}
          </TreeItem>
        ))}
      </Tree>
    ),
  },
  {
    name: "TreeGrid",
    role: "treegrid",
    render: (labels, disabled) => (
      <TreeGrid aria-label="Items">
        <TreeGridRowGroup>
          {labels.map((label, index) => (
            <TreeGridRow key={label} value={label} disabled={disabled[index]}>
              <TreeGridCell>{label}</TreeGridCell>
              <TreeGridCell>{label} kind</TreeGridCell>
            </TreeGridRow>
          ))}
        </TreeGridRowGroup>
      </TreeGrid>
    ),
  },
  {
    name: "Menubar",
    role: "menubar",
    // ArrowDown, ArrowUp, Enter and Space open a menu, which moves focus into its popover by
    // design, so the bar is driven with its horizontal keys only.
    keys: ["{ArrowLeft}", "{ArrowRight}", "{Home}", "{End}"],
    render: (labels, disabled) => (
      <Menubar aria-label="Items">
        {labels.map((label, index) => (
          <Menu key={label} id={`item-${index + 1}`}>
            <MenuTrigger disabled={disabled[index]}>{label}</MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem>{label} command</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        ))}
      </Menubar>
    ),
  },
  {
    name: "Toolbar",
    role: "toolbar",
    render: (labels, disabled) => (
      <Toolbar aria-label="Items">
        {labels.map((label, index) => (
          <button key={label} type="button" disabled={disabled[index]}>
            {label}
          </button>
        ))}
      </Toolbar>
    ),
  },
  {
    name: "SplitButton",
    role: "group",
    // ArrowDown and ArrowUp on the menu trigger open its menu by design.
    keys: ["{ArrowLeft}", "{ArrowRight}", "{Home}", "{End}"],
    size: 2,
    render: (labels, disabled) => (
      <SplitButton aria-label="Items">
        <Button disabled={disabled[0]}>{labels[0]}</Button>
        <Menu id="split-menu">
          <MenuTrigger disabled={disabled[1]}>{labels[1]}</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>{labels[1]} command</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </SplitButton>
    ),
  },
];

const navigationKeys = [
  "{ArrowUp}",
  "{ArrowDown}",
  "{ArrowLeft}",
  "{ArrowRight}",
  "{Home}",
  "{End}",
  "{PageUp}",
  "{PageDown}",
] as const;

/** A collection of `min`–`max` items with at least one enabled, and 1–20 navigation keys. */
function scenario(keys: readonly string[], min: number, max: number) {
  return fc.integer({ min, max }).chain((size) =>
    fc.record({
      size: fc.constant(size),
      disabled: fc
        .array(fc.boolean(), { minLength: size, maxLength: size })
        .filter((flags) => flags.some((flag) => !flag)),
      keys: fc.array(fc.constantFrom(...keys), { minLength: 1, maxLength: 20 }),
    }),
  );
}

/**
 * Collections every composite must survive, run before the random cases: a single item, all but
 * one item disabled, and the first and last items disabled with Home and End pressed.
 */
function hostileScenarios(keys: readonly string[]) {
  const sequence = [...keys, "{Home}", "{End}"];
  return [
    [{ size: 1, disabled: [false], keys: sequence }],
    [{ size: 5, disabled: [true, true, false, true, true], keys: sequence }],
    [{ size: 4, disabled: [true, false, false, true], keys: sequence }],
  ];
}

/** For a fixed part count: every part enabled, then each part disabled on its own. */
function partScenarios(keys: readonly string[], size: number) {
  const sequence = [...keys, "{Home}", "{End}"];
  const parts = Array.from({ length: size }, (_, index) => index);
  return [
    [{ size, disabled: parts.map(() => false), keys: sequence }],
    ...parts.map((part) => [
      { size, disabled: parts.map((index) => index === part), keys: sequence },
    ]),
  ];
}

const isDisabled = (element: Element) =>
  element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";

describe.each(composites)(
  "$name keyboard invariants",
  ({ role, render, keys = navigationKeys, size }) => {
    const examples = size === undefined ? hostileScenarios(keys) : partScenarios(keys, size);
    it("keeps one tab stop on the focused enabled item and never traps focus", async () => {
      await fc.assert(
        fc.asyncProperty(
          scenario(keys, size ?? 1, size ?? 6),
          async ({ size, disabled, keys: sequence }) => {
            const labels = Array.from({ length: size }, (_, index) => `Item ${index + 1}`);
            const { container, user } = setup(
              <>
                <button type="button">Before</button>
                {render(labels, disabled)}
                <button type="button">After</button>
              </>,
            );
            try {
              const root = container.querySelector(`[role='${role}']`)!;
              const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
              const stops = () => [...root.querySelectorAll("[tabindex='0']")];

              await user.click(before!);
              await user.tab();
              expect(root.contains(document.activeElement), "Tab enters the composite").toBe(true);

              for (const key of sequence) {
                await user.keyboard(key);
                const active = document.activeElement!;
                expect(root.contains(active), `${key} keeps focus inside`).toBe(true);
                expect(isDisabled(active), `${key} skips disabled items`).toBe(false);
                expect(stops(), `${key} leaves one tab stop, on the focused item`).toEqual([
                  active,
                ]);
              }

              const focused = document.activeElement;
              await user.tab();
              // The next stop is the After button, or a tab panel, which is focusable by design.
              expect(root.contains(document.activeElement), "one Tab leaves the composite").toBe(
                false,
              );
              expect(document.activeElement, "one Tab leaves the composite").not.toBe(
                document.body,
              );
              await user.tab({ shift: true });
              expect(document.activeElement, "Shift+Tab returns to the same item").toBe(focused);
            } finally {
              cleanupRoots();
              document.body.innerHTML = "";
            }
          },
        ),
        { numRuns: 40, examples },
      );
      // 40 runs of user events take seconds on a loaded runner; a timed-out run keeps going and
      // would leak its DOM into the next test, so the budget is set here rather than left at 5s.
    }, 60_000);
  },
);

describe("SplitButton with both parts disabled", () => {
  // Like an all-disabled collection, which the generator above never produces, the group then
  // has no tab stop at all: Tab passes over it in both directions.
  it("has no tab stop and Tab passes over it", async () => {
    const { container, user } = setup(
      <>
        <button type="button">Before</button>
        <SplitButton aria-label="Save">
          <Button disabled>Save</Button>
          <Menu id="split-menu">
            <MenuTrigger disabled>More</MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem>Save as</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </SplitButton>
        <button type="button">After</button>
      </>,
    );
    const group = container.querySelector("[role='group']")!;
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");

    expect(group.querySelectorAll("[tabindex='0']")).toHaveLength(0);
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(after);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
  });
});

const arrowKeys = ["{ArrowUp}", "{ArrowDown}", "{ArrowLeft}", "{ArrowRight}"] as const;

type Cell = { value: string; column: number; row: number };

/**
 * The card an arrow key should reach in a layout of single-cell cards, modelled from the
 * contract rather than from inventory-navigation.ts: of the cards strictly ahead in the key's
 * direction, the one fewest rows (or columns) off the current line wins, then the nearest
 * along the line, then the earlier in layout order. With none ahead, focus stays put.
 */
function expectedNeighbor(cells: Cell[], current: Cell, key: string) {
  const vertical = key === "{ArrowUp}" || key === "{ArrowDown}";
  const step = key === "{ArrowRight}" || key === "{ArrowDown}" ? 1 : -1;
  const along = (cell: Cell) => (vertical ? cell.row : cell.column);
  const across = (cell: Cell) => (vertical ? cell.column : cell.row);
  let best = current;
  let bestOffset = Infinity;
  let bestDistance = Infinity;
  for (const cell of cells) {
    const distance = (along(cell) - along(current)) * step;
    if (distance <= 0) continue;
    const offset = Math.abs(across(cell) - across(current));
    if (offset < bestOffset || (offset === bestOffset && distance < bestDistance)) {
      best = cell;
      bestOffset = offset;
      bestDistance = distance;
    }
  }
  return best;
}

/** 1–9 cards on distinct cells of a grid of up to 5×5 (so gaps occur), and 1–20 arrow keys. */
function inventoryScenario() {
  return fc
    .record({
      columns: fc.integer({ min: 1, max: 5 }),
      rows: fc.integer({ min: 1, max: 5 }),
    })
    .chain(({ columns, rows }) =>
      fc.record({
        columns: fc.constant(columns),
        rows: fc.constant(rows),
        cells: fc.uniqueArray(
          fc.tuple(fc.integer({ min: 1, max: columns }), fc.integer({ min: 1, max: rows })),
          {
            minLength: 1,
            maxLength: Math.min(9, columns * rows),
            selector: ([column, row]) => `${column}:${row}`,
          },
        ),
        keys: fc.array(fc.constantFrom(...arrowKeys), {
          minLength: 1,
          maxLength: 20,
        }),
      }),
    );
}

/** One card, one row, one column, and cards separated by empty cells, each pressed every way. */
const allArrows = [...arrowKeys, ...[...arrowKeys].reverse(), ...arrowKeys];
const inventoryHostileScenarios = [
  [
    {
      columns: 1,
      rows: 1,
      cells: [[1, 1]] as [number, number][],
      keys: allArrows,
    },
  ],
  [
    {
      columns: 5,
      rows: 1,
      cells: [
        [3, 1],
        [1, 1],
        [5, 1],
      ] as [number, number][],
      keys: allArrows,
    },
  ],
  [
    {
      columns: 1,
      rows: 5,
      cells: [
        [1, 2],
        [1, 5],
        [1, 1],
      ] as [number, number][],
      keys: allArrows,
    },
  ],
  [
    {
      columns: 5,
      rows: 5,
      cells: [
        [1, 1],
        [5, 2],
        [3, 5],
        [2, 3],
      ] as [number, number][],
      keys: allArrows,
    },
  ],
  // Two cards equally near below the focused one: the earlier in layout order wins, whichever
  // side of the column it is on.
  [
    {
      columns: 3,
      rows: 2,
      cells: [
        [2, 1],
        [1, 2],
        [3, 2],
      ] as [number, number][],
      keys: ["{ArrowDown}", "{ArrowUp}", "{ArrowDown}"],
    },
  ],
  [
    {
      columns: 3,
      rows: 2,
      cells: [
        [2, 1],
        [3, 2],
        [1, 2],
      ] as [number, number][],
      keys: ["{ArrowDown}", "{ArrowUp}", "{ArrowDown}"],
    },
  ],
];

describe("Inventory keyboard invariants", () => {
  it("moves focus to the nearest card in the arrow's direction and keeps one tab stop", async () => {
    await fc.assert(
      fc.asyncProperty(inventoryScenario(), async ({ columns, rows, cells: positions, keys }) => {
        const cells = positions.map(([column, row], index) => ({
          value: `item-${index + 1}`,
          column,
          row,
        }));
        const { container, user } = setup(
          <>
            <button type="button">Before</button>
            <Inventory
              aria-label="Items"
              columns={columns}
              rows={rows}
              defaultValue={cells.map((cell) => ({
                ...cell,
                columnSpan: 1,
                rowSpan: 1,
              }))}
            >
              {cells.map((cell) => (
                <InventoryItem key={cell.value} value={cell.value}>
                  {cell.value}
                </InventoryItem>
              ))}
            </Inventory>
            <button type="button">After</button>
          </>,
        );
        try {
          const root = container.querySelector("ol")!;
          const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
          const stops = () => [...root.querySelectorAll("[tabindex='0']")];

          await user.click(before!);
          await user.tab();
          let current = cells[0]!;
          expect(
            document.activeElement?.getAttribute("data-value"),
            "Tab enters on the first",
          ).toBe(current.value);

          for (const key of keys) {
            await user.keyboard(key);
            const active = document.activeElement!;
            current = expectedNeighbor(cells, current, key);
            expect(active.matches("li[data-value]"), `${key} keeps focus on a card`).toBe(true);
            expect(root.contains(active), `${key} keeps focus inside`).toBe(true);
            expect(active.getAttribute("data-value"), `${key} reaches the nearest card`).toBe(
              current.value,
            );
            expect(stops(), `${key} leaves one tab stop, on the focused card`).toEqual([active]);
          }

          const focused = document.activeElement;
          await user.tab();
          expect(root.contains(document.activeElement), "one Tab leaves the inventory").toBe(false);
          expect(document.activeElement?.textContent, "one Tab leaves the inventory").toBe("After");
          await user.tab({ shift: true });
          expect(document.activeElement, "Shift+Tab returns to the same card").toBe(focused);
        } finally {
          cleanupRoots();
          document.body.innerHTML = "";
        }
      }),
      { numRuns: 40, examples: inventoryHostileScenarios },
    );
  }, 60_000);

  it("walks a card's handles with Tab before leaving, and Shift+Tab returns to the card", async () => {
    const { container, user } = setup(
      <>
        <button type="button">Before</button>
        <Inventory
          aria-label="Items"
          columns={4}
          rows={2}
          defaultValue={[
            { value: "revenue", column: 1, row: 1, columnSpan: 2, rowSpan: 1 },
            { value: "alerts", column: 3, row: 1, columnSpan: 1, rowSpan: 2 },
          ]}
        >
          <InventoryItem value="revenue" textValue="Revenue">
            Revenue
            <InventoryMoveHandle />
            <InventoryResizeHandle />
          </InventoryItem>
          <InventoryItem value="alerts" textValue="Alerts">
            Alerts
            <InventoryMoveHandle />
          </InventoryItem>
        </Inventory>
        <button type="button">After</button>
      </>,
    );
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");
    const card = container.querySelector<HTMLElement>("li[data-value='revenue']")!;
    const [move, resize] = card.querySelectorAll<HTMLElement>("button");

    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(card);
    await user.tab();
    expect(document.activeElement).toBe(move);
    await user.tab();
    expect(document.activeElement).toBe(resize);
    await user.tab();
    expect(document.activeElement).toBe(after);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(card);
  });
});
