import { act, type ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { virtual } from "@guidepup/virtual-screen-reader";
import { afterEach, describe, expect, it } from "vitest";
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  Menu,
  Menubar,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tab,
  TabList,
  Tabs,
} from "./index.js";

type Case = {
  name: string;
  ui: ReactElement;
  /** What a screen reader says when focus lands on the root itself. */
  root: string;
  /** What it says when focus lands on the first item. */
  firstItem: string;
  /** The arrow that moves forward in this composite. */
  forward: string;
};

const cases: Case[] = [
  {
    name: "ListBox",
    root: "listbox, Fruit, orientated vertically",
    firstItem: "option, Apple, not selected, position 1, set size 2",
    forward: "ArrowDown",
    ui: (
      <ListBox aria-label="Fruit">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>
    ),
  },
  {
    name: "GridList",
    root: "grid, Files",
    firstItem: "row, Readme, not selected",
    forward: "ArrowDown",
    ui: (
      <GridList aria-label="Files">
        <GridListItem value="readme">Readme</GridListItem>
        <GridListItem value="license">License</GridListItem>
      </GridList>
    ),
  },
  {
    name: "Menubar",
    root: "menubar, Application, orientated horizontally",
    firstItem: "menuitem, File, 1 control, not expanded, has popup menu, position 1, set size 2",
    forward: "ArrowRight",
    ui: (
      <Menubar aria-label="Application">
        <Menu>
          <MenuTrigger>File</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>New</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu>
          <MenuTrigger>Edit</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Undo</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </Menubar>
    ),
  },
  {
    name: "Tabs",
    root: "tablist, Project, orientated horizontally",
    firstItem: "tab, One, not selected, position 1, set size 2",
    forward: "ArrowRight",
    ui: (
      <Tabs>
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>
    ),
  },
];

const page = (ui: ReactElement) => (
  <>
    <button type="button">Before</button>
    {ui}
    <button type="button">After</button>
  </>
);

function mountContainer() {
  const container = document.createElement("div");
  document.body.append(container);
  return container;
}

/**
 * What a screen reader user hears around the roving tab stop, through guidepup's virtual
 * screen reader. With nothing selected the root is the tab stop until an item registers, so the
 * composite is reachable in server HTML; once an item holds the stop the root leaves the tab
 * order, so it is never announced on the way in and cannot trap Shift+Tab.
 */
describe.each(cases)("$name tab stop for a screen reader", ({ ui, root, firstItem, forward }) => {
  afterEach(async () => {
    await virtual.stop();
    document.body.innerHTML = "";
  });

  it("announces the root by role and name in server HTML, before any script runs", async () => {
    const container = mountContainer();
    container.innerHTML = renderToString(page(ui));
    await virtual.start({ container });

    await virtual.press("Tab");

    expect(await virtual.lastSpokenPhrase()).toBe(root);
    // Without the root as a stop, Tab would skip the whole composite.
    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe("button, After");
  });

  it("keeps focus on a root focused before hydration and enters at the first item", async () => {
    const container = mountContainer();
    container.innerHTML = renderToString(page(ui));
    await virtual.start({ container });
    await virtual.press("Tab");
    const focusedRoot = document.activeElement;
    await virtual.clearSpokenPhraseLog();

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, page(ui));
    });

    // Hydration says nothing and moves nothing: the user is still on the root.
    expect(document.activeElement).toBe(focusedRoot);
    expect(await virtual.spokenPhraseLog()).toEqual([]);
    await virtual.press(forward);
    expect(await virtual.spokenPhraseLog()).toEqual([firstItem]);
    await act(async () => reactRoot.unmount());
  });

  it("goes straight to the first item once mounted, without announcing the root", async () => {
    const container = mountContainer();
    let reactRoot!: ReturnType<typeof createRoot>;
    await act(async () => {
      reactRoot = createRoot(container);
      reactRoot.render(page(ui));
    });
    await virtual.start({ container });

    await virtual.press("Tab");

    // The reader starts on the first node of the page; one Tab then says the item and nothing
    // for the root in between.
    expect(await virtual.spokenPhraseLog()).toEqual(["button, Before", firstItem]);
    await act(async () => reactRoot.unmount());
  });

  it("lets Shift+Tab and Tab leave from an item in one press", async () => {
    const container = mountContainer();
    let reactRoot!: ReturnType<typeof createRoot>;
    await act(async () => {
      reactRoot = createRoot(container);
      reactRoot.render(page(ui));
    });
    await virtual.start({ container });
    await virtual.press("Tab");

    await virtual.press("Shift+Tab");
    expect(await virtual.lastSpokenPhrase()).toBe("button, Before");
    await virtual.press("Tab");
    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe("button, After");
    await act(async () => reactRoot.unmount());
  });
});
