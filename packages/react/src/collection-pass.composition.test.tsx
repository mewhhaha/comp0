import { act, Fragment, Suspense, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setup } from "../test/render.js";
import {
  Autocomplete,
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  SearchField,
  SearchFieldInput,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "./index.js";

function serverRender(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(ui);
  return container;
}

const stops = (container: Element, role: string) =>
  [...container.querySelectorAll<HTMLElement>(`[role='${role}'][tabindex='0']`)].map(
    (item) => item.dataset.value ?? item.textContent,
  );

async function hydrate(container: Element, ui: ReactElement) {
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });
  return root;
}

/** The collection pass across the families that use it; `tab-stop.screen-reader.test.tsx` covers what is announced. */
describe("collection pass", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("merges TabList as={Fragment} into its child", () => {
    const { container } = setup(
      <Tabs defaultValue="one">
        <TabList as={Fragment} aria-label="Project">
          <ul>
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </ul>
        </TabList>
      </Tabs>,
    );

    expect(container.querySelector("ul")!.getAttribute("role")).toBe("tablist");
  });

  it("merges ListBox as={Fragment} into its child", () => {
    const { container } = setup(
      <ListBox as={Fragment} aria-label="Fruit">
        <ul>
          <ListBoxOption value="apple">Apple</ListBoxOption>
        </ul>
      </ListBox>,
    );

    expect(container.querySelector("ul")!.getAttribute("role")).toBe("listbox");
  });

  it("merges GridList as={Fragment} into its child", () => {
    const { container } = setup(
      <GridList as={Fragment} aria-label="Files">
        <ul>
          <GridListItem value="a">A</GridListItem>
        </ul>
      </GridList>,
    );

    expect(container.querySelector("ul")!.getAttribute("role")).toBe("grid");
  });

  it("renders and hydrates as={Fragment} with the pass ahead of the merged child", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <ListBox as={Fragment} aria-label="Fruit" defaultValue="missing">
        <ul>
          <ListBoxOption value="apple" disabled>
            Apple
          </ListBoxOption>
          <ListBoxOption value="pear">Pear</ListBoxOption>
        </ul>
      </ListBox>
    );
    const container = serverRender(ui);
    const list = container.querySelector("ul[role='listbox']")!;

    expect(stops(container, "option")).toEqual(["pear"]);
    // The consumer's element is also rendered once in the pass, hidden, until hydration.
    expect(container.querySelectorAll("ul")).toHaveLength(2);
    const root = await hydrate(container, ui);
    expect(errors).not.toHaveBeenCalled();
    expect(container.querySelectorAll("ul")).toHaveLength(1);
    expect(container.querySelector("ul")).toBe(list);
    expect(stops(container, "option")).toEqual(["pear"]);
    expect(container.querySelector("[hidden]")).toBeNull();
    await act(async () => root.unmount());
  });

  it("hydrates options inside a Suspense boundary without a mismatch", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <ListBox aria-label="Fruit">
        <Suspense fallback={null}>
          <ListBoxOption value="pear">Pear</ListBoxOption>
          <ListBoxOption value="plum">Plum</ListBoxOption>
        </Suspense>
      </ListBox>
    );
    const container = serverRender(ui);

    expect(stops(container, "option")).toEqual(["pear"]);
    const root = await hydrate(container, ui);
    expect(stops(container, "option")).toEqual(["pear"]);
    expect(errors).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  it("hydrates tabs inside a Suspense boundary without a mismatch", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <Tabs>
        <TabList aria-label="Project">
          <Suspense fallback={null}>
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </Suspense>
        </TabList>
        <TabPanel value="one">First</TabPanel>
        <TabPanel value="two">Second</TabPanel>
      </Tabs>
    );
    const container = serverRender(ui);

    expect(stops(container, "tab")).toEqual(["One"]);
    const root = await hydrate(container, ui);
    expect(stops(container, "tab")).toEqual(["One"]);
    expect(errors).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  it("settles on the selected option when it hydrates late, inside a Suspense boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <ListBox aria-label="Fruit" defaultValue="plum">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <Suspense fallback={null}>
          <ListBoxOption value="pear">Pear</ListBoxOption>
          <ListBoxOption value="plum">Plum</ListBoxOption>
        </Suspense>
      </ListBox>
    );
    const container = serverRender(ui);

    expect(stops(container, "option")).toEqual(["plum"]);
    const root = await hydrate(container, ui);
    expect(stops(container, "option")).toEqual(["plum"]);
    await act(async () => root.unmount());
  });

  it("gives a visible option the stop when Autocomplete filters on the server", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <Autocomplete
        disableVirtualFocus
        defaultInputValue="p"
        filter={(text, input) => text.toLowerCase().includes(input)}
      >
        <SearchField>
          <SearchFieldInput aria-label="Search" />
        </SearchField>
        <ListBox aria-label="Fruit">
          <ListBoxOption value="kiwi">Kiwi</ListBoxOption>
          <ListBoxOption value="pear">Pear</ListBoxOption>
          <ListBoxOption value="plum">Plum</ListBoxOption>
        </ListBox>
      </Autocomplete>
    );
    const container = serverRender(ui);

    expect(stops(container, "option")).toEqual(["pear"]);
    const root = await hydrate(container, ui);
    expect(stops(container, "option")).toEqual(["pear"]);
    expect(errors).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  // React hydrates a Suspense boundary apart from the items around it, so the client sees only
  // part of the collection at each step and can disagree with the server's HTML while it
  // hydrates. In development React logs that as an attribute mismatch; what must hold is that
  // server HTML and the hydrated DOM each have the one correct stop.
  it.each([
    {
      name: "the selected option inside a boundary with nothing outside it",
      role: "option",
      stop: "plum",
      ui: (
        <ListBox aria-label="Fruit" defaultValue="plum">
          <Suspense fallback={null}>
            <ListBoxOption value="pear">Pear</ListBoxOption>
            <ListBoxOption value="plum">Plum</ListBoxOption>
          </Suspense>
        </ListBox>
      ),
    },
    {
      name: "no selection, a boundary first and an enabled tab after it",
      role: "tab",
      stop: "One",
      ui: (
        <Tabs>
          <TabList aria-label="Project">
            <Suspense fallback={null}>
              <Tab value="one">One</Tab>
            </Suspense>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      ),
    },
    {
      name: "no selection, a disabled option outside and enabled ones inside a boundary",
      role: "option",
      stop: "pear",
      ui: (
        <ListBox aria-label="Fruit">
          <ListBoxOption value="apple" disabled>
            Apple
          </ListBoxOption>
          <Suspense fallback={null}>
            <ListBoxOption value="pear">Pear</ListBoxOption>
          </Suspense>
        </ListBox>
      ),
    },
    {
      name: "the selected row inside a boundary with a row outside it",
      role: "row",
      stop: "b",
      ui: (
        <GridList aria-label="Files" defaultValue="b">
          <GridListItem value="a">A</GridListItem>
          <Suspense fallback={null}>
            <GridListItem value="b">B</GridListItem>
          </Suspense>
        </GridList>
      ),
    },
  ])("ends with the one correct stop for $name", async ({ role, stop, ui }) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const container = serverRender(ui);

    expect(stops(container, role)).toEqual([stop]);
    const root = await hydrate(container, ui);
    expect(stops(container, role)).toEqual([stop]);
    await act(async () => root.unmount());
  });

  it("keeps a composite nested between a root and its items out of that root's collection", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <ListBox aria-label="Fruit">
        <div role="presentation">
          <Tabs defaultValue="two">
            <TabList aria-label="Kind">
              <Tab value="one">One</Tab>
              <Tab value="two">Two</Tab>
            </TabList>
          </Tabs>
        </div>
        <ListBoxOption value="apple">Apple</ListBoxOption>
      </ListBox>
    );
    const container = serverRender(ui);

    expect(stops(container, "option")).toEqual(["apple"]);
    const root = await hydrate(container, ui);
    expect(errors).not.toHaveBeenCalled();
    expect(stops(container, "option")).toEqual(["apple"]);
    await act(async () => root.unmount());
  });

  // The hydration repair must only write what the part itself rendered: with as={Fragment} a
  // part's undefined prop leaves the child's own value in place.
  it("keeps the tabIndex a disabled ListBoxOption as={Fragment} child renders", () => {
    const { container } = setup(
      <ListBox aria-label="Pages">
        <ListBoxOption value="home">Home</ListBoxOption>
        <ListBoxOption as={Fragment} value="admin" disabled>
          <a href="/admin" tabIndex={-1}>
            Admin
          </a>
        </ListBoxOption>
      </ListBox>,
    );

    expect(container.querySelector("a")!.getAttribute("tabindex")).toBe("-1");
  });

  it("keeps the tabIndex a disabled GridListItem as={Fragment} child renders", () => {
    const { container } = setup(
      <GridList aria-label="Pages">
        <GridListItem value="home">Home</GridListItem>
        <GridListItem as={Fragment} value="admin" disabled>
          <a href="/admin" tabIndex={-1}>
            Admin
          </a>
        </GridListItem>
      </GridList>,
    );

    expect(container.querySelector("a")!.getAttribute("tabindex")).toBe("-1");
  });

  it("keeps a data-active value an inactive ListBoxOption as={Fragment} child renders", () => {
    const { container } = setup(
      <ListBox aria-label="Pages">
        <ListBoxOption value="home">Home</ListBoxOption>
        <ListBoxOption as={Fragment} value="docs">
          <a href="/docs" data-active="route">
            Docs
          </a>
        </ListBoxOption>
      </ListBox>,
    );

    expect(container.querySelector("a")!.getAttribute("data-active")).toBe("route");
  });
});
