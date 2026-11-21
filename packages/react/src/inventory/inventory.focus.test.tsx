import { act, useLayoutEffect } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { renderInventory } from "../../test/inventory-fixtures.js";
import { Inventory, type InventoryLayout } from "./Inventory.js";
import { InventoryItem } from "./InventoryItem.js";

describe("inventory structure and focus", () => {
  it("renders a semantic list with grid placement and named controls", async () => {
    const { container } = renderInventory();
    const inventory = container.querySelector<HTMLOListElement>("ol")!;
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const move = revenue.querySelector<HTMLButtonElement>("[data-comp0='inventory-move-handle']")!;
    const resize = revenue.querySelector<HTMLButtonElement>(
      "[data-comp0='inventory-resize-handle']",
    )!;

    expect(inventory.getAttribute("aria-label")).toBe("Store overview");
    expect(inventory.style.gridTemplateColumns).toContain("repeat(6");
    expect(inventory.style.gridTemplateRows).toContain("repeat(6");
    expect(revenue.dataset.column).toBe("1");
    expect(revenue.dataset.columnSpan).toBe("3");
    expect(revenue.style.gridColumn).toBe("1 / span 3");
    expect(move.getAttribute("aria-label")).toBe("Move Revenue");
    expect(move.getAttribute("aria-keyshortcuts")).toContain("Enter");
    expect(resize.getAttribute("aria-label")).toBe("Resize Revenue");
    expect(container.querySelector("[data-comp0='inventory-preview']")).toBeNull();
    const items = container.querySelectorAll<HTMLElement>("li[data-value]");
    expect(items[0]!.tabIndex).toBe(0);
    expect([...items].slice(1).every((item) => item.tabIndex === -1)).toBe(true);
    expect(
      [...container.querySelectorAll("button")].every((button) => button.tabIndex === -1),
    ).toBe(true);
  });

  it("moves item focus to the closest card in each visual direction", async () => {
    const { container, user } = setup(
      <Inventory
        columns={5}
        rows={5}
        defaultValue={[
          { value: "center", column: 3, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "up", column: 3, row: 1, columnSpan: 1, rowSpan: 1 },
          { value: "right", column: 5, row: 3, columnSpan: 1, rowSpan: 1 },
          { value: "down", column: 3, row: 5, columnSpan: 1, rowSpan: 1 },
          { value: "left", column: 1, row: 3, columnSpan: 1, rowSpan: 1 },
        ]}
      >
        <InventoryItem value="center">Center</InventoryItem>
        <InventoryItem value="up">Up</InventoryItem>
        <InventoryItem value="right">Right</InventoryItem>
        <InventoryItem value="down">Down</InventoryItem>
        <InventoryItem value="left">Left</InventoryItem>
      </Inventory>,
    );
    const item = (value: string) =>
      container.querySelector<HTMLElement>(`li[data-value='${value}']`)!;

    for (const [key, value] of [
      ["ArrowUp", "up"],
      ["ArrowRight", "right"],
      ["ArrowDown", "down"],
      ["ArrowLeft", "left"],
    ] as const) {
      act(() => item("center").focus());
      await user.keyboard(`{${key}}`);
      expect(document.activeElement).toBe(item(value));
      expect(item(value).tabIndex).toBe(0);
      expect(item("center").tabIndex).toBe(-1);
    }
  });

  it("prefers the card most aligned with the movement direction", async () => {
    const { container, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const conversion = container.querySelector<HTMLElement>('[data-value="conversion"]')!;

    await pressKey(user, revenue, "{ArrowRight}");

    expect(document.activeElement).toBe(conversion);
  });

  it("tabs through the focused card controls before leaving the inventory", async () => {
    const { container, user } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const [move, resize] = revenue.querySelectorAll<HTMLButtonElement>("button");

    act(() => revenue.focus());
    await user.tab();
    expect(document.activeElement).toBe(move);
    await user.tab();
    expect(document.activeElement).toBe(resize);

    const leaving = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    act(() => resize!.dispatchEvent(leaving));
    expect(leaving.defaultPrevented).toBe(false);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(move);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(revenue);
  });

  it("makes the focused card the inventory tab stop", async () => {
    const { container } = renderInventory();
    const revenue = container.querySelector<HTMLElement>('[data-value="revenue"]')!;
    const alerts = container.querySelector<HTMLElement>('[data-value="alerts"]')!;

    act(() => alerts.focus());

    expect(alerts.tabIndex).toBe(0);
    expect(revenue.tabIndex).toBe(-1);
  });
});

/** Records, in every commit where the layout changed, the values of the items that are tab stops. */
function Stops({ layout, commits }: { layout: InventoryLayout; commits: string[][] }) {
  useLayoutEffect(() => {
    const items = [...document.querySelectorAll<HTMLElement>("li[data-value]")];
    commits.push(items.filter((item) => item.tabIndex === 0).map((item) => item.dataset.value!));
  }, [layout, commits]);
  return null;
}

function Board({ values, commits }: { values: readonly string[]; commits: string[][] }) {
  const layout = values.map((value, index) => ({
    value,
    column: index + 1,
    row: 1,
    columnSpan: 1,
    rowSpan: 1,
  }));
  return (
    <>
      <button type="button">Before</button>
      <Inventory aria-label="Board" columns={8} rows={1} value={layout} onChange={() => {}}>
        {layout.map((entry) => (
          <InventoryItem key={entry.value} value={entry.value}>
            {entry.value}
          </InventoryItem>
        ))}
        <Stops layout={layout} commits={commits} />
      </Inventory>
    </>
  );
}

function renderBoard(values: readonly string[]) {
  const commits: string[][] = [];
  // `commits` records each committed stop; StrictMode's replayed mount would record it twice.
  const result = setup(<Board values={values} commits={commits} />, document, {
    strictMode: false,
  });
  const item = (value: string) =>
    result.container.querySelector<HTMLElement>(`li[data-value='${value}']`)!;
  const show = (next: readonly string[]) =>
    result.rerender(<Board values={next} commits={commits} />);
  return { ...result, commits, item, show };
}

describe("inventory tab stop when the layout changes", () => {
  it("moves the stop to the first remaining item in the same commit as the removal", async () => {
    const { commits, item, show, user } = renderBoard(["a", "b", "c"]);
    act(() => item("a").focus());
    await user.keyboard("{ArrowRight}");
    expect(item("b").tabIndex).toBe(0);

    show(["a", "c"]);

    expect(commits.at(-1)).toEqual(["a"]);
  });

  it("keeps the stop on the first remaining item when the removed item returns", async () => {
    const { commits, item, show, user } = renderBoard(["a", "b", "c"]);
    act(() => item("a").focus());
    await user.keyboard("{ArrowRight}");

    show(["a", "c"]);
    show(["a", "b", "c"]);

    expect(commits.at(-1)).toEqual(["a"]);
    expect(item("b").tabIndex).toBe(-1);
  });

  it("follows the focused item by value when an item is prepended", async () => {
    const { commits, item, show, user } = renderBoard(["a", "b"]);
    act(() => item("a").focus());
    await user.keyboard("{ArrowRight}");

    show(["z", "a", "b"]);

    expect(commits.at(-1)).toEqual(["b"]);
  });

  it("renders no item for an empty layout and puts the stop on the first item once items arrive", () => {
    const { commits, container, show } = renderBoard([]);
    expect(container.querySelectorAll("li")).toHaveLength(0);

    show(["x", "y"]);

    expect(commits).toEqual([[], ["x"]]);
  });

  it("survives removing the focused item and then every item", async () => {
    const { commits, container, item, show, user } = renderBoard(["a", "b", "c"]);
    act(() => item("a").focus());
    await user.keyboard("{ArrowRight}");

    show(["a", "c"]);
    show([]);
    expect(container.querySelectorAll("li")).toHaveLength(0);
    show(["c", "a"]);

    expect(commits.slice(-3)).toEqual([["a"], [], ["c"]]);
  });

  it("tabs into the first remaining item after the focused one is removed and roves from it", async () => {
    const { getByRole, item, show, user } = renderBoard(["a", "b", "c"]);
    act(() => item("a").focus());
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(item("c"));

    show(["a", "b"]);
    act(() => getByRole("button", { name: "Before" }).focus());
    await user.tab();
    expect(document.activeElement).toBe(item("a"));
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(item("b"));
    expect(item("a").tabIndex).toBe(-1);
    expect(item("b").tabIndex).toBe(0);
  });

  it("keeps exactly one stop, on the focused or else the first item, across random layout changes", () => {
    const pool = ["a", "b", "c", "d", "e", "f"];
    let seed = 20261121;
    const random = (below: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % below;
    };
    const { commits, item, show } = renderBoard(pool);
    let expected = "a";

    for (let step = 0; step < 1000; step++) {
      const values = pool.filter(() => random(3) > 0);
      for (let index = values.length - 1; index > 0; index--) {
        const other = random(index + 1);
        [values[index], values[other]] = [values[other]!, values[index]!];
      }
      show(values);
      if (!values.includes(expected)) expected = values[0] ?? "";
      expect(commits.at(-1), `step ${step}`).toEqual(expected === "" ? [] : [expected]);
      if (values.length > 0 && random(2) === 0) {
        expected = values[random(values.length)]!;
        act(() => item(expected).focus());
      }
    }
    // A thousand rerenders take a few seconds when the whole suite runs in parallel.
  }, 20_000);
});
