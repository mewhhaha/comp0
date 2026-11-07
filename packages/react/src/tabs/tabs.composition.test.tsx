import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, setup } from "../../test/render.js";
import { Tab } from "./Tab.js";
import { TabList } from "./TabList.js";
import { TabPanel } from "./TabPanel.js";
import { Tabs } from "./Tabs.js";

function renderTabs(defaultValue?: string) {
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabList aria-label="Project">
        <Tab value="one">One</Tab>
        <Tab value="two">Two</Tab>
      </TabList>
      <TabPanel value="one">First panel</TabPanel>
      <TabPanel value="two">Second panel</TabPanel>
    </Tabs>,
  );
}

describe("tabs composition", () => {
  it("namespaces tab and panel ids so instances sharing keys stay unique", () => {
    const first = renderTabs("one");
    const second = renderTabs("one");

    const ids = [...document.querySelectorAll("[role='tab'], [role='tabpanel']")].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);

    const tab = first.container.querySelector<HTMLElement>("[role='tab']")!;
    const panel = first.container.querySelector<HTMLElement>("[role='tabpanel']")!;
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);

    first.unmount();
    second.unmount();
  });

  it("gives the first tab the only tab stop when nothing is selected", async () => {
    const { container, user, unmount } = setup(
      <Tabs>
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    expect(tablist.hasAttribute("tabindex")).toBe(false);
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    unmount();
  });

  it("leaves the tab list in one Shift+Tab when nothing is selected", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs defaultValue="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
        <button type="button">After</button>
      </>,
    );
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await user.tab();
    expect(document.activeElement).toBe(after);
    unmount();
  });

  it("keeps one fallback tab stop when the selected key is missing or disabled", async () => {
    const { container, rerender, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);

    rerender(
      <>
        <button type="button">Before</button>
        <Tabs value="one">
          <TabList aria-label="Project">
            <Tab value="one" disabled>
              One
            </Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    expect(tabs[0]!.tabIndex).toBe(-1);
    expect(tabs[1]!.tabIndex).toBe(0);
    await user.tab();
    expect(document.activeElement).toBe(tabs[1]);
    unmount();
  });

  it("moves the stop past a disabled first tab when the selected key is missing", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one" disabled>
              One
            </Tab>
            <Tab value="two">Two</Tab>
            <Tab value="three">Three</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[1]);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    unmount();
  });

  it("leaves every tab out of the sequence when all tabs are disabled", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs defaultValue="one">
          <TabList aria-label="Project">
            <Tab value="one" disabled>
              One
            </Tab>
            <Tab value="two" disabled>
              Two
            </Tab>
          </TabList>
        </Tabs>
        <button type="button">After</button>
      </>,
    );
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;

    expect(tablist.hasAttribute("tabindex")).toBe(false);
    for (const tab of container.querySelectorAll<HTMLElement>("[role='tab']")) {
      expect(tab.tabIndex).toBe(-1);
    }
    await user.click(before!);
    await user.tab();
    expect(document.activeElement).toBe(after);
    unmount();
  });

  it("moves the fallback stop to the first enabled tab when it unmounts", async () => {
    const { container, rerender, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
            <Tab value="three">Three</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;

    await user.click(before);
    await user.tab();
    expect(document.activeElement?.textContent).toBe("One");
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);

    rerender(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="two">Two</Tab>
            <Tab value="three">Three</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    await user.tab();
    expect(document.activeElement?.textContent).toBe("Two");
    unmount();
  });

  it("moves the stop to a controlled value that becomes an enabled key", async () => {
    const { container, rerender, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before);
    await user.tab();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);

    rerender(
      <>
        <button type="button">Before</button>
        <Tabs value="two">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    expect(tabs[0]!.tabIndex).toBe(-1);
    expect(tabs[1]!.tabIndex).toBe(0);
    await user.tab();
    expect(document.activeElement).toBe(tabs[1]);
    unmount();
  });

  it("keeps one tab stop when a parent re-renders with focus inside an unmatched list", async () => {
    const { container, rerender, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);

    rerender(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    expect(tablist.hasAttribute("tabindex")).toBe(false);
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[1]!.tabIndex).toBe(-1);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    unmount();
  });

  it("keeps the selected enabled tab as the only tab stop", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs defaultValue="two">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    expect(tabs[0]!.tabIndex).toBe(-1);
    expect(tabs[1]!.tabIndex).toBe(0);
    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[1]);
    unmount();
  });

  it("moves the stop to the focused tab when a controlled selection is not accepted", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="one">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]!.tabIndex).toBe(0);
    expect(tabs[0]!.tabIndex).toBe(-1);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    unmount();
  });

  it("forgets unmounted tabs instead of arrowing onto their stale keys", async () => {
    const { container, rerender, unmount, user } = setup(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
          <Tab value="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    rerender(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    container.querySelector<HTMLElement>("[role='tab']")!.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.textContent).toBe("Three");
    unmount();
  });

  it("moves from DOM focus when a controlled selection is not accepted", async () => {
    const { container, user } = setup(
      <Tabs value="one">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
          <Tab value="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[0]!.focus();

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[1]);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("mirrors horizontal arrow navigation in right-to-left layouts", async () => {
    const { container, user } = setup(
      <Tabs defaultValue="one">
        <TabList aria-label="Project" style={{ direction: "rtl" }}>
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[0]!.focus();

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tabs[1]);
  });

  it("selects a tab by click and by arrow key, showing only its panel", async () => {
    const { container, user } = setup(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
          <Tab value="three" disabled>
            Three
          </Tab>
        </TabList>
        <TabPanel value="one">First panel</TabPanel>
        <TabPanel value="two">Second panel</TabPanel>
        <TabPanel value="three">Third panel</TabPanel>
      </Tabs>,
    );
    const tabs = [...container.querySelectorAll<HTMLButtonElement>("[role='tab']")];
    const panels = () =>
      [...container.querySelectorAll<HTMLElement>("[role='tabpanel']")].map(
        (panel) => panel.hidden,
      );

    expect(panels()).toEqual([false, true, true]);
    await user.click(tabs[1]!);
    expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
    expect(panels()).toEqual([true, false, true]);

    await user.click(tabs[2]!);
    expect(tabs[2]!.disabled).toBe(true);
    expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");

    tabs[1]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tabs[0]);
    expect(panels()).toEqual([false, true, true]);
  });

  it("returns the stop to the selected tab when focus leaves a rejected selection", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="one">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
            <Tab value="three">Three</Tab>
          </TabList>
        </Tabs>
        <button type="button">After</button>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await user.click(before);
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(tabs[2]);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    expect(tabs[0]!.tabIndex).toBe(0);
    expect(tabs[2]!.tabIndex).toBe(-1);
    await user.tab();
    expect(document.activeElement).toBe(tabs[0]);
    unmount();
  });

  it("moves the stop to the next tab when the stop tab unmounts without a parent re-render", async () => {
    const { container, user, unmount } = setup(
      <>
        <button type="button">Before</button>
        <Tabs value="missing">
          <TabList aria-label="Project">
            <HideFirstTab />
            <Tab value="two">Two</Tab>
          </TabList>
        </Tabs>
        <button type="button">After</button>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const [one, two] = container.querySelectorAll<HTMLElement>("[role='tab']");
    const hide = [...container.querySelectorAll<HTMLElement>("button")].find(
      (button) => button.textContent === "Hide",
    )!;

    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(one);
    await user.click(hide);
    expect(two!.tabIndex).toBe(0);
    await user.click(before);
    await user.tab();
    expect(document.activeElement).toBe(two);
    unmount();
  });
});

// Hides its own tab from inside TabList, so the list itself does not re-render.
function HideFirstTab() {
  const [show, setShow] = useState(true);
  return (
    <>
      {show ? <Tab value="one">One</Tab> : null}
      <button type="button" tabIndex={-1} onClick={() => setShow(false)}>
        Hide
      </button>
    </>
  );
}
