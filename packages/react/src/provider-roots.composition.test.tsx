import { Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Accordion } from "./components/Accordion.js";
import { AccordionHeader } from "./components/AccordionHeader.js";
import { AccordionItem } from "./components/AccordionItem.js";
import { AccordionPanel } from "./components/AccordionPanel.js";
import { AccordionTrigger } from "./components/AccordionTrigger.js";
import { Input } from "./components/Input.js";
import { SearchField } from "./components/SearchField.js";
import { SearchFieldClear } from "./components/SearchFieldClear.js";
import { SearchFieldInput } from "./components/SearchFieldInput.js";
import { Tab } from "./components/Tab.js";
import { TabList } from "./components/TabList.js";
import { TabPanel } from "./components/TabPanel.js";
import { Tabs } from "./components/Tabs.js";
import { TextField } from "./components/TextField.js";

describe("provider roots", () => {
  it("keeps text and search field roots wrapper-free while their explicit parts own behavior", () => {
    const submitted = vi.fn();
    const cleared = vi.fn();
    const { container } = render(
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

    fireKeyDown(search, "Enter");
    expect(submitted).toHaveBeenLastCalledWith("docs");
    fireClick(container.querySelector("button")!);
    expect(search.value).toBe("");
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  it("renders an opt-in root wrapper and keeps accordion and tabs interactions intact", () => {
    const changed = vi.fn();
    const { container } = render(
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
    fireKeyDown(accordionTriggers[0]!, "ArrowDown");
    expect(document.activeElement).toBe(accordionTriggers[1]);
    fireClick(accordionTriggers[1]!);
    expect(container.querySelectorAll("[role='region']")[1]?.hasAttribute("hidden")).toBe(false);

    fireKeyDown(tabs[0]!, "ArrowRight");
    expect(changed).toHaveBeenLastCalledWith("two");
  });
});
