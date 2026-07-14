import { act } from "react";
import { describe, expect, it } from "vitest";
import { fireKeyDown, render } from "../test/render.js";
import { Tab } from "./components/Tab.js";
import { TabList } from "./components/TabList.js";
import { TabPanel } from "./components/TabPanel.js";
import { Tabs } from "./components/Tabs.js";

function renderTabs(defaultValue?: string) {
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabList aria-label="Project">
        <Tab tab="one">One</Tab>
        <Tab tab="two">Two</Tab>
      </TabList>
      <TabPanel tab="one">First panel</TabPanel>
      <TabPanel tab="two">Second panel</TabPanel>
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

  it("keeps the tab list keyboard reachable when nothing is selected", () => {
    const { container, unmount } = renderTabs();
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    for (const tab of tabs) expect(tab.tabIndex).toBe(-1);
    expect(tablist.tabIndex).toBe(0);
    act(() => {
      tablist.focus();
    });
    expect(document.activeElement).toBe(tabs[0]);
    unmount();
  });

  it("forgets unmounted tabs instead of arrowing onto their stale keys", () => {
    const { container, rerender, unmount } = render(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Tab tab="one">One</Tab>
          <Tab tab="two">Two</Tab>
          <Tab tab="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    rerender(
      <Tabs defaultValue="one">
        <TabList aria-label="Project">
          <Tab tab="one">One</Tab>
          <Tab tab="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    fireKeyDown(tablist, "ArrowRight");
    expect(document.activeElement?.textContent).toBe("Three");
    unmount();
  });

  it("keeps a fallback tab stop when the selected key is missing or disabled", () => {
    const { container, rerender } = render(
      <Tabs value="missing">
        <TabList aria-label="Project">
          <Tab tab="one">One</Tab>
          <Tab tab="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    expect(tablist.tabIndex).toBe(0);
    act(() => tablist.focus());
    expect(document.activeElement?.textContent).toBe("One");

    rerender(
      <Tabs value="one">
        <TabList aria-label="Project">
          <Tab tab="one" disabled>
            One
          </Tab>
          <Tab tab="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    expect(tablist.tabIndex).toBe(0);
    act(() => tablist.focus());
    expect(document.activeElement?.textContent).toBe("Two");
  });

  it("moves from DOM focus when a controlled selection is not accepted", () => {
    const { container } = render(
      <Tabs value="one">
        <TabList aria-label="Project">
          <Tab tab="one">One</Tab>
          <Tab tab="two">Two</Tab>
          <Tab tab="three">Three</Tab>
        </TabList>
      </Tabs>,
    );
    const tablist = container.querySelector<HTMLElement>("[role='tablist']")!;
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    tabs[0]!.focus();

    fireKeyDown(tablist, "ArrowRight");
    expect(document.activeElement).toBe(tabs[1]);
    fireKeyDown(tabs[1]!, "ArrowRight");
    expect(document.activeElement).toBe(tabs[2]);
  });
});
