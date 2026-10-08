import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { TreeGrid, type TreeGridProps } from "./TreeGrid.js";
import { TreeGridCell } from "./TreeGridCell.js";
import { TreeGridColumn } from "./TreeGridColumn.js";
import { TreeGridRow } from "./TreeGridRow.js";
import { TreeGridRowGroup } from "./TreeGridRowGroup.js";

function renderTreeGrid(props: Partial<TreeGridProps> = {}) {
  const result = setup(
    <TreeGrid aria-label="Files" defaultOpen={["src"]} {...props}>
      <TreeGridRowGroup as="thead">
        <TreeGridRow>
          <TreeGridColumn>Name</TreeGridColumn>
          <TreeGridColumn>Kind</TreeGridColumn>
        </TreeGridRow>
      </TreeGridRowGroup>
      <TreeGridRowGroup>
        <TreeGridRow value="src">
          <TreeGridCell>src</TreeGridCell>
          <TreeGridCell>Folder</TreeGridCell>
        </TreeGridRow>
        <TreeGridRow value="components" parentValue="src">
          <TreeGridCell>components</TreeGridCell>
          <TreeGridCell>Folder</TreeGridCell>
        </TreeGridRow>
        <TreeGridRow value="button" parentValue="components">
          <TreeGridCell>Button.tsx</TreeGridCell>
          <TreeGridCell>File</TreeGridCell>
        </TreeGridRow>
        <TreeGridRow value="index" parentValue="src">
          <TreeGridCell>index.ts</TreeGridCell>
          <TreeGridCell>File</TreeGridCell>
        </TreeGridRow>
        <TreeGridRow value="readme">
          <TreeGridCell>README.md</TreeGridCell>
          <TreeGridCell>File</TreeGridCell>
        </TreeGridRow>
      </TreeGridRowGroup>
    </TreeGrid>,
  );
  const row = (value: string) =>
    result.container.querySelector<HTMLTableRowElement>(`tr[data-value="${value}"]`)!;
  const cell = (value: string, index: number) => row(value).cells[index]!;
  return { ...result, row, cell };
}

describe("tree grid composition", () => {
  it("renders native treegrid anatomy and derives hierarchical row metadata", async () => {
    const { container, row } = renderTreeGrid();
    expect(container.querySelector("table")?.getAttribute("role")).toBe("treegrid");
    expect(container.querySelectorAll("[role='rowgroup']")).toHaveLength(2);
    expect(container.querySelectorAll("[role='columnheader']")).toHaveLength(2);
    expect(container.querySelectorAll("[role='gridcell']")).toHaveLength(10);

    const position = (value: string) => [
      row(value).getAttribute("aria-level"),
      row(value).getAttribute("aria-posinset"),
      row(value).getAttribute("aria-setsize"),
    ];
    expect(position("src")).toEqual(["1", "1", "2"]);
    expect(position("readme")).toEqual(["1", "2", "2"]);
    expect(position("components")).toEqual(["2", "1", "2"]);
    expect(position("index")).toEqual(["2", "2", "2"]);
    expect(position("button")).toEqual(["3", "1", "1"]);
  });

  it("sets expansion only on parent rows and hides descendants of collapsed rows", async () => {
    const { row } = renderTreeGrid();
    expect(row("src").getAttribute("aria-expanded")).toBe("true");
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
    expect(row("index").getAttribute("aria-expanded")).toBeNull();
    expect(row("button").hidden).toBe(true);
    expect(row("components").hidden).toBe(false);
  });

  it("keeps one roving row or cell stop", async () => {
    const { container, row } = renderTreeGrid({ defaultOpen: [], defaultValue: "button" });
    const stops = [...container.querySelectorAll<HTMLElement>("tr[data-value], td")].filter(
      (element) => element.tabIndex === 0,
    );
    expect(stops).toEqual([row("src")]);
  });

  it("expands from row focus, then enters and traverses cells", async () => {
    const onOpenChange = vi.fn();
    const { row, cell, user } = renderTreeGrid({ onOpenChange });
    row("components").focus();
    await pressKey(user, row("components"), "{ArrowRight}");
    expect(row("components").getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(document.activeElement).toBe(row("components"));
    await pressKey(user, row("components"), "{ArrowDown}");
    expect(document.activeElement).toBe(row("button"));
    await pressKey(user, row("button"), "{ArrowUp}");
    expect(document.activeElement).toBe(row("components"));

    await pressKey(user, row("components"), "{ArrowRight}");
    expect(document.activeElement).toBe(cell("components", 0));
    await pressKey(user, cell("components", 0), "{ArrowRight}");
    expect(document.activeElement).toBe(cell("components", 1));
    await pressKey(user, cell("components", 1), "{ArrowLeft}");
    expect(document.activeElement).toBe(cell("components", 0));
    await pressKey(user, cell("components", 0), "{ArrowLeft}");
    expect(document.activeElement).toBe(row("components"));
  });

  it("mirrors branch and cell arrows in right-to-left layouts", async () => {
    const { container, row, cell, user } = renderTreeGrid({ defaultOpen: ["src"] });
    container.querySelector("table")!.style.direction = "rtl";
    row("components").focus();

    await pressKey(user, row("components"), "{ArrowLeft}");
    expect(row("components").getAttribute("aria-expanded")).toBe("true");
    await pressKey(user, row("components"), "{ArrowLeft}");
    expect(document.activeElement).toBe(cell("components", 0));
    await pressKey(user, cell("components", 0), "{ArrowLeft}");
    expect(document.activeElement).toBe(cell("components", 1));
  });

  it("collapses a parent row, else moves row focus to its parent", async () => {
    const { row, user } = renderTreeGrid({ defaultOpen: ["src", "components"] });
    row("components").focus();
    await pressKey(user, row("components"), "{ArrowLeft}");
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(row("components"));
    await pressKey(user, row("components"), "{ArrowLeft}");
    expect(document.activeElement).toBe(row("src"));
  });

  it("moves vertically over visible rows while preserving row or cell focus", async () => {
    const { row, cell, user } = renderTreeGrid();
    row("src").focus();
    await pressKey(user, row("src"), "{ArrowDown}");
    expect(document.activeElement).toBe(row("components"));
    await pressKey(user, row("components"), "{ArrowDown}");
    expect(document.activeElement).toBe(row("index"));

    cell("index", 1).focus();
    await pressKey(user, cell("index", 1), "{ArrowDown}");
    expect(document.activeElement).toBe(cell("readme", 1));
    await pressKey(user, cell("readme", 1), "{ArrowUp}");
    expect(document.activeElement).toBe(cell("index", 1));
  });

  it("applies row and cell Home/End semantics including Control edges", async () => {
    const { row, cell, user } = renderTreeGrid();
    row("components").focus();
    await pressKey(user, row("components"), "{End}");
    expect(document.activeElement).toBe(row("readme"));
    await pressKey(user, row("readme"), "{Home}");
    expect(document.activeElement).toBe(row("src"));

    cell("index", 1).focus();
    await pressKey(user, cell("index", 1), "{Home}");
    expect(document.activeElement).toBe(cell("index", 0));
    await pressKey(user, cell("index", 0), "{End}");
    expect(document.activeElement).toBe(cell("index", 1));
    await pressKey(user, cell("index", 1), "{Control>}{Home}{/Control}");
    expect(document.activeElement).toBe(cell("src", 1));
    await pressKey(user, cell("src", 1), "{Control>}{End}{/Control}");
    expect(document.activeElement).toBe(cell("readme", 1));
  });

  it("manages uncontrolled selection and reports controlled changes", async () => {
    const onChange = vi.fn();
    const { row, cell, user } = renderTreeGrid({ onChange });
    await user.click(cell("index", 0));
    expect(onChange).toHaveBeenLastCalledWith("index");
    expect(row("index").getAttribute("aria-selected")).toBe("true");

    row("readme").focus();
    await pressKey(user, row("readme"), " ");
    expect(onChange).toHaveBeenLastCalledWith("readme");
    expect(row("readme").getAttribute("aria-selected")).toBe("true");

    const controlled = renderTreeGrid({ value: "readme", onChange });
    controlled.row("src").focus();
    await pressKey(user, controlled.row("src"), "{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(controlled.row("readme").getAttribute("aria-selected")).toBe("true");
    expect(controlled.row("src").getAttribute("aria-selected")).toBeNull();
  });

  it("reports but does not apply rejected controlled expansion", async () => {
    const onOpenChange = vi.fn();
    const { row, user } = renderTreeGrid({ open: ["src"], onOpenChange });
    row("components").focus();
    await pressKey(user, row("components"), "{ArrowRight}");
    expect(onOpenChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
  });

  it("tabs through controls only in the active row without invoking row behavior", async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const result = setup(
      <TreeGrid aria-label="Files" onChange={onChange} onOpenChange={onOpenChange}>
        <TreeGridRowGroup>
          <TreeGridRow value="folder">
            <TreeGridCell>
              Folder <button type="button">Open menu</button>
            </TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="child" parentValue="folder">
            <TreeGridCell>Child</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="other">
            <TreeGridCell>
              Other <button type="button">Other menu</button>
            </TreeGridCell>
          </TreeGridRow>
        </TreeGridRowGroup>
      </TreeGrid>,
    );
    const { user } = result;
    const buttons = [...result.container.querySelectorAll("button")];
    const button = buttons[0]!;
    const rovingStops = () =>
      [
        ...result.container.querySelectorAll<HTMLElement>("tr[data-value], td[role='gridcell']"),
      ].filter((element) => element.tabIndex === 0);
    const folderRow =
      result.container.querySelector<HTMLTableRowElement>('tr[data-value="folder"]')!;
    expect(button.tabIndex).toBe(0);
    expect(buttons[1]!.tabIndex).toBe(-1);
    expect(rovingStops()).toEqual([folderRow]);
    await user.click(button);
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    button.focus();
    await pressKey(user, button, "{ArrowRight}");
    expect(document.activeElement).toBe(button);

    const otherRow = result.container.querySelector<HTMLTableRowElement>('tr[data-value="other"]')!;
    otherRow.focus();
    expect(button.tabIndex).toBe(-1);
    expect(buttons[1]!.tabIndex).toBe(0);
    expect(rovingStops()).toEqual([otherRow]);
  });

  it("skips disabled rows during vertical and edge navigation", async () => {
    const result = setup(
      <TreeGrid aria-label="Files">
        <TreeGridRowGroup>
          <TreeGridRow value="one">
            <TreeGridCell>one.txt</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="two" disabled>
            <TreeGridCell>two.txt</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="three">
            <TreeGridCell>three.txt</TreeGridCell>
          </TreeGridRow>
        </TreeGridRowGroup>
      </TreeGrid>,
    );
    const { user } = result;
    const rows = [...result.container.querySelectorAll<HTMLTableRowElement>("tr")];
    rows[0]!.focus();
    await pressKey(user, rows[0]!, "{ArrowDown}");
    expect(document.activeElement).toBe(rows[2]);
    expect(rows[1]!.getAttribute("aria-disabled")).toBe("true");
    expect(rows[1]!.hasAttribute("tabindex")).toBe(false);
  });
});
