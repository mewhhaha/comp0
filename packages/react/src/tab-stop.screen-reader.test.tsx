import { act, StrictMode, type ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { virtual } from "@guidepup/virtual-screen-reader";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  /** The same composite with a value that matches no item, where the family has a value. */
  unmatched?: ReactElement;
  /** What it says when focus lands on the first item. */
  firstItem: string;
  /** The arrow that moves forward in this composite. */
  forward: string;
};

const cases: Case[] = [
  {
    name: "ListBox",
    firstItem: "option, Apple, not selected, position 1, set size 2",
    forward: "ArrowDown",
    ui: (
      <ListBox aria-label="Fruit">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>
    ),
    unmatched: (
      <ListBox aria-label="Fruit" defaultValue="missing">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>
    ),
  },
  {
    name: "GridList",
    firstItem: "row, Readme, not selected",
    forward: "ArrowDown",
    ui: (
      <GridList aria-label="Files">
        <GridListItem value="readme">Readme</GridListItem>
        <GridListItem value="license">License</GridListItem>
      </GridList>
    ),
    unmatched: (
      <GridList aria-label="Files" defaultValue="missing">
        <GridListItem value="readme">Readme</GridListItem>
        <GridListItem value="license">License</GridListItem>
      </GridList>
    ),
  },
  {
    name: "Menubar",
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
    unmatched: (
      <Tabs defaultValue="missing">
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
 * screen reader. The first enabled item holds the stop in server HTML, before any item has
 * registered an element: ListBox, GridList, and TabList collect their items in a pass ahead of
 * the real ones, and Menubar triggers record themselves in render order.
 */
describe.each(cases)(
  "$name tab stop for a screen reader",
  ({ ui, unmatched, firstItem, forward }) => {
    afterEach(async () => {
      await virtual.stop();
      document.body.innerHTML = "";
      vi.restoreAllMocks();
    });

    it("reaches the first item in server HTML, before any script runs", async () => {
      const container = mountContainer();
      container.innerHTML = renderToString(page(ui));
      await virtual.start({ container });

      await virtual.press("Tab");
      expect(await virtual.lastSpokenPhrase()).toBe(firstItem);
      await virtual.press("Tab");
      expect(await virtual.lastSpokenPhrase()).toBe("button, After");
    });

    it.runIf(unmatched)("reaches the first item when the value matches no item", async () => {
      const container = mountContainer();
      container.innerHTML = renderToString(page(unmatched!));
      await virtual.start({ container });

      await virtual.press("Tab");

      expect(await virtual.lastSpokenPhrase()).toBe(firstItem);
    });

    it("hydrates silently with focus on the item, then moves with the arrow keys", async () => {
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const container = mountContainer();
      container.innerHTML = renderToString(page(ui));
      await virtual.start({ container });
      await virtual.press("Tab");
      const focusedItem = document.activeElement;
      await virtual.clearSpokenPhraseLog();

      let reactRoot!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        reactRoot = hydrateRoot(container, <StrictMode>{page(ui)}</StrictMode>);
      });

      // Hydration reuses the server's elements, says nothing, and moves nothing.
      expect(errors).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(focusedItem);
      expect(await virtual.spokenPhraseLog()).toEqual([]);
      expect(container.querySelectorAll("[hidden]:empty")).toHaveLength(0);
      expect(container.querySelectorAll("[tabindex='0']")).toHaveLength(1);
      await virtual.press(forward);
      expect(document.activeElement).not.toBe(focusedItem);
      expect(container.querySelectorAll("[tabindex='0']")).toHaveLength(1);
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
      expect(await virtual.lastSpokenPhrase()).toBe(firstItem);

      await virtual.press("Shift+Tab");
      expect(await virtual.lastSpokenPhrase()).toBe("button, Before");
      await virtual.press("Tab");
      await virtual.press("Tab");
      expect(await virtual.lastSpokenPhrase()).toBe("button, After");
      await act(async () => reactRoot.unmount());
    });
  },
);
