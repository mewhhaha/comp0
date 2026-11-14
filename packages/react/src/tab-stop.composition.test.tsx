import { act, Profiler } from "react";
import { describe, expect, it, vi } from "vitest";
import { type CollectionItem } from "@comp0/core";
import { render, setup } from "../test/render.js";
import { GridList } from "./grid-list/GridList.js";
import { GridListItem } from "./grid-list/GridListItem.js";
import { ListBox } from "./list-box/ListBox.js";
import { ListBoxOption } from "./list-box/ListBoxOption.js";
import { Menu } from "./menu/Menu.js";
import { MenuTrigger } from "./menu/MenuTrigger.js";
import { Menubar } from "./menubar/Menubar.js";
import { Tab } from "./tabs/Tab.js";
import { Table } from "./table/Table.js";
import { TableBody } from "./table/TableBody.js";
import { TableCell } from "./table/TableCell.js";
import { TableRow } from "./table/TableRow.js";
import { TabList } from "./tabs/TabList.js";
import { Tabs } from "./tabs/Tabs.js";

// Counts registry changes: a register or unregister that changed an entry. Registering an
// unchanged item returns false and is not counted, so a stop move that re-registered every item
// would show up as changes here.
const registry = vi.hoisted(() => ({ changes: 0 }));

vi.mock("@comp0/core", async (importOriginal) => {
  const core = await importOriginal<typeof import("@comp0/core")>();
  const react = await import("react");
  return {
    ...core,
    useCollection() {
      const [collection] = react.useState(() => {
        const inner = core.createCollection();
        return {
          ...inner,
          register(item: CollectionItem) {
            const changed = inner.register(item);
            if (changed) registry.changes += 1;
            return changed;
          },
          unregister(key: string, element?: HTMLElement | null) {
            const changed = inner.unregister(key, element);
            if (changed) registry.changes += 1;
            return changed;
          },
        };
      });
      return collection;
    },
  };
});

const values = ["one", "two", "three"];

describe("roving tab stop registration", () => {
  it("moves the menubar stop in one commit without re-registering triggers", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="menubar" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <Menubar aria-label="Bench">
          {values.map((value) => (
            <Menu key={value}>
              <MenuTrigger>{value}</MenuTrigger>
            </Menu>
          ))}
        </Menubar>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const triggers = container.querySelectorAll<HTMLElement>("[role='menuitem']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(triggers[0]);
    // Mounting registered the triggers, so the counter does see this collection.
    expect(registry.changes).toBeGreaterThan(0);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(triggers[1]);
    expect(triggers[1]!.tabIndex).toBe(0);
    expect(commits).toBe(1);
    expect(registry.changes).toBe(0);
    unmount();
  });

  it("moves the listbox stop in one commit without re-registering options", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="listbox" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <ListBox aria-label="Bench" defaultValue="one">
          {values.map((value) => (
            <ListBoxOption key={value} value={value}>
              {value}
            </ListBoxOption>
          ))}
        </ListBox>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(options[0]);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[1]);
    expect(options[1]!.tabIndex).toBe(0);
    expect(commits).toBe(1);
    expect(registry.changes).toBe(0);
    unmount();
  });

  it("moves the grid list stop in one commit without re-registering rows", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="grid-list" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <GridList aria-label="Bench">
          {values.map((value) => (
            <GridListItem key={value} value={value}>
              {value}
            </GridListItem>
          ))}
        </GridList>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(rows[0]);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1]!.tabIndex).toBe(0);
    expect(commits).toBe(1);
    expect(registry.changes).toBe(0);
    unmount();
  });

  it("moves the table stop in one commit without re-registering cells", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="table" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <Table aria-label="Bench">
          <TableBody>
            {values.map((value) => (
              <TableRow key={value}>
                <TableCell>{value}</TableCell>
                <TableCell>{`${value} detail`}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const cells = container.querySelectorAll<HTMLElement>("td");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(cells[0]);
    expect(registry.changes).toBeGreaterThan(0);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[2]);
    expect(cells[2]!.tabIndex).toBe(0);
    expect(commits).toBe(1);
    expect(registry.changes).toBe(0);
    unmount();
  });

  it("moves the listbox stop in one commit when the controlled value changes from outside", () => {
    let commits = 0;
    const list = (value: string) => (
      <Profiler id="listbox" onRender={() => (commits += 1)}>
        <ListBox aria-label="Bench" value={value}>
          {values.map((item) => (
            <ListBoxOption key={item} value={item}>
              {item}
            </ListBoxOption>
          ))}
        </ListBox>
      </Profiler>
    );
    const { container, rerender, unmount } = render(list("one"));
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    // The ListBox root commits once more on its first update after mount (its rendered-label
    // check settles after layout, a cost that predates tab stops), so settle before measuring.
    rerender(list("one"));
    commits = 0;
    rerender(list("two"));
    expect(options[1]!.tabIndex).toBe(0);
    expect(options[0]!.tabIndex).toBe(-1);
    expect(commits).toBe(1);
    unmount();
  });

  it("moves the grid list stop in one commit when the controlled value changes from outside", () => {
    let commits = 0;
    const list = (value: string) => (
      <Profiler id="grid-list" onRender={() => (commits += 1)}>
        <GridList aria-label="Bench" value={value}>
          {values.map((item) => (
            <GridListItem key={item} value={item}>
              {item}
            </GridListItem>
          ))}
        </GridList>
      </Profiler>
    );
    const { container, rerender, unmount } = render(list("one"));
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    commits = 0;
    rerender(list("three"));
    expect(rows[2]!.tabIndex).toBe(0);
    expect(rows[0]!.tabIndex).toBe(-1);
    expect(commits).toBe(1);
    unmount();
  });

  it("does not revive a stop record when the controlled value returns to its old key", async () => {
    // The arrow focuses "two" under a controlled value that rejects it. Moving the value away and
    // back must not revive that record: the stop belongs to the selected "one" again.
    const list = (value: string) => (
      <ListBox aria-label="Bench" value={value}>
        {values.map((item) => (
          <ListBoxOption key={item} value={item}>
            {item}
          </ListBoxOption>
        ))}
      </ListBox>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[1]);
    rerender(list("three"));
    rerender(list("one"));
    expect([...options].map((option) => option.tabIndex)).toEqual([0, -1, -1]);
    unmount();
  });

  it("does not revive a stop record when the controlled value returns to its old key in a grid list", async () => {
    const list = (value: string) => (
      <GridList aria-label="Bench" value={value}>
        {values.map((item) => (
          <GridListItem key={item} value={item}>
            {item}
          </GridListItem>
        ))}
      </GridList>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    rerender(list("three"));
    rerender(list("one"));
    expect([...rows].map((row) => row.tabIndex)).toEqual([0, -1, -1]);
    unmount();
  });

  it("keeps a stop record through one clearing of the value and no further in a list box", async () => {
    const list = (value: string) => (
      <ListBox aria-label="Bench" value={value}>
        {values.map((item) => (
          <ListBoxOption key={item} value={item}>
            {item}
          </ListBoxOption>
        ))}
      </ListBox>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const options = container.querySelectorAll<HTMLElement>("[role='option']");
    const tabStops = () => [...options].map((item) => item.tabIndex);

    await user.tab();
    await user.keyboard("{ArrowDown}");
    rerender(list(""));
    expect(tabStops()).toEqual([-1, 0, -1]);
    rerender(list("three"));
    expect(tabStops()).toEqual([-1, -1, 0]);
    rerender(list(""));
    expect(tabStops()).toEqual([0, -1, -1]);
    unmount();
  });

  it("keeps the stop on the focused item when its own selection is cleared in a list box", async () => {
    const list = (value: string) => (
      <ListBox aria-label="Bench" value={value}>
        {values.map((item) => (
          <ListBoxOption key={item} value={item}>
            {item}
          </ListBoxOption>
        ))}
      </ListBox>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    await user.tab();
    await user.keyboard("{ArrowDown}");
    // The owner accepts the focused item, then clears the value while focus stays on it.
    rerender(list("two"));
    rerender(list(""));
    expect(document.activeElement).toBe(options[1]);
    expect([...options].map((item) => item.tabIndex)).toEqual([-1, 0, -1]);
    unmount();
  });

  it("keeps a stop record through one clearing of the value and no further in a grid list", async () => {
    const list = (value: string) => (
      <GridList aria-label="Bench" value={value}>
        {values.map((item) => (
          <GridListItem key={item} value={item}>
            {item}
          </GridListItem>
        ))}
      </GridList>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    const tabStops = () => [...rows].map((item) => item.tabIndex);

    await user.tab();
    await user.keyboard("{ArrowDown}");
    rerender(list(""));
    expect(tabStops()).toEqual([-1, 0, -1]);
    rerender(list("three"));
    expect(tabStops()).toEqual([-1, -1, 0]);
    rerender(list(""));
    expect(tabStops()).toEqual([0, -1, -1]);
    unmount();
  });

  it("keeps the stop on the focused item when its own selection is cleared in a grid list", async () => {
    const list = (value: string) => (
      <GridList aria-label="Bench" value={value}>
        {values.map((item) => (
          <GridListItem key={item} value={item}>
            {item}
          </GridListItem>
        ))}
      </GridList>
    );
    const { container, rerender, user, unmount } = setup(list("one"));
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.tab();
    await user.keyboard("{ArrowDown}");
    // The owner accepts the focused item, then clears the value while focus stays on it.
    rerender(list("two"));
    rerender(list(""));
    expect(document.activeElement).toBe(rows[1]);
    expect([...rows].map((item) => item.tabIndex)).toEqual([-1, 0, -1]);
    unmount();
  });
});

// A stop move should re-render the item it leaves and the item it reaches, not every item that
// reads the owner's context (bench: collection-tab-stop.bench.tsx, PERFORMANCE.md).
describe("roving tab stop re-renders", () => {
  const many = ["one", "two", "three", "four", "five"];

  function tracked() {
    const rendered = new Set<string>();
    const onRender = (id: string) => rendered.add(id);
    return { rendered, onRender };
  }

  it("re-renders only the two menubar triggers the stop moves between", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <Menubar aria-label="Bar">
        {many.map((value) => (
          <Menu key={value}>
            <Profiler id={value} onRender={onRender}>
              <MenuTrigger>{value}</MenuTrigger>
            </Profiler>
          </Menu>
        ))}
      </Menubar>,
    );
    const triggers = container.querySelectorAll<HTMLElement>("[role='menuitem']");
    act(() => triggers[1]!.focus());
    rendered.clear();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(triggers[2]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });

  it("re-renders only the two grid list rows the stop moves between", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <GridList aria-label="Rows">
        {many.map((value) => (
          <Profiler key={value} id={value} onRender={onRender}>
            <GridListItem value={value}>{value}</GridListItem>
          </Profiler>
        ))}
      </GridList>,
    );
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    act(() => rows[1]!.focus());
    rendered.clear();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[2]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });

  it("re-renders only the two table cells the stop moves between", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <Table aria-label="Cells">
        <TableBody>
          {many.map((value) => (
            <TableRow key={value}>
              <Profiler id={value} onRender={onRender}>
                <TableCell>{value}</TableCell>
              </Profiler>
              <Profiler id={`${value} detail`} onRender={onRender}>
                <TableCell>{`${value} detail`}</TableCell>
              </Profiler>
            </TableRow>
          ))}
        </TableBody>
      </Table>,
    );
    const cells = container.querySelectorAll<HTMLElement>("td");
    act(() => cells[2]!.focus());
    rendered.clear();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[4]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });

  it("re-renders only the two listbox options when a controlled value rejects the move", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <ListBox aria-label="Options" value="one" onChange={() => {}}>
        {many.map((value) => (
          <Profiler key={value} id={value} onRender={onRender}>
            <ListBoxOption value={value}>{value}</ListBoxOption>
          </Profiler>
        ))}
      </ListBox>,
    );
    const options = container.querySelectorAll<HTMLElement>("[role='option']");
    options[0]!.focus();
    await user.keyboard("{ArrowDown}");
    rendered.clear();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(options[2]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });

  it("re-renders only the two tabs when a controlled value rejects the move", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <Tabs value="one" onChange={() => {}}>
        <TabList aria-label="Tabs">
          {many.map((value) => (
            <Profiler key={value} id={value} onRender={onRender}>
              <Tab value={value}>{value}</Tab>
            </Profiler>
          ))}
        </TabList>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");
    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    rendered.clear();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[2]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });
});
