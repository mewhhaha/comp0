import { act, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../test/axe.js";
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "./index.js";

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
        <TabPanel value="one">First panel</TabPanel>
        <TabPanel value="two">Second panel</TabPanel>
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
 * The first enabled item holds the tab stop in server HTML with nothing selected, so the
 * composite is reachable before hydration, and hydration keeps the focused element.
 */
describe.each(cases)("$name tab stop across hydration", ({ role, forward, ui }) => {
  it("is reachable before hydration, keeps focus through it, and does not trap", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    container.innerHTML = renderToString(page(ui));
    const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
    const root = container.querySelector<HTMLElement>(`[role='${role}']`)!;
    const first = root.querySelector<HTMLElement>("[tabindex='0']")!;

    await userEvent.click(before!);
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    await expectNoAxeViolations(container);

    let reactRoot!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      reactRoot = hydrateRoot(container, page(ui));
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(first);
    expect(root.querySelectorAll("[tabindex='0']")).toHaveLength(1);
    expect(root.querySelector(":scope > [hidden]:empty")).toBeNull();

    await userEvent.keyboard(forward);
    const second = root.querySelector<HTMLElement>("[tabindex='0']")!;
    expect(second).not.toBe(first);
    expect(document.activeElement).toBe(second);
    await expectNoAxeViolations(container);

    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(second);
    // The next Tab leaves the composite: one stop, however many items.
    await userEvent.tab();
    expect(root.contains(document.activeElement)).toBe(false);
    await act(async () => reactRoot.unmount());
    container.remove();
  });
});
