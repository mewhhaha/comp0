import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { TreeGrid, type TreeGridProps } from "./components/TreeGrid.js";
import { TreeGridCell } from "./components/TreeGridCell.js";
import { TreeGridColumn } from "./components/TreeGridColumn.js";
import { TreeGridRow } from "./components/TreeGridRow.js";
import { TreeGridRowGroup } from "./components/TreeGridRowGroup.js";

function renderTreeGrid(props: Partial<TreeGridProps> = {}) {
  const result = render(
    <TreeGrid aria-label="Files" defaultExpanded={["src"]} {...props}>
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
  it("renders native treegrid anatomy and derives hierarchical row metadata", () => {
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

  it("sets expansion only on parent rows and hides descendants of collapsed rows", () => {
    const { row } = renderTreeGrid();
    expect(row("src").getAttribute("aria-expanded")).toBe("true");
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
    expect(row("index").getAttribute("aria-expanded")).toBeNull();
    expect(row("button").hidden).toBe(true);
    expect(row("components").hidden).toBe(false);
  });

  it("keeps one roving row or cell stop", () => {
    const { container, row } = renderTreeGrid({ defaultExpanded: [], defaultValue: "button" });
    const stops = [...container.querySelectorAll<HTMLElement>("tr[data-value], td")].filter(
      (element) => element.tabIndex === 0,
    );
    expect(stops).toEqual([row("src")]);
  });

  it("expands from row focus, then enters and traverses cells", () => {
    const onExpandedChange = vi.fn();
    const { row, cell } = renderTreeGrid({ onExpandedChange });
    row("components").focus();
    fireKeyDown(row("components"), "ArrowRight");
    expect(row("components").getAttribute("aria-expanded")).toBe("true");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(document.activeElement).toBe(row("components"));
    fireKeyDown(row("components"), "ArrowDown");
    expect(document.activeElement).toBe(row("button"));
    fireKeyDown(row("button"), "ArrowUp");
    expect(document.activeElement).toBe(row("components"));

    fireKeyDown(row("components"), "ArrowRight");
    expect(document.activeElement).toBe(cell("components", 0));
    fireKeyDown(cell("components", 0), "ArrowRight");
    expect(document.activeElement).toBe(cell("components", 1));
    fireKeyDown(cell("components", 1), "ArrowLeft");
    expect(document.activeElement).toBe(cell("components", 0));
    fireKeyDown(cell("components", 0), "ArrowLeft");
    expect(document.activeElement).toBe(row("components"));
  });

  it("mirrors branch and cell arrows in right-to-left layouts", () => {
    const { container, row, cell } = renderTreeGrid({ defaultExpanded: ["src"] });
    container.querySelector("table")!.style.direction = "rtl";
    row("components").focus();

    fireKeyDown(row("components"), "ArrowLeft");
    expect(row("components").getAttribute("aria-expanded")).toBe("true");
    fireKeyDown(row("components"), "ArrowLeft");
    expect(document.activeElement).toBe(cell("components", 0));
    fireKeyDown(cell("components", 0), "ArrowLeft");
    expect(document.activeElement).toBe(cell("components", 1));
  });

  it("collapses a parent row, else moves row focus to its parent", () => {
    const { row } = renderTreeGrid({ defaultExpanded: ["src", "components"] });
    row("components").focus();
    fireKeyDown(row("components"), "ArrowLeft");
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(row("components"));
    fireKeyDown(row("components"), "ArrowLeft");
    expect(document.activeElement).toBe(row("src"));
  });

  it("moves vertically over visible rows while preserving row or cell focus", () => {
    const { row, cell } = renderTreeGrid();
    row("src").focus();
    fireKeyDown(row("src"), "ArrowDown");
    expect(document.activeElement).toBe(row("components"));
    fireKeyDown(row("components"), "ArrowDown");
    expect(document.activeElement).toBe(row("index"));

    cell("index", 1).focus();
    fireKeyDown(cell("index", 1), "ArrowDown");
    expect(document.activeElement).toBe(cell("readme", 1));
    fireKeyDown(cell("readme", 1), "ArrowUp");
    expect(document.activeElement).toBe(cell("index", 1));
  });

  it("applies row and cell Home/End semantics including Control edges", () => {
    const { row, cell } = renderTreeGrid();
    row("components").focus();
    fireKeyDown(row("components"), "End");
    expect(document.activeElement).toBe(row("readme"));
    fireKeyDown(row("readme"), "Home");
    expect(document.activeElement).toBe(row("src"));

    cell("index", 1).focus();
    fireKeyDown(cell("index", 1), "Home");
    expect(document.activeElement).toBe(cell("index", 0));
    fireKeyDown(cell("index", 0), "End");
    expect(document.activeElement).toBe(cell("index", 1));
    fireKeyDown(cell("index", 1), "Home", { ctrlKey: true });
    expect(document.activeElement).toBe(cell("src", 1));
    fireKeyDown(cell("src", 1), "End", { ctrlKey: true });
    expect(document.activeElement).toBe(cell("readme", 1));
  });

  it("manages uncontrolled selection and reports controlled changes", () => {
    const onChange = vi.fn();
    const { row, cell } = renderTreeGrid({ onChange });
    fireClick(cell("index", 0));
    expect(onChange).toHaveBeenLastCalledWith("index");
    expect(row("index").getAttribute("aria-selected")).toBe("true");

    row("readme").focus();
    fireKeyDown(row("readme"), " ");
    expect(onChange).toHaveBeenLastCalledWith("readme");
    expect(row("readme").getAttribute("aria-selected")).toBe("true");

    const controlled = renderTreeGrid({ value: "readme", onChange });
    controlled.row("src").focus();
    fireKeyDown(controlled.row("src"), "Enter");
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(controlled.row("readme").getAttribute("aria-selected")).toBe("true");
    expect(controlled.row("src").getAttribute("aria-selected")).toBeNull();
  });

  it("reports but does not apply rejected controlled expansion", () => {
    const onExpandedChange = vi.fn();
    const { row } = renderTreeGrid({ expanded: ["src"], onExpandedChange });
    row("components").focus();
    fireKeyDown(row("components"), "ArrowRight");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(row("components").getAttribute("aria-expanded")).toBe("false");
  });

  it("tabs through controls only in the active row without invoking row behavior", () => {
    const onChange = vi.fn();
    const onExpandedChange = vi.fn();
    const result = render(
      <TreeGrid aria-label="Files" onChange={onChange} onExpandedChange={onExpandedChange}>
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
    fireClick(button);
    expect(onChange).not.toHaveBeenCalled();
    expect(onExpandedChange).not.toHaveBeenCalled();
    button.focus();
    fireKeyDown(button, "ArrowRight");
    expect(document.activeElement).toBe(button);

    const otherRow = result.container.querySelector<HTMLTableRowElement>('tr[data-value="other"]')!;
    otherRow.focus();
    expect(button.tabIndex).toBe(-1);
    expect(buttons[1]!.tabIndex).toBe(0);
    expect(rovingStops()).toEqual([otherRow]);
  });

  it("skips disabled rows during vertical and edge navigation", () => {
    const result = render(
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
    const rows = [...result.container.querySelectorAll<HTMLTableRowElement>("tr")];
    rows[0]!.focus();
    fireKeyDown(rows[0]!, "ArrowDown");
    expect(document.activeElement).toBe(rows[2]);
    expect(rows[1]!.getAttribute("aria-disabled")).toBe("true");
    expect(rows[1]!.hasAttribute("tabindex")).toBe(false);
  });
});
