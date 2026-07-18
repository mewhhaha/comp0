import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Tree, type TreeProps } from "./components/Tree.js";
import { TreeGroup } from "./components/TreeGroup.js";
import { TreeItem } from "./components/TreeItem.js";

function renderTree(props: Partial<TreeProps> = {}, ownerDocument?: Document) {
  const result = render(
    <Tree aria-label="Files" defaultExpanded={["src"]} {...props}>
      <TreeItem value="src" textValue="src">
        src
        <TreeGroup>
          <TreeItem value="components" textValue="components">
            components
            <TreeGroup>
              <TreeItem value="button">Button.tsx</TreeItem>
              <TreeItem value="input">Input.tsx</TreeItem>
            </TreeGroup>
          </TreeItem>
          <TreeItem value="index">index.ts</TreeItem>
        </TreeGroup>
      </TreeItem>
      <TreeItem value="readme">README.md</TreeItem>
    </Tree>,
    ownerDocument,
  );
  const item = (value: string) =>
    result.container.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
  return { ...result, item };
}

describe("tree composition", () => {
  it("renders tree and treeitem roles with levels, positions, and set sizes", () => {
    const { container, item } = renderTree();
    const tree = container.querySelector("[role='tree']");
    expect(tree).toBeTruthy();
    expect(tree?.getAttribute("aria-label")).toBe("Files");
    expect(container.querySelectorAll("[role='treeitem']")).toHaveLength(6);

    const position = (value: string) => [
      item(value).getAttribute("aria-level"),
      item(value).getAttribute("aria-posinset"),
      item(value).getAttribute("aria-setsize"),
    ];
    expect(position("src")).toEqual(["1", "1", "2"]);
    expect(position("readme")).toEqual(["1", "2", "2"]);
    expect(position("components")).toEqual(["2", "1", "2"]);
    expect(position("index")).toEqual(["2", "2", "2"]);
    expect(position("button")).toEqual(["3", "1", "2"]);
    expect(position("input")).toEqual(["3", "2", "2"]);
  });

  it("sets aria-expanded only on items that contain a group and hides collapsed groups", () => {
    const { item } = renderTree();
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(item("button").getAttribute("aria-expanded")).toBeNull();
    expect(item("readme").getAttribute("aria-expanded")).toBeNull();

    expect(item("src").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(false);
    expect(item("components").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(true);
  });

  it("keeps a single tab stop, even when the selection is inside a collapsed group", () => {
    const { container } = renderTree();
    const tabStops = [...container.querySelectorAll<HTMLElement>("[role='treeitem']")].filter(
      (element) => element.tabIndex === 0,
    );
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]!.dataset["value"]).toBe("src");

    const collapsed = renderTree({ defaultExpanded: [], defaultValue: "button" });
    const collapsedTabStops = [
      ...collapsed.container.querySelectorAll<HTMLElement>("[role='treeitem']"),
    ].filter((element) => element.tabIndex === 0);
    expect(collapsedTabStops).toHaveLength(1);
    expect(collapsedTabStops[0]!.dataset["value"]).toBe("src");
  });

  it("expands a collapsed item with ArrowRight, then moves into its first child", () => {
    const onExpandedChange = vi.fn();
    const { item } = renderTree({ onExpandedChange });
    item("components").focus();
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(item("components").getAttribute("aria-expanded")).toBe("true");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(document.activeElement).toBe(item("components"));

    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(item("button"));

    // ArrowRight does nothing on a leaf.
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(item("button"));
  });

  it("collapses an expanded item with ArrowLeft, else moves to the parent item", () => {
    const { item } = renderTree({ defaultExpanded: ["src", "components"] });
    item("button").focus();
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(item("components"));

    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(item("components"));

    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(item("src"));

    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(item("src").getAttribute("aria-expanded")).toBe("false");
    // A collapsed top-level item has no parent to move to.
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(item("src"));
  });

  it("moves over visible items only with ArrowDown and ArrowUp", () => {
    const { item } = renderTree();
    item("src").focus();
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(item("components"));
    // The collapsed components subtree is skipped entirely.
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(item("index"));
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(item("readme"));
    // No wrapping at the ends.
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(item("readme"));
    fireKeyDown(document.activeElement!, "ArrowUp");
    expect(document.activeElement).toBe(item("index"));
  });

  it("moves focus within the tree's owning document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow as Window & typeof globalThis;
    const frameDocument = frame.contentDocument!;
    const { item, unmount } = renderTree({}, frameDocument);
    const source = item("src");

    act(() => {
      source.focus();
      source.dispatchEvent(
        new frameWindow.KeyboardEvent("keydown", {
          key: "ArrowDown",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(frameDocument.activeElement).toBe(item("components"));
    unmount();
    frame.remove();
  });

  it("jumps to the first and last visible item with Home and End", () => {
    const { item } = renderTree();
    item("components").focus();
    fireKeyDown(document.activeElement!, "End");
    expect(document.activeElement).toBe(item("readme"));
    fireKeyDown(document.activeElement!, "Home");
    expect(document.activeElement).toBe(item("src"));
  });

  it("moves to a visible typeahead match, ignoring hidden rows", () => {
    const { item } = renderTree();
    item("src").focus();
    fireKeyDown(document.activeElement!, "r");
    expect(document.activeElement).toBe(item("readme"));
  });

  it("does not match typeahead against items inside collapsed groups", () => {
    const { item } = renderTree();
    item("src").focus();
    // "Button.tsx" exists but is hidden inside the collapsed components group.
    fireKeyDown(document.activeElement!, "b");
    expect(document.activeElement).toBe(item("src"));
  });

  it("selects with Enter and Space and manages uncontrolled selection", () => {
    const onChange = vi.fn();
    const { item } = renderTree({ onChange });
    item("components").focus();
    fireKeyDown(document.activeElement!, "Enter");
    expect(onChange).toHaveBeenLastCalledWith("components");
    expect(item("components").getAttribute("aria-selected")).toBe("true");
    expect(item("components").dataset["selected"]).toBe("");
    // Enter alone does not expand.
    expect(item("components").getAttribute("aria-expanded")).toBe("false");

    item("readme").focus();
    fireKeyDown(document.activeElement!, " ");
    expect(onChange).toHaveBeenLastCalledWith("readme");
    expect(item("readme").getAttribute("aria-selected")).toBe("true");
    expect(item("components").getAttribute("aria-selected")).toBeNull();
  });

  it("keeps controlled selection with the caller while still reporting changes", () => {
    const onChange = vi.fn();
    const { item } = renderTree({ value: "readme", onChange });
    item("src").focus();
    fireKeyDown(document.activeElement!, "Enter");
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(item("src").getAttribute("aria-selected")).toBeNull();
    expect(item("readme").getAttribute("aria-selected")).toBe("true");
  });

  it("selects on click and toggles expansion for expandable items", () => {
    const onChange = vi.fn();
    const onExpandedChange = vi.fn();
    const { item } = renderTree({ onChange, onExpandedChange });
    fireClick(item("index"));
    expect(onChange).toHaveBeenLastCalledWith("index");
    expect(onExpandedChange).not.toHaveBeenCalled();

    // Clicking an expandable row selects it and collapses its open group.
    fireClick(item("src"));
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    expect(item("src").getAttribute("aria-expanded")).toBe("false");

    fireClick(item("src"));
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src"]);
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
  });

  it("does not let clicks on nested items bubble a selection into their ancestors", () => {
    const onChange = vi.fn();
    const { item } = renderTree({ onChange });
    fireClick(item("components"));
    expect(onChange).toHaveBeenLastCalledWith("components");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(item("src").getAttribute("aria-selected")).toBeNull();
  });

  it("respects controlled expansion", () => {
    const onExpandedChange = vi.fn();
    const { item } = renderTree({ expanded: ["src"], onExpandedChange });
    item("components").focus();
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src", "components"]);
    // The caller did not apply the change, so the group stays collapsed.
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(item("components").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(true);
  });

  it("skips disabled items during navigation", () => {
    const result = render(
      <Tree aria-label="Files">
        <TreeItem value="one">one.txt</TreeItem>
        <TreeItem value="two" disabled>
          two.txt
        </TreeItem>
        <TreeItem value="three">three.txt</TreeItem>
      </Tree>,
    );
    const item = (value: string) =>
      result.container.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
    item("one").focus();
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(item("three"));
    expect(item("two").getAttribute("aria-disabled")).toBe("true");
    expect(item("two").hasAttribute("tabindex")).toBe(false);
  });
});
