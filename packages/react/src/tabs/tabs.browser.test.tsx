import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { Tab, TabList, TabPanel, Tabs } from "../index.js";

describe("tabs browser keyboard focus", () => {
  it("leaves the tab list in one Shift+Tab when nothing is selected", async () => {
    const { container, unmount } = render(
      <>
        <button type="button">Before</button>
        <Tabs defaultValue="missing">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
          <TabPanel value="one">First panel</TabPanel>
        </Tabs>
        <button type="button">After</button>
      </>,
    );
    const [before, after] = container.querySelectorAll<HTMLElement>(":scope > button");
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await userEvent.click(before!);
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(after);
    unmount();
  });

  it("keeps the selected tab as the only tab stop in Tab order", async () => {
    const { container, unmount } = render(
      <>
        <button type="button">Before</button>
        <Tabs defaultValue="two">
          <TabList aria-label="Project">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
          <TabPanel value="two">Second panel</TabPanel>
        </Tabs>
      </>,
    );
    const before = container.querySelector<HTMLElement>("button")!;
    const tabs = container.querySelectorAll<HTMLElement>("[role='tab']");

    await userEvent.click(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs[1]);
    await userEvent.tab();
    expect(document.activeElement?.getAttribute("role")).toBe("tabpanel");
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(tabs[1]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    unmount();
  });

  it("returns the stop to the selected tab when focus leaves a rejected selection", async () => {
    const { container, unmount } = render(
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

    await userEvent.click(before);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(tabs[2]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(before);
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs[0]);
    unmount();
  });
});
