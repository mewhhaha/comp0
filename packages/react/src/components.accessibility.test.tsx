import { act, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Autocomplete,
  AlertDialog,
  BreadcrumbLink,
  Button,
  CalendarCell,
  Calendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Cell,
  Checkbox,
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorWheel,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  Carousel,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
  CarouselViewport,
  Column,
  ColumnResizer,
  Combobox,
  DateField,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateSegment,
  Dialog,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  DropZone,
  FieldError,
  Fieldset,
  Feed,
  FeedArticle,
  FileTrigger,
  GridList,
  GridListHeader,
  GridListItem,
  GridListLoadMoreItem,
  GridListSection,
  Group,
  Header,
  Input,
  Keyboard,
  Label,
  Legend,
  Link,
  ListBox,
  ListBoxItem,
  ListBoxLoadMoreItem,
  Menu,
  MenuItem,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  Modal,
  NumberField,
  Popover,
  ProgressBar,
  Radio,
  RadioGroup,
  RangeCalendar,
  Row,
  Select,
  SelectValue,
  SliderOutput,
  SliderThumb,
  Tab,
  Table,
  TableBody,
  TableHeader,
  TableLoadMoreItem,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TagList,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Tree,
  TreeItem,
  TreeLoadMoreItem,
  TreeSection,
  UNSTABLE_Toast,
  UNSTABLE_ToastList,
  UNSTABLE_ToastRegion,
  VisuallyHidden,
  WindowSplitter,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

function fireInput(element: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, value);
    element.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
  });
}

function fireModifiedKeyDown(element: Element, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
    );
  });
}

function fireFileDragEvent(element: Element, type: string, files: File[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    dataTransfer: Pick<DataTransfer, "dropEffect" | "files" | "types">;
  };
  event.dataTransfer = {
    dropEffect: "none",
    files: files as unknown as FileList,
    types: ["Files"],
  };

  act(() => {
    element.dispatchEvent(event);
  });

  return event;
}

describe("button, link, and grouped fields accessibility", () => {
  it("exposes pending and asChild disabled state without native disabled on slotted elements", () => {
    const { container } = render(
      <>
        <Button pending>Save</Button>
        <Button asChild disabled>
          <a href="/docs">Docs</a>
        </Button>
      </>,
    );
    const pending = container.querySelector<HTMLButtonElement>("button")!;
    const slotted = container.querySelector<HTMLAnchorElement>("a")!;

    expect(pending.disabled).toBe(true);
    expect(pending.getAttribute("aria-busy")).toBe("true");
    expect(slotted.getAttribute("aria-disabled")).toBe("true");
    expect(slotted.hasAttribute("disabled")).toBe(false);
  });

  it("removes disabled links from navigation and prevents activation", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Link href="/settings" disabled onClick={clicked}>
        Settings
      </Link>,
    );
    const link = container.querySelector<HTMLAnchorElement>("a")!;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });

    expect(link.hasAttribute("href")).toBe(false);
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.tabIndex).toBe(-1);

    act(() => {
      link.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(clicked).not.toHaveBeenCalled();
  });

  it("uses group defaults and wires fieldset state to legend, descriptions, and controls", () => {
    const { container } = render(
      <>
        <Group id="default-group" />
        <Group id="override-group" role="region" />
        <Fieldset id="shipping" disabled invalid required>
          <Legend>Shipping</Legend>
          <Label>Postal code</Label>
          <Input name="postal" />
          <FieldError>Required</FieldError>
        </Fieldset>
      </>,
    );
    const fieldset = container.querySelector<HTMLFieldSetElement>("fieldset")!;
    const legend = container.querySelector("legend")!;
    const input = container.querySelector<HTMLInputElement>("input[name='postal']")!;

    expect(container.querySelector("#default-group")?.getAttribute("role")).toBe("group");
    expect(container.querySelector("#override-group")?.getAttribute("role")).toBe("region");
    expect(fieldset.disabled).toBe(true);
    expect(fieldset.getAttribute("aria-invalid")).toBe("true");
    expect(fieldset.hasAttribute("data-required")).toBe(true);
    expect(legend.id).toBe("shipping-label");
    expect(input.id).toBe("shipping");
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});

describe("choice and range component accessibility", () => {
  it("exposes mixed checkbox state through ARIA and the native input", () => {
    const { container } = render(<Checkbox indeterminate>Accept terms</Checkbox>);
    const input = container.querySelector<HTMLInputElement>("input[type='checkbox']")!;

    expect(input.getAttribute("aria-checked")).toBe("mixed");
    expect(input.indeterminate).toBe(true);
    expect(input.closest("label")?.hasAttribute("data-indeterminate")).toBe(true);
  });

  it("generates radio names and propagates group state", () => {
    const { container } = render(
      <RadioGroup id="contact" disabled invalid required>
        <Legend>Contact method</Legend>
        <Radio value="email">Email</Radio>
        <Radio value="phone">Phone</Radio>
      </RadioGroup>,
    );
    const fieldset = container.querySelector("fieldset")!;
    const legend = container.querySelector("legend")!;
    const radios = container.querySelectorAll<HTMLInputElement>("input[type='radio']");

    expect(legend.id).toBe("contact-label");
    expect(fieldset.getAttribute("aria-invalid")).toBe("true");
    expect(fieldset.hasAttribute("data-required")).toBe(true);
    expect(radios[0]?.name).toBeTruthy();
    expect(radios[0]?.name).toBe(radios[1]?.name);
    expect(radios[0]?.disabled).toBe(true);
  });

  it("renders number inputs and progressbar ARIA with determinate and indeterminate states", () => {
    const { container } = render(
      <>
        <NumberField
          name="quantity"
          defaultValue={3}
          min={1}
          max={10}
          step={2}
          disabled
          required
          invalid
        />
        <ProgressBar value={25} minValue={0} maxValue={50} />
        <ProgressBar aria-label="Loading" />
      </>,
    );
    const input = container.querySelector<HTMLInputElement>("input[type='number']")!;
    const bars = container.querySelectorAll<HTMLElement>("[role='progressbar']");

    expect(input.value).toBe("3");
    expect(input.min).toBe("1");
    expect(input.max).toBe("10");
    expect(input.step).toBe("2");
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(bars[0]?.getAttribute("aria-valuenow")).toBe("25");
    expect(bars[0]?.getAttribute("aria-valuemax")).toBe("50");
    expect(bars[1]?.hasAttribute("aria-valuenow")).toBe(false);
    expect(bars[1]?.hasAttribute("data-indeterminate")).toBe(true);
  });
});

describe("disclosure, tabs, and picker trigger accessibility", () => {
  it("wires disclosure trigger and panel ids", () => {
    const { container } = render(
      <Disclosure id="faq" defaultOpen>
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Details</DisclosurePanel>
      </Disclosure>,
    );
    const trigger = container.querySelector("summary")!;
    const panel = container.querySelector("div")!;

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe("faq-panel");
    expect(panel.id).toBe("faq-panel");
  });

  it("skips disabled tabs during vertical keyboard navigation and hides inactive panels", () => {
    const { container } = render(
      <Tabs defaultValue="one">
        <TabList orientation="vertical">
          <Tab tabKey="one">One</Tab>
          <Tab tabKey="two" disabled>
            Two
          </Tab>
          <Tab tabKey="three">Three</Tab>
        </TabList>
        <TabPanel tabKey="one">First</TabPanel>
        <TabPanel tabKey="two">Second</TabPanel>
        <TabPanel tabKey="three">Third</TabPanel>
      </Tabs>,
    );
    const tabList = container.querySelector<HTMLElement>("[role='tablist']")!;
    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    const panels = container.querySelectorAll<HTMLElement>("[role='tabpanel']");

    expect(tabList.getAttribute("aria-orientation")).toBe("vertical");
    expect(tabs[1]?.disabled).toBe(true);
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[2]?.hidden).toBe(true);

    tabs[0]?.focus();
    fireKeyDown(tabList, "ArrowDown");

    expect(document.activeElement).toBe(tabs[2]);
    expect(tabs[2]?.getAttribute("aria-selected")).toBe("true");
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[2]?.hidden).toBe(false);
  });

  it("maps breadcrumb current and select trigger relationships", () => {
    const { container } = render(
      <>
        <BreadcrumbLink href="/docs" current>
          Docs
        </BreadcrumbLink>
        <Select id="plan">
          <Label>Plan</Label>
          <Button>
            <SelectValue placeholder="Choose plan" />
          </Button>
          <Popover>
            <ListBox>
              <ListBoxItem id="pro">Pro</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
      </>,
    );
    const current = container.querySelector("a")!;
    const trigger = container.querySelector("button")!;
    const value = container.querySelector("span")!;
    const listbox = container.querySelector("[role='listbox']")!;

    expect(current.getAttribute("aria-current")).toBe("page");
    expect(trigger.id).toBe("plan");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(trigger.getAttribute("aria-labelledby")).toBe("plan-label plan");
    expect(value.hasAttribute("data-placeholder")).toBe(true);
  });
});

describe("APG core composite accessibility", () => {
  it("wires accordion trigger and panel relationships with keyboard trigger navigation", () => {
    const { container } = render(
      <Accordion defaultValue="install">
        <AccordionItem value="install">
          <AccordionHeader>
            <AccordionTrigger>Install</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>Install with pnpm.</AccordionPanel>
        </AccordionItem>
        <AccordionItem value="style">
          <AccordionHeader>
            <AccordionTrigger>Style</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>Style with data attributes.</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );
    const triggers = container.querySelectorAll<HTMLButtonElement>(
      "[data-slot='accordion-trigger']",
    );
    const panels = container.querySelectorAll<HTMLElement>("[data-slot='accordion-panel']");

    expect(triggers[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(triggers[0]?.getAttribute("aria-controls")).toBe(panels[0]?.id);
    expect(panels[0]?.getAttribute("aria-labelledby")).toBe(triggers[0]?.id);
    expect(panels[0]?.hidden).toBe(false);
    expect(panels[1]?.hidden).toBe(true);

    triggers[0]?.focus();
    fireKeyDown(triggers[0]!, "ArrowDown");

    expect(document.activeElement).toBe(triggers[1]);

    fireClick(triggers[1]!);

    expect(triggers[1]?.getAttribute("aria-expanded")).toBe("true");
    expect(panels[0]?.hidden).toBe(true);
    expect(panels[1]?.hidden).toBe(false);
  });

  it("renders alert dialog semantics through the modal primitive", () => {
    render(
      <AlertDialog defaultOpen aria-labelledby="confirm-title" aria-describedby="confirm-body">
        <h2 id="confirm-title">Delete project?</h2>
        <p id="confirm-body">This action cannot be undone.</p>
        <Button>Cancel</Button>
      </AlertDialog>,
    );
    const dialog = document.body.querySelector<HTMLDialogElement>("dialog")!;

    expect(dialog.getAttribute("role")).toBe("alertdialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("confirm-title");
    expect(dialog.getAttribute("aria-describedby")).toBe("confirm-body");
  });

  it("opens menubar menu content from a trigger and closes it after item activation", () => {
    const activated = vi.fn();
    const { container } = render(
      <Menubar aria-label="Application">
        <MenubarMenu id="file">
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenuItem id="new" onClick={activated}>
              New
            </MenuItem>
            <MenuItem id="open">Open</MenuItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarItem id="help">Help</MenubarItem>
      </Menubar>,
    );
    const menubar = container.querySelector<HTMLElement>("[role='menubar']")!;
    const trigger = container.querySelector<HTMLButtonElement>("[data-slot='menubar-trigger']")!;
    const content = document.body.querySelector<HTMLElement>("[data-slot='menubar-content']")!;
    const items = content.querySelectorAll<HTMLElement>("[role='menuitem']");

    expect(menubar.getAttribute("aria-orientation")).toBe("horizontal");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.hidden).toBe(true);

    trigger.focus();
    fireKeyDown(trigger, "ArrowDown");

    expect(content.hidden).toBe(false);
    expect(document.activeElement).toBe(items[0]);

    fireClick(items[0]!);

    expect(activated).toHaveBeenCalled();
    expect(content.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("opens context menus from keyboard invocation and restores focus on Escape", () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger>Repository row</ContextMenuTrigger>
        <ContextMenuContent>
          <MenuItem id="rename">Rename</MenuItem>
          <MenuItem id="delete">Delete</MenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    const trigger = container.querySelector<HTMLElement>("[data-slot='context-menu-trigger']")!;
    const content = container.querySelector<HTMLElement>("[data-slot='context-menu-content']")!;

    trigger.focus();
    fireModifiedKeyDown(trigger, "F10", { shiftKey: true });

    const item = content.querySelector<HTMLElement>("[role='menuitem']")!;

    expect(content.hidden).toBe(false);
    expect(document.activeElement).toBe(item);

    fireKeyDown(item, "Escape");

    expect(content.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("moves carousel selection with controls and roving indicators", () => {
    const { container } = render(
      <Carousel aria-label="Featured releases" defaultValue="one">
        <CarouselViewport>
          <CarouselSlide id="one">One</CarouselSlide>
          <CarouselSlide id="two">Two</CarouselSlide>
        </CarouselViewport>
        <CarouselPrevious>Previous</CarouselPrevious>
        <CarouselNext>Next</CarouselNext>
        <CarouselIndicatorGroup aria-label="Slides">
          <CarouselIndicator id="one">1</CarouselIndicator>
          <CarouselIndicator id="two">2</CarouselIndicator>
        </CarouselIndicatorGroup>
      </Carousel>,
    );
    const slides = container.querySelectorAll<HTMLElement>("[data-slot='carousel-slide']");
    const next = container.querySelector<HTMLButtonElement>("[data-slot='carousel-next']")!;
    const indicators = container.querySelectorAll<HTMLButtonElement>("[role='tab']");

    expect(container.querySelector("[aria-roledescription='carousel']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='carousel-viewport']")?.getAttribute("aria-live"),
    ).toBe("polite");
    expect(slides[0]?.hidden).toBe(false);
    expect(slides[1]?.hidden).toBe(true);

    fireClick(next);

    expect(slides[0]?.hidden).toBe(true);
    expect(slides[1]?.hidden).toBe(false);
    expect(indicators[1]?.getAttribute("aria-selected")).toBe("true");

    fireKeyDown(indicators[1]!, "ArrowLeft");

    expect(document.activeElement).toBe(indicators[0]);
    expect(slides[0]?.hidden).toBe(false);
  });

  it("updates window splitter values from keyboard input", () => {
    const changed = vi.fn();
    const { container } = render(
      <WindowSplitter
        aria-label="Resize preview"
        controls="preview"
        defaultValue={40}
        minValue={20}
        maxValue={80}
        step={10}
        onChange={changed}
      />,
    );
    const splitter = container.querySelector<HTMLElement>("[role='separator']")!;

    expect(splitter.getAttribute("aria-controls")).toBe("preview");
    expect(splitter.getAttribute("aria-valuenow")).toBe("40");

    fireKeyDown(splitter, "ArrowRight");

    expect(splitter.getAttribute("aria-valuenow")).toBe("50");
    expect(changed).toHaveBeenLastCalledWith(50);

    fireKeyDown(splitter, "Home");

    expect(splitter.getAttribute("aria-valuenow")).toBe("20");
  });

  it("moves feed focus between articles with page navigation keys", () => {
    const { container } = render(
      <Feed aria-label="Activity">
        <FeedArticle id="build">Build passed</FeedArticle>
        <FeedArticle id="deploy">Deploy started</FeedArticle>
      </Feed>,
    );
    const feed = container.querySelector<HTMLElement>("[role='feed']")!;
    const articles = container.querySelectorAll<HTMLElement>("[role='article']");

    expect(feed.hasAttribute("aria-busy")).toBe(false);
    expect(articles[0]?.getAttribute("aria-posinset")).toBe("1");
    expect(articles[1]?.getAttribute("aria-setsize")).toBe("2");

    articles[0]?.focus();
    fireKeyDown(articles[0]!, "PageDown");

    expect(document.activeElement).toBe(articles[1]);

    fireModifiedKeyDown(articles[1]!, "Home", { ctrlKey: true });

    expect(document.activeElement).toBe(articles[0]);
  });
});

describe("combobox, listbox, menu, and autocomplete accessibility", () => {
  it("labels comboboxes, skips disabled options, and keeps active descendant on the input", () => {
    const { container } = render(
      <Combobox id="city" defaultValue="">
        <Label>City</Label>
        <Group>
          <Input />
          <Button>Open</Button>
        </Group>
        <Popover>
          <ListBox>
            <ListBoxItem id="paris">Paris</ListBoxItem>
            <ListBoxItem id="oslo" disabled>
              Oslo
            </ListBoxItem>
            <ListBoxItem id="rome">Rome</ListBoxItem>
          </ListBox>
        </Popover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const label = container.querySelector("label")!;

    expect(label.htmlFor).toBe("city");
    expect(input.getAttribute("aria-controls")).toBe("city-listbox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("paris");
    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("rome");
  });

  it("blocks disabled listbox and menu items from click or keyboard activation", () => {
    const listChanged = vi.fn();
    const listClicked = vi.fn();
    const menuClicked = vi.fn();
    const { container } = render(
      <>
        <ListBox defaultValue="one" onChange={listChanged}>
          <ListBoxItem id="one">One</ListBoxItem>
          <ListBoxItem id="two" disabled onClick={listClicked}>
            Two
          </ListBoxItem>
        </ListBox>
        <Menu role="toolbar">
          <MenuItem id="copy" role="note">
            Copy
          </MenuItem>
          <MenuItem id="paste" disabled onClick={menuClicked}>
            Paste
          </MenuItem>
        </Menu>
      </>,
    );
    const disabledOption = container.querySelector<HTMLElement>("#two")!;
    const disabledMenuItem = container.querySelector<HTMLElement>("#paste")!;

    expect(disabledOption.getAttribute("aria-disabled")).toBe("true");
    expect(disabledOption.hasAttribute("tabindex")).toBe(false);
    fireClick(disabledOption);
    expect(listChanged).not.toHaveBeenCalledWith("two");
    expect(listClicked).not.toHaveBeenCalled();
    expect(container.querySelector("#one")?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector("[role='toolbar']")).toBeTruthy();
    expect(container.querySelector("#copy")?.getAttribute("role")).toBe("note");

    fireClick(disabledMenuItem);
    fireKeyDown(disabledMenuItem, "Enter");
    expect(menuClicked).not.toHaveBeenCalled();
    expect(disabledMenuItem.getAttribute("aria-disabled")).toBe("true");
  });

  it("filters autocomplete items while focus remains on the combobox", () => {
    const { container } = render(
      <Autocomplete id="framework" defaultValue="">
        <Label>Framework</Label>
        <Input />
        <ListBox>
          <ListBoxItem id="react">React</ListBoxItem>
          <ListBoxItem id="solid" disabled>
            Solid
          </ListBoxItem>
          <ListBoxItem id="svelte">Svelte</ListBoxItem>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    input.focus();
    fireInput(input, "s");
    expect(container.querySelector("#react")).toBeNull();
    expect(container.querySelector("#solid")).toBeTruthy();
    expect(container.querySelector("#svelte")).toBeTruthy();

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("svelte");
    fireKeyDown(input, "Enter");
    expect(input.value).toBe("Svelte");
    expect(document.activeElement).toBe(input);
  });
});

describe("date and color accessibility", () => {
  it("keeps date input groups and segment spinbuttons accessible", () => {
    const { container } = render(
      <DateField defaultValue="2026-04-30" name="release">
        <DateInput>
          <DateSegment part="month" />
          <DateSegment part="literal">/</DateSegment>
          <DateSegment part="day" />
          <DateSegment part="literal">/</DateSegment>
          <DateSegment part="year" />
        </DateInput>
      </DateField>,
    );
    const input = container.querySelector("[data-slot='date-input']")!;
    const month = container.querySelector<HTMLElement>("[data-type='month']")!;
    const literal = container.querySelector<HTMLElement>("[data-type='literal']")!;

    expect(input.getAttribute("role")).toBe("group");
    expect(month.getAttribute("role")).toBe("spinbutton");
    expect(month.getAttribute("aria-valuemin")).toBe("1");
    expect(month.getAttribute("aria-valuemax")).toBe("12");
    expect(month.getAttribute("aria-valuenow")).toBe("4");
    expect(literal.hasAttribute("role")).toBe(false);
    expect(literal.hasAttribute("tabindex")).toBe(false);
  });

  it("exposes standalone calendar table semantics", () => {
    const { container } = render(
      <CalendarGrid>
        <CalendarGridHeader>
          <tr>
            <CalendarHeaderCell>Thu</CalendarHeaderCell>
          </tr>
        </CalendarGridHeader>
        <CalendarGridBody>
          <tr>
            <CalendarCell date="2026-04-30" selected disabled>
              30
            </CalendarCell>
          </tr>
        </CalendarGridBody>
      </CalendarGrid>,
    );
    const grid = container.querySelector("table")!;
    const header = container.querySelector("th")!;
    const cell = container.querySelector("td")!;

    expect(grid.getAttribute("role")).toBe("grid");
    expect(header.scope).toBe("col");
    expect(cell.getAttribute("role")).toBe("gridcell");
    expect(cell.getAttribute("aria-selected")).toBe("true");
    expect(cell.getAttribute("aria-disabled")).toBe("true");
  });

  it("opens picker dialogs from triggers and closes after selecting complete values", () => {
    const { container } = render(
      <>
        <DatePicker id="release" defaultValue="2026-04-29" name="release">
          <Button>Open date</Button>
          <Popover>
            <Calendar focusedValue="2026-04-29" />
          </Popover>
        </DatePicker>
        <DateRangePicker id="sprint" name="sprint">
          <Button>Open range</Button>
          <Popover>
            <RangeCalendar focusedValue="2026-04-29" />
          </Popover>
        </DateRangePicker>
      </>,
    );
    const buttons = container.querySelectorAll<HTMLButtonElement>("button[aria-haspopup='dialog']");
    const popovers = container.querySelectorAll<HTMLElement>("[role='dialog']");

    expect(buttons[0]?.getAttribute("aria-controls")).toBe("release-popover");
    expect(popovers[0]?.hidden).toBe(true);
    fireClick(buttons[0]!);
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");

    fireClick(container.querySelector("[data-date='2026-04-30']")!);
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector<HTMLInputElement>("input[name='release']")?.value).toBe(
      "2026-04-30",
    );

    fireClick(buttons[1]!);
    fireClick(container.querySelectorAll("[data-date='2026-04-30']")[1]!);
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    fireClick(container.querySelectorAll("[data-date='2026-05-01']")[1]!);
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports color slider bounds, keyboard increments, and swatch picker focus", () => {
    const disabledClicked = vi.fn();
    const { container } = render(
      <ColorField defaultValue="#ff0000" name="accent">
        <ColorSlider channel="hue" aria-label="Hue" />
        <ColorArea aria-label="Saturation" />
        <ColorWheel aria-label="Wheel" />
        <ColorSwatchPicker aria-label="Accent">
          <ColorSwatchPickerItem color="#ff0000" />
          <ColorSwatchPickerItem color="#00ff00" />
          <ColorSwatchPickerItem color="#0000ff" disabled onClick={disabledClicked} />
        </ColorSwatchPicker>
      </ColorField>,
    );
    const swatchPicker = container.querySelector<HTMLElement>("[role='listbox']")!;
    const sliders = container.querySelectorAll<HTMLElement>("[role='slider']");
    const swatches = container.querySelectorAll<HTMLElement>("[role='option']");

    expect(sliders[0]?.getAttribute("aria-valuemin")).toBe("0");
    expect(sliders[0]?.getAttribute("aria-valuemax")).toBe("360");
    expect(sliders[1]?.getAttribute("aria-valuemax")).toBe("100");
    expect(sliders[2]?.getAttribute("aria-valuemax")).toBe("360");
    expect(container.querySelector("[role='listbox']")?.getAttribute("aria-label")).toBe("Accent");
    expect(swatches[0]?.getAttribute("aria-selected")).toBe("true");
    expect(swatches[0]?.tabIndex).toBe(0);
    expect(swatches[1]?.tabIndex).toBe(-1);
    expect(swatches[2]?.getAttribute("aria-disabled")).toBe("true");
    expect(swatches[2]?.hasAttribute("tabindex")).toBe(false);

    fireKeyDown(sliders[0]!, "ArrowRight");
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("1");
    fireModifiedKeyDown(sliders[0]!, "ArrowRight", { shiftKey: true });
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("11");

    fireClick(swatches[2]!);
    expect(disabledClicked).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLInputElement>("input[name='accent']")?.value).not.toBe(
      "#0000ff",
    );

    swatches[0]?.focus();
    fireKeyDown(swatchPicker, "ArrowRight");
    expect(document.activeElement).toBe(swatches[1]);
    expect(swatches[0]?.tabIndex).toBe(-1);
    expect(swatches[1]?.tabIndex).toBe(0);

    fireKeyDown(swatches[1]!, " ");
    expect(swatches[1]?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector<HTMLInputElement>("input[name='accent']")?.value).toBe(
      "#00ff00",
    );
  });
});

describe("overlay, table, file, toolbar, and parity accessibility", () => {
  it("exposes dialog, modal, popover, and tooltip semantics", () => {
    const { container } = render(
      <>
        <Dialog aria-label="Settings">Settings</Dialog>
        <Modal defaultOpen>Modal</Modal>
        <Popover>Body</Popover>
        <Popover defaultOpen>Open body</Popover>
        <Tooltip>Hint</Tooltip>
      </>,
    );
    const popovers = container.querySelectorAll<HTMLElement>("[role='dialog']");
    const modal = document.body.querySelector("dialog")!;
    const tooltip = container.querySelector<HTMLElement>("[role='tooltip']")!;

    expect(container.querySelector("[aria-label='Settings']")?.getAttribute("tabindex")).toBe("-1");
    expect(modal.getAttribute("aria-modal")).toBe("true");
    expect(modal.hasAttribute("data-open")).toBe(true);
    expect(popovers[1]?.hidden).toBe(true);
    expect(popovers[2]?.hidden).toBe(false);
    expect(tooltip.id).toBeTruthy();
    expect(tooltip.hidden).toBe(false);
  });

  it("uses native modal dialog semantics and restores focus when the modal closes", () => {
    const originalClose = HTMLDialogElement.prototype.close;
    HTMLDialogElement.prototype.close = function closeDialog() {
      this.removeAttribute("open");
    };

    function ModalFocusHarness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button onClick={() => setOpen(true)}>Open settings</Button>
          <Modal open={open} onChange={setOpen} aria-label="Settings">
            <Button onClick={() => setOpen(false)}>Close settings</Button>
          </Modal>
          <Button>After modal</Button>
        </>
      );
    }

    try {
      const { container } = render(<ModalFocusHarness />);
      const trigger = container.querySelector<HTMLButtonElement>("button")!;

      trigger.focus();
      fireClick(trigger);

      const modal = document.body.querySelector("dialog")!;

      expect(modal.getAttribute("aria-modal")).toBe("true");
      expect(modal.hasAttribute("open")).toBe(true);

      fireClick(modal.querySelector("button")!);

      expect(modal.hasAttribute("open")).toBe(false);
      expect(document.activeElement).toBe(trigger);
    } finally {
      HTMLDialogElement.prototype.close = originalClose;
    }
  });

  it("keeps native table semantics and row ARIA state", () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <Row>
            <Column>Name</Column>
            <Column isRowHeader>Person</Column>
          </Row>
        </TableHeader>
        <TableBody>
          <Row selected disabled>
            <Cell>Ada</Cell>
          </Row>
          <TableLoadMoreItem>
            <Cell>More</Cell>
          </TableLoadMoreItem>
        </TableBody>
      </Table>,
    );
    const columns = container.querySelectorAll("th");
    const selectedRow = container.querySelector("tbody tr")!;

    expect(container.querySelector("table")).toBeTruthy();
    expect(columns[0]?.scope).toBe("col");
    expect(columns[1]?.scope).toBe("row");
    expect(selectedRow.getAttribute("aria-selected")).toBe("true");
    expect(selectedRow.getAttribute("aria-disabled")).toBe("true");
    expect(container.querySelector("[data-slot='table-load-more-item']")).toBeTruthy();
  });

  it("exposes drop zone and file trigger state through native elements", () => {
    const dropped = vi.fn();
    const { container } = render(
      <>
        <DropZone disabled>Drop</DropZone>
        <DropZone onDrop={(event) => dropped(Array.from(event.dataTransfer.files))}>Drop</DropZone>
        <FileTrigger inputProps={{ name: "attachment", multiple: true }}>Upload</FileTrigger>
      </>,
    );
    const zones = container.querySelectorAll<HTMLElement>("[data-slot='drop-zone']");
    const input = container.querySelector<HTMLInputElement>("input[type='file']")!;
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    expect(zones[0]?.getAttribute("role")).toBe("group");
    expect(zones[0]?.getAttribute("aria-disabled")).toBe("true");
    expect(input.hidden).toBe(true);
    expect(input.name).toBe("attachment");
    expect(input.multiple).toBe(true);

    const drag = fireFileDragEvent(zones[1]!, "dragenter", [file]);
    expect(drag.defaultPrevented).toBe(true);
    expect(zones[1]?.hasAttribute("data-drop-target")).toBe(true);
    fireFileDragEvent(zones[1]!, "drop", [file]);
    expect(dropped).toHaveBeenCalledWith([file]);
    expect(zones[1]?.hasAttribute("data-drop-target")).toBe(false);
  });

  it("excludes disabled, hidden, and aria-hidden controls from toolbar roving focus", () => {
    const { container } = render(
      <Toolbar aria-label="Formatting">
        <Button>Bold</Button>
        <Button disabled>Italic</Button>
        <Button hidden>Hidden</Button>
        <Button aria-hidden="true">Ignored</Button>
        <Button>Code</Button>
      </Toolbar>,
    );
    const toolbar = container.querySelector<HTMLElement>("[role='toolbar']")!;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");

    expect(buttons[0]?.tabIndex).toBe(0);
    expect(buttons[4]?.tabIndex).toBe(-1);

    buttons[0]?.focus();
    fireKeyDown(toolbar, "ArrowRight");

    expect(document.activeElement).toBe(buttons[4]);
    expect(buttons[4]?.tabIndex).toBe(0);
  });

  it("moves tag focus with arrow keys and skips disabled tags", () => {
    const { container } = render(
      <TagGroup aria-label="Selected filters">
        <TagList>
          <Tag id="accessible">Accessible</Tag>
          <Tag id="disabled" disabled>
            Disabled
          </Tag>
          <Tag id="headless">Headless</Tag>
          <Tag id="react">React</Tag>
        </TagList>
      </TagGroup>,
    );
    let tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(tags[0]?.tabIndex).toBe(0);
    expect(tags[1]?.tabIndex).toBe(-1);

    tags[0]?.focus();
    fireKeyDown(tags[0]!, "ArrowRight");
    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(document.activeElement).toBe(tags[2]);
    expect(tags[0]?.tabIndex).toBe(-1);
    expect(tags[1]?.hasAttribute("tabindex")).toBe(false);
    expect(tags[2]?.tabIndex).toBe(0);

    fireKeyDown(tags[2]!, "ArrowLeft");
    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(document.activeElement).toBe(tags[0]);
    expect(tags[0]?.tabIndex).toBe(0);
    expect(tags[2]?.tabIndex).toBe(-1);

    fireKeyDown(tags[0]!, "End");
    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(document.activeElement).toBe(tags[3]);
    expect(tags[3]?.tabIndex).toBe(0);

    fireKeyDown(tags[3]!, "Home");
    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(document.activeElement).toBe(tags[0]);
  });

  it("keeps tag focus on the next enabled tag after keyboard removal", () => {
    const removed: string[] = [];

    function RemovableTags() {
      const [tags, setTags] = useState([
        { id: "accessible", label: "Accessible" },
        { id: "headless", label: "Headless" },
        { id: "react", label: "React" },
      ]);

      return (
        <TagGroup aria-label="Selected filters">
          <TagList
            onRemove={(id) => {
              removed.push(id);
              setTags((current) => current.filter((tag) => tag.id !== id));
            }}
          >
            {tags.map((tag) => (
              <Tag id={tag.id} key={tag.id}>
                {tag.label}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      );
    }

    const { container } = render(<RemovableTags />);
    let tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    tags[0]?.focus();
    fireKeyDown(tags[0]!, "ArrowRight");
    fireKeyDown(tags[1]!, "Backspace");

    expect(removed).toEqual(["headless"]);

    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect([...tags].map((tag) => tag.id)).toEqual(["accessible", "react"]);
    expect(document.activeElement).toBe(tags[1]);
    expect(tags[0]?.tabIndex).toBe(-1);
    expect(tags[1]?.tabIndex).toBe(0);

    fireKeyDown(tags[1]!, "Backspace");

    tags = container.querySelectorAll<HTMLElement>("[data-slot='tag']");

    expect(removed).toEqual(["headless", "react"]);
    expect([...tags].map((tag) => tag.id)).toEqual(["accessible"]);
    expect(document.activeElement).toBe(tags[0]);
    expect(tags[0]?.tabIndex).toBe(0);
  });

  it("keeps visually hidden content in the DOM with clipping styles", () => {
    const { container } = render(<VisuallyHidden>Screen reader copy</VisuallyHidden>);
    const hidden = container.querySelector<HTMLElement>("[data-slot='visually-hidden']")!;

    expect(hidden.textContent).toBe("Screen reader copy");
    expect(hidden.style.position).toBe("absolute");
    expect(hidden.style.width).toBe("1px");
  });

  it("preserves role-bearing and native parity shim contracts", () => {
    const { container } = render(
      <>
        <GridList />
        <GridListItem />
        <GridListHeader />
        <GridListSection />
        <GridListLoadMoreItem />
        <ListBoxLoadMoreItem />
        <SliderThumb />
        <ColumnResizer />
        <TagGroup />
        <TagList />
        <Tag />
        <ToggleButtonGroup />
        <Tree />
        <TreeItem />
        <TreeSection />
        <TreeLoadMoreItem />
        <UNSTABLE_Toast />
        <UNSTABLE_ToastList />
        <UNSTABLE_ToastRegion />
        <Header />
        <Keyboard>Ctrl K</Keyboard>
        <SliderOutput htmlFor="volume">50</SliderOutput>
      </>,
    );

    expect(container.querySelector("[data-slot='grid-list']")?.getAttribute("role")).toBe("grid");
    expect(container.querySelector("[data-slot='grid-list-item']")?.getAttribute("role")).toBe(
      "row",
    );
    expect(container.querySelector("[data-slot='grid-list-header']")?.getAttribute("role")).toBe(
      "rowheader",
    );
    expect(container.querySelector("[data-slot='grid-list-section']")?.getAttribute("role")).toBe(
      "rowgroup",
    );
    expect(
      container.querySelector("[data-slot='grid-list-load-more-item']")?.getAttribute("role"),
    ).toBe("row");
    expect(
      container.querySelector("[data-slot='listbox-load-more-item']")?.getAttribute("role"),
    ).toBe("option");
    expect(container.querySelector("[data-slot='slider-thumb']")?.getAttribute("role")).toBe(
      "slider",
    );
    expect(container.querySelector("[data-slot='column-resizer']")?.getAttribute("role")).toBe(
      "separator",
    );
    expect(container.querySelector("[data-slot='tag-group']")?.getAttribute("role")).toBe("group");
    expect(container.querySelector("[data-slot='tag-list']")?.getAttribute("role")).toBe("list");
    expect(container.querySelector("[data-slot='tag']")?.getAttribute("role")).toBe("listitem");
    expect(container.querySelector("[data-slot='toggle-button-group']")?.getAttribute("role")).toBe(
      "group",
    );
    expect(container.querySelector("[data-slot='tree']")?.getAttribute("role")).toBe("tree");
    expect(container.querySelector("[data-slot='tree-item']")?.getAttribute("role")).toBe(
      "treeitem",
    );
    expect(container.querySelector("[data-slot='tree-section']")?.getAttribute("role")).toBe(
      "group",
    );
    expect(container.querySelector("[data-slot='tree-load-more-item']")?.getAttribute("role")).toBe(
      "treeitem",
    );
    expect(container.querySelector("[data-slot='toast']")?.getAttribute("role")).toBe("status");
    expect(container.querySelector("[data-slot='toast-list']")?.getAttribute("role")).toBe(
      "region",
    );
    expect(container.querySelector("[data-slot='toast-region']")?.getAttribute("role")).toBe(
      "region",
    );
    expect(container.querySelector("header[data-slot='header']")).toBeTruthy();
    expect(container.querySelector("kbd[data-slot='keyboard']")?.textContent).toBe("Ctrl K");
    expect(
      container.querySelector<HTMLOutputElement>("output[data-slot='slider-output']")?.htmlFor
        .value,
    ).toBe("volume");
  });
});
