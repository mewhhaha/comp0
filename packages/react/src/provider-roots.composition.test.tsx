import { Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../test/render.js";
import { Accordion } from "./accordion/Accordion.js";
import { AccordionHeader } from "./accordion/AccordionHeader.js";
import { AccordionItem } from "./accordion/AccordionItem.js";
import { AccordionPanel } from "./accordion/AccordionPanel.js";
import { AccordionTrigger } from "./accordion/AccordionTrigger.js";
import { Input } from "./text-field/Input.js";
import { SearchField } from "./search-field/SearchField.js";
import { SearchFieldClear } from "./search-field/SearchFieldClear.js";
import { SearchFieldInput } from "./search-field/SearchFieldInput.js";
import { Tab } from "./tabs/Tab.js";
import { TabList } from "./tabs/TabList.js";
import { TabPanel } from "./tabs/TabPanel.js";
import { Tabs } from "./tabs/Tabs.js";
import { TextField } from "./text-field/TextField.js";

describe("provider roots", () => {
  it("keeps text and search field roots wrapper-free while their explicit parts own behavior", async () => {
    const submitted = vi.fn();
    const cleared = vi.fn();
    const { container, user } = setup(
      <>
        <TextField id="name">
          <Input />
        </TextField>
        <TextField as={Fragment} id="nickname">
          <Input />
        </TextField>
        <SearchField defaultValue="docs" onSubmit={submitted} onClear={cleared}>
          <SearchFieldInput aria-label="Search docs" />
          <SearchFieldClear aria-label="Clear search" />
        </SearchField>
      </>,
    );
    const inputs = container.querySelectorAll("input");
    const search = inputs[2]!;

    expect(container.querySelectorAll("div")).toHaveLength(0);
    expect(inputs[0]?.id).toBe("name");
    expect(inputs[1]?.id).toBe("nickname");
    expect(search.type).toBe("search");
    expect(search.value).toBe("docs");

    search.focus();
    await user.keyboard("{Enter}");
    expect(submitted).toHaveBeenLastCalledWith("docs");
    await user.click(container.querySelector("button")!);
    expect(search.value).toBe("");
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it("renders an opt-in root wrapper and keeps accordion and tabs interactions intact", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <>
        <TextField as="section" data-testid="field">
          <Input />
        </TextField>
        <Accordion defaultValue="first">
          <AccordionItem id="shipping" value="first">
            <AccordionHeader>
              <AccordionTrigger>First</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>First panel</AccordionPanel>
          </AccordionItem>
          <AccordionItem value="second">
            <AccordionHeader>
              <AccordionTrigger>Second</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>Second panel</AccordionPanel>
          </AccordionItem>
        </Accordion>
        <Tabs value="one" onChange={changed}>
          <TabList>
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
          <TabPanel value="one">One panel</TabPanel>
          <TabPanel value="two">Two panel</TabPanel>
        </Tabs>
      </>,
    );
    const accordionTriggers = container.querySelectorAll<HTMLButtonElement>("button");
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");

    expect(container.querySelector("section")?.dataset.testid).toBe("field");
    expect(container.querySelectorAll("[data-slot='accordion']")).toHaveLength(0);
    const firstPanel = container.querySelector<HTMLElement>("#shipping-panel")!;
    expect(accordionTriggers[0]!.id).toBe("shipping-trigger");
    expect(accordionTriggers[0]!.getAttribute("aria-controls")).toBe(firstPanel.id);
    expect(firstPanel.getAttribute("aria-labelledby")).toBe(accordionTriggers[0]!.id);
    accordionTriggers[0]!.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(accordionTriggers[1]);
    await user.click(accordionTriggers[1]!);
    expect(container.querySelectorAll("[role='region']")[1]?.hasAttribute("hidden")).toBe(false);

    tabs[0]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(changed).toHaveBeenLastCalledWith("two");
  });
});
