import { act, StrictMode, type ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { virtual } from "@guidepup/virtual-screen-reader";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListBox, ListBoxOptGroup, ListBoxOption, ListBoxSeparator } from "../index.js";

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
  [...container.querySelectorAll<HTMLElement>("[role='option'][tabindex='0']")].map(
    (option) => option.dataset.value,
  );

/**
 * On the server and while hydrating, ListBox renders its children once more ahead of
 * the real options, where each option only records its key and disabled state. The real options
 * therefore resolve the roving tab stop in server HTML, without waiting for DOM registration.
 */
describe("ListBox collection pass", () => {
  afterEach(async () => {
    await virtual.stop();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("gives the first option the tab stop in server HTML when nothing is selected", () => {
    const container = serverRender(
      <ListBox aria-label="Fruit">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>,
    );

    expect(tabStops(container)).toEqual(["apple"]);
    expect(container.querySelector("[role='listbox']")!.hasAttribute("tabindex")).toBe(false);
  });

  it("falls back to the first enabled option when the value matches no option", () => {
    const container = serverRender(
      <ListBox aria-label="Fruit" defaultValue="missing">
        <ListBoxOption value="apple" disabled>
          Apple
        </ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
        <ListBoxOption value="plum">Plum</ListBoxOption>
      </ListBox>,
    );

    expect(tabStops(container)).toEqual(["pear"]);
  });

  it("keeps the stop on a selected option and skips a disabled selection", () => {
    const selected = serverRender(
      <ListBox aria-label="Fruit" defaultValue="pear">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>,
    );
    const disabledSelection = serverRender(
      <ListBox aria-label="Fruit" defaultValue="pear">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear" disabled>
          Pear
        </ListBoxOption>
      </ListBox>,
    );

    expect(tabStops(selected)).toEqual(["pear"]);
    expect(tabStops(disabledSelection)).toEqual(["apple"]);
  });

  it("collects options through groups, separators, and consumer components", () => {
    const Fruits = () => (
      <>
        <ListBoxOption value="apple" disabled>
          Apple
        </ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </>
    );
    const container = serverRender(
      <ListBox aria-label="Food">
        <ListBoxOptGroup aria-label="Fruit">
          <Fruits />
        </ListBoxOptGroup>
        <ListBoxSeparator />
        <ListBoxOption value="kale">Kale</ListBoxOption>
      </ListBox>,
    );

    expect(tabStops(container)).toEqual(["pear"]);
    // The pass leaves nothing behind but its empty, hidden holder: no duplicate parts.
    expect(container.querySelectorAll("[role='option']")).toHaveLength(3);
    expect(container.querySelectorAll("[role='group']")).toHaveLength(1);
    expect(container.querySelector("[role='listbox'] > [hidden]")!.childNodes).toHaveLength(0);
  });

  it("lets a screen reader reach the first option before any script runs", async () => {
    const container = serverRender(
      page(
        <ListBox aria-label="Fruit">
          <ListBoxOption value="apple">Apple</ListBoxOption>
          <ListBoxOption value="pear">Pear</ListBoxOption>
        </ListBox>,
      ),
    );
    await virtual.start({ container });

    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe(
      "option, Apple, not selected, position 1, set size 2",
    );
    await virtual.press("Tab");
    expect(await virtual.lastSpokenPhrase()).toBe("button, After");
  });

  it("hydrates without a mismatch, keeps focus, and removes the pass", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = page(
      <ListBox aria-label="Fruit" defaultValue="missing">
        <ListBoxOption value="apple" disabled>
          Apple
        </ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>,
    );
    const container = serverRender(ui);
    const pear = container.querySelector<HTMLElement>("[data-value='pear']")!;
    pear.focus();

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, <StrictMode>{ui}</StrictMode>);
    });

    expect(errors).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(pear);
    expect(container.querySelector<HTMLElement>("[data-value='pear']")).toBe(pear);
    expect(tabStops(container)).toEqual(["pear"]);
    expect(container.querySelector("[role='listbox'] > [hidden]")).toBeNull();
    await act(async () => reactRoot.unmount());
  });

  it("renders no pass on a client-only mount", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const rendered = vi.fn();
    const Counted = () => {
      rendered();
      return <ListBoxOption value="apple">Apple</ListBoxOption>;
    };
    let reactRoot!: ReturnType<typeof createRoot>;
    await act(async () => {
      reactRoot = createRoot(container);
      reactRoot.render(
        <ListBox aria-label="Fruit">
          <Counted />
        </ListBox>,
      );
    });

    expect(rendered).toHaveBeenCalledTimes(1);
    expect(tabStops(container)).toEqual(["apple"]);
    expect(container.querySelector("[role='listbox'] > [hidden]")).toBeNull();
    await act(async () => reactRoot.unmount());
  });
});
