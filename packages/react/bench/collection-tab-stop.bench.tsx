import { type ComponentProps, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  Menu,
  Menubar,
  MenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "../src/index.js";
import { keyDown, median, mountMeasured, report, type Row, type Sample } from "./measure.js";

// The roving tab stop of every collection that renders its own items, measured through the
// public API only: check out another commit and run `pnpm bench` again to compare.

const SIZES = [10, 100, 1000];
const REPEATS = 5;
const PRESSES = 10;

type Family = {
  name: string;
  /** Selector for the items that share the one tab stop. */
  item: string;
  /** Selector for the items the next key walks through, in order; defaults to `item`. */
  axis?: string;
  /** The key that moves the stop to the next item. */
  next: string;
  /** Whether that key wraps from the last item to the first. */
  loop: boolean;
  ui: (size: number, value: string | undefined) => ReactNode;
};

const values = (size: number) => Array.from({ length: size }, (_, index) => `item-${index}`);

const COLUMNS = 4;
const columns = Array.from({ length: COLUMNS }, (_, index) => `column-${index}`);

// A consumer's own focusable control, such as a custom checkbox or a router link.
const Check = (props: ComponentProps<"span">) => <span {...props} />;

const families: Family[] = [
  {
    name: "Menubar",
    item: "[role='menuitem']",
    next: "ArrowRight",
    loop: true,
    ui: (size) => (
      <Menubar aria-label="Bench">
        {values(size).map((value) => (
          <Menu key={value}>
            <MenuTrigger>{value}</MenuTrigger>
          </Menu>
        ))}
      </Menubar>
    ),
  },
  {
    name: "ListBox",
    item: "[role='option']",
    next: "ArrowDown",
    loop: true,
    ui: (size, value) => (
      <ListBox aria-label="Bench" defaultValue={value}>
        {values(size).map((item) => (
          <ListBoxOption key={item} value={item}>
            {item}
          </ListBoxOption>
        ))}
      </ListBox>
    ),
  },
  {
    name: "GridList",
    item: "[role='row']",
    next: "ArrowDown",
    loop: false,
    ui: (size, value) => (
      <GridList aria-label="Bench" defaultValue={value}>
        {values(size).map((item) => (
          <GridListItem key={item} value={item}>
            {item}
          </GridListItem>
        ))}
      </GridList>
    ),
  },
  {
    // A header row plus enough body rows for about `size` cells in all (12 at size 10).
    // ArrowDown walks the first column from the first body cell.
    name: "Table",
    item: "td, th",
    axis: "tbody td:first-child",
    next: "ArrowDown",
    loop: false,
    ui: (size) => (
      <Table aria-label="Bench">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableColumn key={column}>{column}</TableColumn>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {values(Math.max(1, Math.round(size / COLUMNS) - 1)).map((row) => (
            <TableRow key={row}>
              {columns.map((column, index) => (
                <TableCell key={column}>{index === 0 ? row : `${row} ${column}`}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
  {
    // The same table with a consumer's own focusable control, rendered with tabIndex 0, as the
    // one widget of each first-column cell: every one of those cells carries a 0 as it attaches,
    // which the table must not answer with a scan of the whole grid per cell.
    name: "Table, widgets at tabIndex 0",
    item: "td, th, .check",
    axis: "tbody .check",
    next: "ArrowDown",
    loop: false,
    ui: (size) => (
      <Table aria-label="Bench">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableColumn key={column}>{column}</TableColumn>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {values(Math.max(1, Math.round(size / COLUMNS) - 1)).map((row) => (
            <TableRow key={row}>
              <TableCell>
                <Check className="check" tabIndex={0}>
                  {row}
                </Check>
              </TableCell>
              {columns.slice(1).map((column) => (
                <TableCell key={column}>{`${row} ${column}`}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
];

function expectOneStop(container: HTMLElement, family: Family) {
  const stops = [...container.querySelectorAll<HTMLElement>(family.item)].filter(
    (element) => element.tabIndex === 0,
  );
  expect(stops).toHaveLength(1);
}

function mountSample(family: Family, size: number, value: string | undefined) {
  const view = mountMeasured();
  const sample = view.render(family.ui(size, value));
  expectOneStop(view.container, family);
  view.unmount();
  return sample;
}

/** Cost per arrow press from the first item on the axis, averaged over PRESSES presses. */
function arrowSample(family: Family, size: number) {
  const view = mountMeasured();
  view.render(family.ui(size, "item-0"));
  const axis = view.container.querySelectorAll<HTMLElement>(family.axis ?? family.item);
  const first = axis[0]!;
  view.measure(() => first.focus());
  const total: Sample = { commits: 0, renderMs: 0, wallMs: 0 };
  for (let press = 0; press < PRESSES; press += 1) {
    const sample = view.measure(() => keyDown(document.activeElement!, family.next));
    total.commits += sample.commits;
    total.renderMs += sample.renderMs;
    total.wallMs += sample.wallMs;
  }
  const landed = family.loop ? PRESSES % axis.length : Math.min(PRESSES, axis.length - 1);
  expect(document.activeElement?.textContent).toBe(`item-${landed}`);
  expectOneStop(view.container, family);
  view.unmount();
  return {
    commits: total.commits / PRESSES,
    renderMs: total.renderMs / PRESSES,
    wallMs: total.wallMs / PRESSES,
  };
}

const scenarios: Array<{ name: string; run: (family: Family, size: number) => Sample }> = [
  {
    name: "mount, first item selected",
    run: (family, size) => mountSample(family, size, "item-0"),
  },
  { name: "mount, no item selected", run: (family, size) => mountSample(family, size, undefined) },
  { name: "arrow to next item", run: arrowSample },
];

describe("collection roving tab stop", () => {
  for (const family of families) {
    it(`measures ${family.name} mount and keyboard movement`, () => {
      const rows: Row[] = [];
      for (const scenario of scenarios) {
        for (const size of SIZES) {
          scenario.run(family, size); // warm up the JIT for this shape
          const samples = Array.from({ length: REPEATS }, () => scenario.run(family, size));
          rows.push({ scenario: scenario.name, size, ...median(samples) });
        }
      }
      report(`${family.name} roving tab stop (median per mount, mean per key press)`, rows);
    }, 600_000);
  }
});
