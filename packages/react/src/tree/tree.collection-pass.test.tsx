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

  it("puts the stop on the nearest visible ancestor of a selection in a collapsed group", () => {
    const closed = serverRender(files({ defaultValue: "button" }));
    const outerOpen = serverRender(files({ defaultOpen: ["src"], defaultValue: "button" }));
    // An open group inside a closed one is still out of view.
    const innerOpen = serverRender(files({ defaultOpen: ["components"], defaultValue: "button" }));

    expect(tabStops(closed)).toEqual(["src"]);
    expect(tabStops(outerOpen)).toEqual(["components"]);
    expect(tabStops(innerOpen)).toEqual(["src"]);
  });

  it("numbers a group without an owning item as a set of its own", () => {
    const container = serverRender(
      <Tree aria-label="Files">
        <TreeItem value="a">a</TreeItem>
        <TreeGroup>
          <TreeItem value="b">b</TreeItem>
          <TreeItem value="c">c</TreeItem>
        </TreeGroup>
      </Tree>,
    );

    expect(shape(container)).toEqual(["a 1/1 null", "b 1/2 null", "c 2/2 null"]);
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
    expect(tabStops(container)).toEqual(["components"]);
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

/** Each item's aria-posinset / aria-setsize / aria-expanded, in document order. */
const shape = (container: Element) =>
  [...container.querySelectorAll<HTMLElement>("[role='treeitem']")].map(
    (item) =>
      `${item.dataset.value} ${item.getAttribute("aria-posinset")}/${item.getAttribute("aria-setsize")} ${item.getAttribute("aria-expanded")}`,
  );

const FILES_SHAPE = [
  "src 1/2 true",
  "components 1/2 false",
  "button 1/2 null",
  "input 2/2 null",
  "index 2/2 null",
  "readme 2/2 null",
];

/**
 * The same pass records each item's place among its siblings and which items render a group,
 * so aria-posinset, aria-setsize, and aria-expanded come from render: they are in server HTML,
 * and hydrating changes none of them.
 */
describe("Tree position and expansion from the collection pass", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders every item's position, set size, and expansion in server HTML", () => {
    const container = serverRender(files({ defaultOpen: ["src"] }));

    expect(shape(container)).toEqual(FILES_SHAPE);
    const src = container.querySelector<HTMLElement>("[data-value='src']")!;
    expect(src.hasAttribute("data-open")).toBe(true);
    expect(container.querySelector("[data-value='components']")!.hasAttribute("data-open")).toBe(
      false,
    );
  });

  it("numbers the items of each group apart, including inside a collapsed group", () => {
    const container = serverRender(files());

    expect(shape(container)).toEqual(
      FILES_SHAPE.map((row) => row.replace("src 1/2 true", "src 1/2 false")),
    );
  });

  it("starts a nested tree's numbering at its own root", () => {
    const container = serverRender(
      <Tree aria-label="Outer">
        <TreeItem value="outer">
          Outer
          <Tree aria-label="Inner">
            <TreeItem value="a">A</TreeItem>
            <TreeItem value="b">B</TreeItem>
            <TreeItem value="c">C</TreeItem>
          </Tree>
        </TreeItem>
      </Tree>,
    );

    expect(shape(container)).toEqual(["outer 1/1 null", "a 1/3 null", "b 2/3 null", "c 3/3 null"]);
  });

  it("hydrates without a mismatch or a single attribute write, then follows client changes", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const tree = (extra: boolean) => (
      <Tree aria-label="Files" defaultOpen={["src"]}>
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
        {extra ? <TreeItem value="license">LICENSE</TreeItem> : null}
        <TreeItem value="readme">README.md</TreeItem>
      </Tree>
    );
    const container = serverRender(page(tree(false)));
    const written: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const name = record.attributeName!;
        if (name.startsWith("aria-") || name === "data-open") written.push(name);
      }
    });
    observer.observe(container, { attributes: true, subtree: true });

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, <StrictMode>{page(tree(false))}</StrictMode>);
    });
    await act(async () => {});
    observer.disconnect();

    expect(errors).not.toHaveBeenCalled();
    expect(written).toEqual([]);
    expect(shape(container)).toEqual(FILES_SHAPE);

    await act(async () => reactRoot.render(<StrictMode>{page(tree(true))}</StrictMode>));
    expect(shape(container)).toEqual([
      "src 1/3 true",
      ...FILES_SHAPE.slice(1, 5),
      "license 2/3 null",
      "readme 3/3 null",
    ]);
    await act(async () => reactRoot.unmount());
  });

  it("repairs attributes the server rendered differently from the hydration render", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = page(files({ defaultOpen: ["src"] }));
    const container = serverRender(ui);
    // As if the server had seen the tree in another order or without a group.
    const readme = container.querySelector<HTMLElement>("[data-value='readme']")!;
    readme.setAttribute("aria-posinset", "1");
    readme.setAttribute("aria-setsize", "5");
    const src = container.querySelector<HTMLElement>("[data-value='src']")!;
    src.removeAttribute("aria-expanded");
    src.removeAttribute("data-open");

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, ui);
    });

    expect(shape(container)).toEqual(FILES_SHAPE);
    expect(src.hasAttribute("data-open")).toBe(true);
    await act(async () => reactRoot.unmount());
  });
});

describe("Tree position and expansion on the client", () => {
  it("renders them after a client-only mount and follows groups that come and go", () => {
    const tree = (group: boolean) => (
      <Tree aria-label="Files" defaultOpen={["src"]}>
        <TreeItem value="src">
          src
          {group && (
            <TreeGroup>
              <TreeItem value="index">index.ts</TreeItem>
            </TreeGroup>
          )}
        </TreeItem>
        <TreeItem value="readme">README.md</TreeItem>
      </Tree>
    );
    const { container, rerender, unmount } = render(tree(true));
    expect(shape(container)).toEqual(["src 1/2 true", "index 1/1 null", "readme 2/2 null"]);

    rerender(tree(false));
    expect(shape(container)).toEqual(["src 1/2 null", "readme 2/2 null"]);
    expect(container.querySelector("[data-value='src']")!.hasAttribute("data-open")).toBe(false);
    rerender(tree(true));
    expect(shape(container)).toEqual(["src 1/2 true", "index 1/1 null", "readme 2/2 null"]);
    unmount();
  });
});

describe("Tree tab stop and collapsed groups", () => {
  it("hands the stop to the collapsed parent when its group collapses from outside", () => {
    // The parent is not the first item, so falling back to the first item would land on readme.
    const tree = (open: string[]) => (
      <Tree aria-label="Files" open={open} onOpenChange={() => {}} defaultValue="index">
        <TreeItem value="readme">README.md</TreeItem>
        <TreeItem value="src">
          src
          <TreeGroup>
            <TreeItem value="index">index.ts</TreeItem>
          </TreeGroup>
        </TreeItem>
      </Tree>
    );
    const { container, rerender, unmount } = render(tree(["src"]));
    expect(tabStops(container)).toEqual(["index"]);

    rerender(tree([]));
    expect(tabStops(container)).toEqual(["src"]);
    rerender(tree(["src"]));
    expect(tabStops(container)).toEqual(["index"]);
    unmount();
  });

  it("hands a focused item's stop to its nearest visible ancestor, not the selection", () => {
    const tree = (open: string[]) =>
      files({ open, onOpenChange: () => {}, defaultValue: "readme" });
    const { container, rerender, unmount } = render(tree(["src", "components"]));
    act(() => container.querySelector<HTMLElement>("[data-value='input']")!.focus());
    expect(tabStops(container)).toEqual(["input"]);

    rerender(tree(["src"]));
    expect(tabStops(container)).toEqual(["components"]);
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
    expect(visibleStop()).toBe("components");
    unmount();
  });
});
