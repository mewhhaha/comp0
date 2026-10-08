import { act } from "react";
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

  it("keeps a fallback tab stop when the selected key is missing or disabled", () => {
    const { container, rerender } = render(
      <Tabs value="missing">
        <TabList aria-label="Project">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
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
          <Tab value="one" disabled>
            One
          </Tab>
          <Tab value="two">Two</Tab>
        </TabList>
      </Tabs>,
    );
    expect(tablist.tabIndex).toBe(0);
    act(() => tablist.focus());
    expect(document.activeElement?.textContent).toBe("Two");
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
});
