import { act, Fragment, Suspense, use, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "../test/render.js";
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

function stream(ui: ReactElement, afterStart: () => void) {
  let html = "";
  return new Promise<string>((done, fail) => {
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += String(chunk);
        callback();
      },
      final(callback) {
        callback();
        done(html);
      },
    });
    const pipeable = renderToPipeableStream(ui, {
      onAllReady() {
        pipeable.pipe(sink);
      },
      onError: fail,
    });
    afterStart();
  });
}

function gate() {
  let open!: () => void;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

const stops = (container: Element, role: string) =>
  [...container.querySelectorAll<HTMLElement>(`[role='${role}'][tabindex='0']`)]
    .filter((item) => !item.closest("[hidden]"))
    .map((item) => item.dataset.value ?? item.textContent);

async function streamThenHydrate(ui: ReactElement, afterStart: () => void) {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = await stream(ui, afterStart);
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });
  await act(async () => {});
  return { container, root };
}

/**
 * The server renders past a component that suspends and comes back to it, so it can see the
 * items out of document order and give the stop to a later one, while the client hydrates them
 * in order. React leaves a mismatched attribute as the server sent it, so each item writes what
 * it rendered once after hydrating (`internal/hydration-repair.ts`). What must hold is the
 * state after hydration and after the next interaction: one stop, on the right item. Kept apart
 * from the other suites because `renderToPipeableStream` makes React log a "multiple renderers"
 * error in later tests of the same file.
 */
describe("hydrating HTML the server rendered out of order", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("puts the stop on the first option when it suspended on the server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const late = gate();
    const Late = () => {
      use(late.promise);
      return <ListBoxOption value="apple">Apple</ListBoxOption>;
    };
    const { container, root } = await streamThenHydrate(
      <ListBox aria-label="Fruit">
        <Late />
        <ListBoxOption value="pear">Pear</ListBoxOption>
        <ListBoxOption value="plum">Plum</ListBoxOption>
      </ListBox>,
      late.open,
    );

    expect(stops(container, "option")).toEqual(["apple"]);
    expect(
      [...container.querySelectorAll<HTMLElement>("[data-active]")].map((o) => o.dataset.value),
    ).toEqual(["apple"]);
    await userEvent.setup().click(container.querySelector("[data-value='plum']")!);
    expect(stops(container, "option")).toEqual(["plum"]);
    await act(async () => root.unmount());
  });

  it("puts the stop on the selected tab when it suspended on the server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const late = gate();
    const Late = () => {
      use(late.promise);
      return <Tab value="one">One</Tab>;
    };
    const { container, root } = await streamThenHydrate(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Late />
          <Tab value="two">Two</Tab>
          <Tab value="three">Three</Tab>
        </TabList>
      </Tabs>,
      late.open,
    );

    expect(stops(container, "tab")).toEqual(["One"]);
    await userEvent.setup().click(container.querySelectorAll<HTMLElement>("[role='tab']")[2]!);
    expect(stops(container, "tab")).toEqual(["Three"]);
    await act(async () => root.unmount());
  });

  it("puts the stop on the first row when it suspended on the server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const late = gate();
    const Late = () => {
      use(late.promise);
      return <GridListItem value="a">A</GridListItem>;
    };
    const { container, root } = await streamThenHydrate(
      <GridList aria-label="Files">
        <Late />
        <GridListItem value="b">B</GridListItem>
        <GridListItem value="c">C</GridListItem>
      </GridList>,
      late.open,
    );

    expect(stops(container, "row")).toEqual(["a"]);
    await userEvent.setup().click(container.querySelector("[data-value='c']")!);
    expect(stops(container, "row")).toEqual(["c"]);
    await act(async () => root.unmount());
  });

  it("puts the stop on the first trigger when its menu suspended on the server", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const late = gate();
    const menu = (label: string) => (
      <Menu>
        <MenuTrigger>{label}</MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Item</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    );
    const Late = () => {
      use(late.promise);
      return menu("File");
    };
    const { container, root } = await streamThenHydrate(
      <Menubar aria-label="Application">
        <Late />
        {menu("Edit")}
        {menu("View")}
      </Menubar>,
      late.open,
    );

    expect(stops(container, "menuitem")).toEqual(["File"]);
    const view = [...container.querySelectorAll<HTMLElement>("[role='menuitem']")].find(
      (item) => item.textContent === "View",
    )!;
    await act(async () => view.focus());
    expect(stops(container, "menuitem")).toEqual(["View"]);
    await act(async () => root.unmount());
  });

  it("settles on the first option when two boundaries resolve on the server in reverse order", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const first = gate();
    const second = gate();
    const First = () => {
      use(first.promise);
      return <ListBoxOption value="apple">Apple</ListBoxOption>;
    };
    const Second = () => {
      use(second.promise);
      return (
        <>
          <ListBoxOption value="pear">Pear</ListBoxOption>
          <ListBoxOption value="plum">Plum</ListBoxOption>
        </>
      );
    };
    const { container, root } = await streamThenHydrate(
      <ListBox aria-label="Fruit">
        <Suspense fallback={null}>
          <First />
        </Suspense>
        <Suspense fallback={null}>
          <Second />
        </Suspense>
      </ListBox>,
      () => {
        second.open();
        setTimeout(first.open, 20);
      },
    );

    expect(stops(container, "option")).toEqual(["apple"]);
    await userEvent.setup().click(container.querySelector("[data-value='plum']")!);
    expect(stops(container, "option")).toEqual(["plum"]);
    await act(async () => root.unmount());
  });

  it("keeps an as={Fragment} child's own data-active when the server marked it active", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const late = gate();
    const Late = () => {
      use(late.promise);
      return (
        <ListBoxOption as={Fragment} value="apple">
          <a href="/apple">Apple</a>
        </ListBoxOption>
      );
    };
    const { container, root } = await streamThenHydrate(
      <ListBox aria-label="Fruit">
        <Late />
        <ListBoxOption as={Fragment} value="pear">
          <a href="/pear" data-active="route">
            Pear
          </a>
        </ListBoxOption>
      </ListBox>,
      late.open,
    );

    expect(stops(container, "option")).toEqual(["apple"]);
    expect(container.querySelector("[data-value='pear']")!.getAttribute("data-active")).toBe(
      "route",
    );
    await act(async () => root.unmount());
  });
});
