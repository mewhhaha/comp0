import { act, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe.js";
import { GridList, GridListItem, ListBox, ListBoxOption, Tab, TabList, Tabs } from "./index.js";

const cases: { name: string; role: string; forward: string; ui: ReactElement }[] = [
  {
    name: "ListBox",
    role: "listbox",
    forward: "{ArrowDown}",
    ui: (
      <ListBox aria-label="Fruit">
        <ListBoxOption value="apple">Apple</ListBoxOption>
        <ListBoxOption value="pear">Pear</ListBoxOption>
      </ListBox>
    ),
  },
  {
    name: "GridList",
    role: "grid",
    forward: "{ArrowDown}",
    ui: (
      <GridList aria-label="Files">
        <GridListItem value="readme">Readme</GridListItem>
        <GridListItem value="license">License</GridListItem>
      </GridList>
    ),
  },
  {
    name: "Tabs",
    role: "tablist",
    forward: "{ArrowRight}",
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

/**
 * The root is the tab stop in server HTML with nothing selected. Chromium blurs a focused
 * element that stops being focusable, which jsdom does not model, so the hand-over from root to
 * item is checked here: the root keeps tabindex -1 and therefore keeps focus.
 */
describe.each(cases)("$name root tab stop across hydration", ({ role, forward, ui }) => {
  it("is reachable before hydration, keeps focus through it, and does not trap", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(page(ui));
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");
    const root = container.querySelector<HTMLElement>(`[role='${role}']`)!;

    await userEvent.click(before!);
    await userEvent.tab();
    expect(document.activeElement).toBe(root);
    await expectNoAxeViolations(container);

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, page(ui));
    });
    // Let Chromium run the focus fixup it would apply to an element that became unfocusable.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(root.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(root);

    await userEvent.keyboard(forward);
    const first = root.querySelector<HTMLElement>("[tabindex='0']")!;
    expect(document.activeElement).toBe(first);
    await expectNoAxeViolations(container);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    await userEvent.tab();
    expect(document.activeElement).toBe(after);
    await act(async () => reactRoot.unmount());
    container.remove();
  });
});
