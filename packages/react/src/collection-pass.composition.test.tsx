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
});
