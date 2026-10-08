import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { pressKey } from "../../test/press-key.js";
import { Tree, type TreeProps } from "./Tree.js";
import { TreeGroup } from "./TreeGroup.js";
import { TreeItem } from "./TreeItem.js";

function renderTree(props: Partial<TreeProps> = {}, ownerDocument?: Document) {
  const result = setup(
    <Tree aria-label="Files" defaultOpen={["src"]} {...props}>
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
  it("renders tree and treeitem roles with levels, positions, and set sizes", async () => {
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

  it("sets aria-expanded only on items that contain a group and hides collapsed groups", async () => {
    const { item } = renderTree();
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(item("button").getAttribute("aria-expanded")).toBeNull();
    expect(item("readme").getAttribute("aria-expanded")).toBeNull();

    expect(item("src").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(false);
    expect(item("components").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(true);
  });

  it("keeps a single tab stop, even when the selection is inside a collapsed group", async () => {
    const { container } = renderTree();
    const tabStops = [...container.querySelectorAll<HTMLElement>("[role='treeitem']")].filter(
      (element) => element.tabIndex === 0,
    );
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]!.dataset["value"]).toBe("src");

    const collapsed = renderTree({ defaultOpen: [], defaultValue: "button" });
    const collapsedTabStops = [
      ...collapsed.container.querySelectorAll<HTMLElement>("[role='treeitem']"),
    ].filter((element) => element.tabIndex === 0);
    expect(collapsedTabStops).toHaveLength(1);
    expect(collapsedTabStops[0]!.dataset["value"]).toBe("src");
  });

  it("expands a collapsed item with ArrowRight, then moves into its first child", async () => {
    const onOpenChange = vi.fn();
    const { item, user } = renderTree({ onOpenChange });
    item("components").focus();
    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(item("components").getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange).toHaveBeenLastCalledWith(["src", "components"]);
    expect(document.activeElement).toBe(item("components"));

    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(document.activeElement).toBe(item("button"));

    // ArrowRight does nothing on a leaf.
    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(document.activeElement).toBe(item("button"));
  });

  it("collapses an expanded item with ArrowLeft, else moves to the parent item", async () => {
    const { item, user } = renderTree({ defaultOpen: ["src", "components"] });
    item("button").focus();
    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(document.activeElement).toBe(item("components"));

    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(item("components"));

    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(document.activeElement).toBe(item("src"));

    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(item("src").getAttribute("aria-expanded")).toBe("false");
    // A collapsed top-level item has no parent to move to.
    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(document.activeElement).toBe(item("src"));
  });

  it("mirrors branch arrows in right-to-left layouts", async () => {
    const { item, user } = renderTree({ defaultOpen: [], style: { direction: "rtl" } });
    item("src").focus();

    await pressKey(user, document.activeElement!, "{ArrowLeft}");
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(item("src").getAttribute("aria-expanded")).toBe("false");
  });

  it("moves over visible items only with ArrowDown and ArrowUp", async () => {
    const { item, user } = renderTree();
    item("src").focus();
    await pressKey(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(item("components"));
    // The collapsed components subtree is skipped entirely.
    await pressKey(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(item("index"));
    await pressKey(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(item("readme"));
    // No wrapping at the ends.
    await pressKey(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(item("readme"));
    await pressKey(user, document.activeElement!, "{ArrowUp}");
    expect(document.activeElement).toBe(item("index"));
  });

  it("moves focus within the tree's owning document", async () => {
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

  it("jumps to the first and last visible item with Home and End", async () => {
    const { item, user } = renderTree();
    item("components").focus();
    await pressKey(user, document.activeElement!, "{End}");
    expect(document.activeElement).toBe(item("readme"));
    await pressKey(user, document.activeElement!, "{Home}");
    expect(document.activeElement).toBe(item("src"));
  });

  it("moves to a visible typeahead match, ignoring hidden rows", async () => {
    const { item, user } = renderTree();
    item("src").focus();
    await pressKey(user, document.activeElement!, "r");
    expect(document.activeElement).toBe(item("readme"));
  });

  it("does not match typeahead against items inside collapsed groups", async () => {
    const { item, user } = renderTree();
    item("src").focus();
    // "Button.tsx" exists but is hidden inside the collapsed components group.
    await pressKey(user, document.activeElement!, "b");
    expect(document.activeElement).toBe(item("src"));
  });

  it("selects with Enter and Space and manages uncontrolled selection", async () => {
    const onChange = vi.fn();
    const { item, user } = renderTree({ onChange });
    item("components").focus();
    await pressKey(user, document.activeElement!, "{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("components");
    expect(item("components").getAttribute("aria-selected")).toBe("true");
    expect(item("components").dataset["selected"]).toBe("");
    // Enter alone does not expand.
    expect(item("components").getAttribute("aria-expanded")).toBe("false");

    item("readme").focus();
    await pressKey(user, document.activeElement!, " ");
    expect(onChange).toHaveBeenLastCalledWith("readme");
    expect(item("readme").getAttribute("aria-selected")).toBe("true");
    expect(item("components").getAttribute("aria-selected")).toBeNull();
  });

  it("keeps controlled selection with the caller while still reporting changes", async () => {
    const onChange = vi.fn();
    const { item, user } = renderTree({ value: "readme", onChange });
    item("src").focus();
    await pressKey(user, document.activeElement!, "{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(item("src").getAttribute("aria-selected")).toBeNull();
    expect(item("readme").getAttribute("aria-selected")).toBe("true");
  });

  it("selects on click and toggles expansion for expandable items", async () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    const { item, user } = renderTree({ onChange, onOpenChange });
    await user.click(item("index"));
    expect(onChange).toHaveBeenLastCalledWith("index");
    expect(onOpenChange).not.toHaveBeenCalled();

    // Clicking an expandable row selects it and collapses its open group.
    await user.click(item("src"));
    expect(onChange).toHaveBeenLastCalledWith("src");
    expect(onOpenChange).toHaveBeenLastCalledWith([]);
    expect(item("src").getAttribute("aria-expanded")).toBe("false");

    await user.click(item("src"));
    expect(onOpenChange).toHaveBeenLastCalledWith(["src"]);
    expect(item("src").getAttribute("aria-expanded")).toBe("true");
  });

  it("does not let clicks on nested items bubble a selection into their ancestors", async () => {
    const onChange = vi.fn();
    const { item, user } = renderTree({ onChange });
    await user.click(item("components"));
    expect(onChange).toHaveBeenLastCalledWith("components");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(item("src").getAttribute("aria-selected")).toBeNull();
  });

  it("respects controlled expansion", async () => {
    const onOpenChange = vi.fn();
    const { item, user } = renderTree({ open: ["src"], onOpenChange });
    item("components").focus();
    await pressKey(user, document.activeElement!, "{ArrowRight}");
    expect(onOpenChange).toHaveBeenLastCalledWith(["src", "components"]);
    // The caller did not apply the change, so the group stays collapsed.
    expect(item("components").getAttribute("aria-expanded")).toBe("false");
    expect(item("components").querySelector<HTMLElement>("[role='group']")!.hidden).toBe(true);
  });

  it("skips disabled items during navigation", async () => {
    const result = setup(
      <Tree aria-label="Files">
        <TreeItem value="one">one.txt</TreeItem>
        <TreeItem value="two" disabled>
          two.txt
        </TreeItem>
        <TreeItem value="three">three.txt</TreeItem>
      </Tree>,
    );
    const { user } = result;
    const item = (value: string) =>
      result.container.querySelector<HTMLElement>(`[data-value="${value}"]`)!;
    item("one").focus();
    await pressKey(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(item("three"));
    expect(item("two").getAttribute("aria-disabled")).toBe("true");
    expect(item("two").hasAttribute("tabindex")).toBe(false);
  });

  it("names the required root when a part renders outside it", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<TreeItem value="orphan">Orphan</TreeItem>)).toThrow(
      "TreeItem must be rendered inside Tree.",
    );
    error.mockRestore();
  });

  it("renders the tree and its items as another element with as", async () => {
    const { container } = render(
      <Tree as="ul" aria-label="Custom">
        <TreeItem as="li" value="a">
          A
        </TreeItem>
      </Tree>,
    );
    expect(container.querySelector("ul[role='tree'] > li[role='treeitem']")).not.toBeNull();
  });
});
