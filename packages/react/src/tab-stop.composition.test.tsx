import { act, Profiler, type ComponentProps } from "react";
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
import { Tag } from "./tag-group/Tag.js";
import { TagGroup } from "./tag-group/TagGroup.js";
import { TagList } from "./tag-group/TagList.js";
import { Tree } from "./tree/Tree.js";
import { TreeGroup } from "./tree/TreeGroup.js";
import { TreeItem } from "./tree/TreeItem.js";

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
    // A commit count is a production contract. Under StrictMode the arrow key that also moves
    // the uncontrolled selection commits twice; production commits once.
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
      document,
      { strictMode: false },
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

  it("moves the tree stop in one commit without re-registering items", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="tree" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <Tree aria-label="Bench">
          {values.map((value) => (
            <TreeItem key={value} value={value}>
              {value}
            </TreeItem>
          ))}
        </Tree>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const items = container.querySelectorAll<HTMLElement>("[role='treeitem']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(items[0]);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]!.tabIndex).toBe(0);
    expect(commits).toBe(1);
    expect(registry.changes).toBe(0);
    unmount();
  });

  it("moves the tag stop in one commit without re-registering tags", async () => {
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="tag-group" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <TagGroup>
          <TagList aria-label="Bench">
            {values.map((value) => (
              <Tag key={value} value={value}>
                {value}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      </Profiler>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tags = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tags[0]);
    commits = 0;
    registry.changes = 0;
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tags[1]);
    expect(tags[1]!.tabIndex).toBe(0);
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

  it("re-renders only the two tree items the stop moves between, at any depth", async () => {
    // A Profiler around a parent item would also report its nested items, so each item reports
    // its own renders through the element it renders as.
    const rendered = new Set<string>();
    const Row = (props: ComponentProps<"div"> & { "data-value"?: string }) => {
      rendered.add(props["data-value"]!);
      return <div {...props} />;
    };
    const { container, user, unmount } = setup(
      <Tree aria-label="Files" defaultOpen={["one"]}>
        <TreeItem as={Row} value="one" textValue="one">
          one
          <TreeGroup>
            {many.slice(1, 4).map((value) => (
              <TreeItem as={Row} key={value} value={value}>
                {value}
              </TreeItem>
            ))}
          </TreeGroup>
        </TreeItem>
        <TreeItem as={Row} value="five">
          five
        </TreeItem>
      </Tree>,
    );
    const item = (value: string) =>
      container.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
    act(() => item("two").focus());
    rendered.clear();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(item("three"));
    expect([...rendered].sort()).toEqual(["three", "two"]);
    // Out of a group to its parent row with ArrowLeft, and back in with ArrowDown.
    rendered.clear();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(item("one"));
    expect([...rendered].sort()).toEqual(["one", "three"]);
    rendered.clear();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(item("two"));
    expect([...rendered].sort()).toEqual(["one", "two"]);
    unmount();
  });

  it("re-renders only the two tags the stop moves between", async () => {
    const { rendered, onRender } = tracked();
    const { container, user, unmount } = setup(
      <TagGroup defaultValue={["one"]}>
        <TagList aria-label="Tags">
          {many.map((value) => (
            <Profiler key={value} id={value} onRender={onRender}>
              <Tag value={value}>{value}</Tag>
            </Profiler>
          ))}
        </TagList>
      </TagGroup>,
    );
    const tags = container.querySelectorAll<HTMLElement>("[role='row']");
    act(() => tags[1]!.focus());
    rendered.clear();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tags[2]);
    expect([...rendered].sort()).toEqual(["three", "two"]);
    unmount();
  });

  it("moves the table stop without rendering any cell", async () => {
    // The stop is the tabindex attribute itself, which the table moves in the DOM.
    let commits = 0;
    const { container, user, unmount } = setup(
      <Profiler id="table" onRender={() => (commits += 1)}>
        <button type="button">Before</button>
        <Table aria-label="Cells">
          <TableBody>
            {many.map((value) => (
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
    commits = 0;

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cells[2]);
    expect([...cells].filter((cell) => cell.tabIndex === 0)).toEqual([cells[2]]);
    await user.click(cells[5]!);
    expect([...cells].filter((cell) => cell.tabIndex === 0)).toEqual([cells[5]]);
    expect(commits).toBe(0);
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
