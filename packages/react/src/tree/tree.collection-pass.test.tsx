import { act, StrictMode, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { Tree, TreeGroup, TreeItem, type TreeProps } from "../index.js";

const page = (ui: ReactElement) => (
  <>
    <button type="button">Before</button>
    {ui}
    <button type="button">After</button>
  </>
);

function serverRender(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(ui);
  return container;
}

const tabStops = (container: Element) =>
  [...container.querySelectorAll<HTMLElement>("[role='treeitem'][tabindex='0']")].map(
    (item) => item.dataset.value,
  );

const files = (props: Partial<TreeProps> = {}) => (
  <Tree aria-label="Files" {...props}>
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
  </Tree>
);

/**
 * On the server and while hydrating, Tree renders its children once more ahead of the real
 * items, where each item records its key and whether it is disabled or inside a collapsed group.
 * The real items therefore resolve the roving tab stop in server HTML, and never inside a
 * collapsed group.
 */
describe("Tree collection pass", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("gives the first item the tab stop in server HTML when nothing is selected", () => {
    const container = serverRender(files());

    expect(tabStops(container)).toEqual(["src"]);
    expect(container.querySelector("[role='tree']")!.hasAttribute("tabindex")).toBe(false);
  });

  it("keeps the stop on a visible selected item at any depth", () => {
    const container = serverRender(
      files({ defaultOpen: ["src", "components"], defaultValue: "input" }),
    );

    expect(tabStops(container)).toEqual(["input"]);
  });

  it("never puts the stop inside a collapsed group, however deep the selection sits", () => {
    const closed = serverRender(files({ defaultValue: "button" }));
    const outerOpen = serverRender(files({ defaultOpen: ["src"], defaultValue: "button" }));
    // An open group inside a closed one is still out of view.
    const innerOpen = serverRender(files({ defaultOpen: ["components"], defaultValue: "button" }));

    expect(tabStops(closed)).toEqual(["src"]);
    expect(tabStops(outerOpen)).toEqual(["src"]);
    expect(tabStops(innerOpen)).toEqual(["src"]);
  });

  it("skips a disabled first item", () => {
    const container = serverRender(
      <Tree aria-label="Files">
        <TreeItem value="src" disabled>
          src
        </TreeItem>
        <TreeItem value="readme">README.md</TreeItem>
      </Tree>,
    );

    expect(tabStops(container)).toEqual(["readme"]);
  });

  it("leaves no parts or row text behind in the pass's hidden holder ahead of the tree", () => {
    const container = serverRender(files({ defaultOpen: ["src"] }));

    expect(container.querySelectorAll("[role='treeitem']")).toHaveLength(6);
    expect(container.querySelectorAll("[role='group']")).toHaveLength(2);
    const holder = container.firstElementChild!;
    expect(holder.hasAttribute("hidden")).toBe(true);
    expect(holder.querySelectorAll("*")).toHaveLength(0);
    expect(holder.textContent).toBe("");
    expect(holder.nextElementSibling).toBe(container.querySelector("[role='tree']"));
  });

  it("hydrates without a mismatch, keeps focus, and removes the pass", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = page(files({ defaultOpen: ["src"], defaultValue: "button" }));
    const container = serverRender(ui);
    expect(tabStops(container)).toEqual(["src"]);
    const index = container.querySelector<HTMLElement>("[data-value='index']")!;
    index.focus();

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, <StrictMode>{ui}</StrictMode>);
    });

    expect(errors).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(index);
    expect(container.querySelector<HTMLElement>("[data-value='index']")).toBe(index);
    // The item the user focused before hydration takes the stop.
    expect(tabStops(container)).toEqual(["index"]);
    expect(container.querySelector(":scope > [hidden]")).toBeNull();
    await act(async () => reactRoot.unmount());
  });
});

describe("Tree tab stop and collapsed groups", () => {
  it("hands the stop to the first visible item when its group collapses from outside", () => {
    const tree = (open: string[]) => files({ open, onOpenChange: () => {}, defaultValue: "index" });
    const { container, rerender, unmount } = render(tree(["src"]));
    expect(tabStops(container)).toEqual(["index"]);

    rerender(tree([]));
    expect(tabStops(container)).toEqual(["src"]);
    unmount();
  });

  it("keeps one stop, on a visible item, while groups open and close", () => {
    const tree = (open: string[]) =>
      files({ open, onOpenChange: () => {}, defaultValue: "button" });
    const { container, rerender, unmount } = render(tree([]));
    const visibleStop = () => {
      const stops = [...container.querySelectorAll<HTMLElement>("[role='treeitem']")].filter(
        (item) => item.tabIndex === 0,
      );
      expect(stops).toHaveLength(1);
      expect(stops[0]!.closest("[hidden]")).toBeNull();
      return stops[0]!.dataset.value;
    };

    expect(visibleStop()).toBe("src");
    rerender(tree(["components"]));
    expect(visibleStop()).toBe("src");
    rerender(tree(["src", "components"]));
    expect(visibleStop()).toBe("button");
    rerender(tree(["src"]));
    expect(visibleStop()).toBe("src");
    unmount();
  });
});
