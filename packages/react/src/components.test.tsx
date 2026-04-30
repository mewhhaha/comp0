import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { act, createRef } from "react";
import * as ReactComponents from "./index.js";
import {
  Autocomplete,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Calendar,
  Cell,
  Checkbox,
  CheckboxGroup,
  ColorArea,
  Column,
  ColorField,
  ColorSlider,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorWheel,
  ComboboxOption,
  Combobox,
  DateField,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateSegment,
  Description,
  Dialog,
  FileTrigger,
  DropZone,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  FieldError,
  Group,
  Heading,
  Input,
  Label,
  Legend,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Meter,
  Menu as MenuPrimitive,
  MenuItem,
  MenuSection,
  Modal,
  Popover,
  ProgressBar,
  Radio,
  RadioGroup,
  RangeCalendar,
  Row,
  SearchField,
  Select,
  SelectOption,
  SelectValue,
  Separator,
  Slider,
  NumberField,
  Switch,
  Tab,
  Table,
  TableBody,
  TableHeader,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  Toolbar,
  Tooltip,
} from "./index.js";
import { fireClick, fireKeyDown, render } from "../test/render.js";

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

describe("primitives", () => {
  it("accepts React 19 ref props for native, structural, and asChild components", () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const tableRef = createRef<HTMLTableElement>();
    const childRef = createRef<HTMLAnchorElement>();
    const slottedRef = createRef<HTMLButtonElement>();

    render(
      <>
        <Button ref={buttonRef}>Save</Button>
        <Table ref={tableRef} />
        <Button asChild ref={slottedRef}>
          <a ref={childRef} href="/docs">
            Docs
          </a>
        </Button>
      </>,
    );

    expect(buttonRef.current?.tagName).toBe("BUTTON");
    expect(tableRef.current?.tagName).toBe("TABLE");
    expect(slottedRef.current?.tagName).toBe("A");
    expect(childRef.current).toBe(slottedRef.current as unknown as HTMLAnchorElement);
  });

  it("renders native button state and toggles aria-pressed", () => {
    const changed = vi.fn();
    const { container } = render(
      <ToggleButton defaultSelected onChange={changed}>
        {({ selected }: { selected: boolean }) => (selected ? "On" : "Off")}
      </ToggleButton>,
    );
    const button = container.querySelector("button");

    expect(button?.type).toBe("button");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.hasAttribute("data-selected")).toBe(true);

    fireClick(button!);

    expect(button?.textContent).toBe("Off");
    expect(changed).toHaveBeenCalledWith(false);
  });

  it("supports basic text, heading, separator, and disabled button semantics", () => {
    const { container } = render(
      <>
        <Button disabled>Save</Button>
        <Text as="span">Inline</Text>
        <Heading level={3}>Section</Heading>
        <Separator orientation="vertical" />
      </>,
    );

    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("h3")?.textContent).toBe("Section");
    expect(container.querySelector("hr")?.getAttribute("aria-orientation")).toBe("vertical");
  });

  it("uses roving tabindex for toolbar controls", () => {
    const { container } = render(
      <Toolbar aria-label="Formatting">
        <Button>Bold</Button>
        <Button>Italic</Button>
        <Button>Insert</Button>
      </Toolbar>,
    );
    const toolbar = container.querySelector<HTMLElement>("[role='toolbar']");
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");

    expect(toolbar?.getAttribute("data-orientation")).toBe("horizontal");
    expect(buttons[0]?.tabIndex).toBe(0);
    expect(buttons[1]?.tabIndex).toBe(-1);
    expect(buttons[2]?.tabIndex).toBe(-1);

    buttons[0]?.focus();
    fireKeyDown(toolbar!, "ArrowRight");

    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[0]?.tabIndex).toBe(-1);
    expect(buttons[1]?.tabIndex).toBe(0);

    fireKeyDown(toolbar!, "End");

    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons[2]?.tabIndex).toBe(0);
  });
});

describe("performance-sensitive paths", () => {
  function ManyOptions({ count = 24 }: { count?: number }) {
    return Array.from({ length: count }, (_, index) => (
      <ListBoxItem key={index} id={`item-${index}`}>
        {`Item ${index}`}
      </ListBoxItem>
    ));
  }

  it("does not re-render picker children for each mounted item registration", () => {
    let selectRenderCount = 0;
    let comboboxRenderCount = 0;
    let autocompleteRenderCount = 0;

    function SelectProbe() {
      selectRenderCount += 1;
      return null;
    }

    function ComboboxProbe() {
      comboboxRenderCount += 1;
      return null;
    }

    function AutocompleteProbe() {
      autocompleteRenderCount += 1;
      return null;
    }

    render(
      <>
        <Select>
          <SelectProbe />
          <ListBox>
            <ManyOptions />
          </ListBox>
        </Select>
        <Combobox>
          <ComboboxProbe />
          <ListBox>
            <ManyOptions />
          </ListBox>
        </Combobox>
        <Autocomplete>
          <AutocompleteProbe />
          <ListBox>
            <ManyOptions />
          </ListBox>
        </Autocomplete>
      </>,
    );

    expect(selectRenderCount).toBe(1);
    expect(comboboxRenderCount).toBe(1);
    expect(autocompleteRenderCount).toBe(1);
  });

  it("reuses cached listbox document order across repeated keyboard movement", () => {
    const compareDocumentPosition = HTMLElement.prototype.compareDocumentPosition;
    const compare = vi.fn(compareDocumentPosition);
    HTMLElement.prototype.compareDocumentPosition = compare;

    try {
      const { container } = render(
        <ListBox defaultValue="item-0">
          <ManyOptions count={8} />
        </ListBox>,
      );
      const listbox = container.querySelector<HTMLElement>("[role='listbox']")!;

      fireKeyDown(listbox, "ArrowDown");
      const firstSortComparisons = compare.mock.calls.length;
      fireKeyDown(listbox, "ArrowDown");
      fireKeyDown(listbox, "ArrowDown");

      expect(firstSortComparisons).toBeGreaterThan(0);
      expect(compare).toHaveBeenCalledTimes(firstSortComparisons);
    } finally {
      HTMLElement.prototype.compareDocumentPosition = compareDocumentPosition;
    }
  });

  it("keeps toolbar focus movement DOM-local", () => {
    let boldRenderCount = 0;

    function Bold() {
      boldRenderCount += 1;
      return <Button>Bold</Button>;
    }

    const { container } = render(
      <Toolbar aria-label="Formatting">
        <Bold />
        <Button>Italic</Button>
        <Button>Underline</Button>
      </Toolbar>,
    );
    const toolbar = container.querySelector<HTMLElement>("[role='toolbar']")!;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button");

    buttons[0]?.focus();
    fireKeyDown(toolbar, "ArrowRight");
    fireKeyDown(toolbar, "ArrowRight");
    fireKeyDown(toolbar, "ArrowLeft");

    expect(boldRenderCount).toBe(1);
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("keeps calendar navigation and selection behavior stable", () => {
    const changed = vi.fn();
    const { container } = render(
      <Calendar defaultValue="2026-04-30" focusedValue="2026-04-30" onChange={changed} />,
    );
    const grid = container.querySelector<HTMLElement>("[role='grid']")!;

    fireKeyDown(grid, "ArrowRight");
    fireKeyDown(grid, "Enter");

    expect(changed).toHaveBeenLastCalledWith("2026-05-01");
  });
});

describe("field anatomy and text inputs", () => {
  it("wires label, description, and error ids without DOM reads during render", () => {
    const { container } = render(
      <TextField id="email" invalid required>
        <Label>Email</Label>
        <Input name="email" />
        <TextArea name="notes" />
        <SearchField id="query">
          <Label>Search</Label>
          <Input name="query" type="search" />
        </SearchField>
        <FieldError>Required</FieldError>
      </TextField>,
    );

    const input = container.querySelector<HTMLInputElement>("input[name='email']");
    const area = container.querySelector<HTMLTextAreaElement>("textarea");

    expect(container.querySelector("label")?.getAttribute("for")).toBe("email");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.required).toBe(true);
    expect(area?.getAttribute("aria-invalid")).toBe("true");
    expect(container.querySelector("[role='alert']")?.id).toBe("email-error");
  });

  it("controls text and search field values and clears search with Escape or clear buttons", () => {
    const changed = vi.fn();
    const submitted = vi.fn();
    const cleared = vi.fn();
    const { container } = render(
      <>
        <TextField defaultValue="Ada" onChange={changed}>
          <Input name="name" />
        </TextField>
        <SearchField defaultValue="tickets" onSubmit={submitted} onClear={cleared}>
          <Input name="query" />
          <Button aria-label="Clear search">Clear</Button>
        </SearchField>
      </>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>("input");
    const textInput = inputs[0]!;
    const searchInput = inputs[1]!;

    expect(textInput.value).toBe("Ada");
    fireInput(textInput, "Grace");
    expect(changed).toHaveBeenCalledWith("Grace");
    expect(textInput.value).toBe("Grace");
    expect(searchInput.type).toBe("search");

    fireKeyDown(searchInput, "Enter");
    expect(submitted).toHaveBeenCalledWith("tickets");
    fireKeyDown(searchInput, "Escape");
    expect(searchInput.value).toBe("");
    expect(cleared).toHaveBeenCalled();

    fireInput(searchInput, "again");
    fireClick(container.querySelector("button")!);
    expect(searchInput.value).toBe("");
  });

  it("preserves search input semantics and clear/submit accessibility wiring", () => {
    const submitted = vi.fn();
    const cleared = vi.fn();
    const { container } = render(
      <>
        <SearchField onSubmit={submitted} onClear={cleared}>
          <Label>Docs</Label>
          <Input name="docs" />
          <Button aria-label="Clear docs" />
        </SearchField>
        <SearchField defaultValue="alpha" onClear={cleared}>
          <Input />
          <Button slot="clear">Slot clear</Button>
        </SearchField>
        <SearchField defaultValue="beta" onClear={cleared}>
          <Input />
          <Button data-slot="clear">Data clear</Button>
        </SearchField>
      </>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>("input");
    const clearButtons = container.querySelectorAll<HTMLButtonElement>("button");

    expect(inputs[0]?.type).toBe("search");
    expect(container.querySelector("label")?.htmlFor).toBe(inputs[0]?.id);

    fireInput(inputs[0]!, "release notes");
    fireKeyDown(inputs[0]!, "Enter");
    expect(submitted).toHaveBeenCalledWith("release notes");

    fireKeyDown(inputs[0]!, "Escape");
    expect(inputs[0]?.value).toBe("");
    expect(cleared).toHaveBeenCalledTimes(1);
    fireKeyDown(inputs[0]!, "Escape");
    expect(cleared).toHaveBeenCalledTimes(1);

    fireClick(clearButtons[1]!);
    fireClick(clearButtons[2]!);
    expect(cleared).toHaveBeenCalledTimes(3);
    expect(inputs[1]?.value).toBe("");
    expect(inputs[2]?.value).toBe("");
  });
});

describe("form data participation", () => {
  it("captures input-like components into native FormData", () => {
    const { container } = render(
      <form>
        <TextField id="title">
          <Label>Title</Label>
          <Input name="title" defaultValue="Acme" />
        </TextField>
        <TextField id="notes">
          <Label>Notes</Label>
          <TextArea name="notes" defaultValue="Todo list" />
        </TextField>
        <SearchField id="query">
          <Label>Search</Label>
          <Input name="query" type="search" defaultValue="tickets" />
        </SearchField>
        <CheckboxGroup name="letters" defaultValue={["a", "c"]}>
          <Legend>Letters</Legend>
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
          <Checkbox value="c">C</Checkbox>
        </CheckboxGroup>
        <RadioGroup name="mode" defaultValue="beta">
          <Radio value="alpha">Alpha</Radio>
          <Radio value="beta">Beta</Radio>
        </RadioGroup>
        <Switch name="enabled" defaultSelected inputProps={{ "aria-label": "enable beta" }} />
        <NumberField name="count" defaultValue={7} />
        <Slider name="volume" defaultValue={42} />
        <Select name="plan" defaultValue="react">
          <Label>Plan</Label>
          <Button>
            <SelectValue />
          </Button>
          <Description>Pick a framework</Description>
          <Popover>
            <ListBox>
              <ListBoxItem id="react">React</ListBoxItem>
              <ListBoxItem id="vue">Vue</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <Combobox name="city" defaultValue="Paris">
          <Label>City</Label>
          <Group>
            <Input />
            <Button>Toggle cities</Button>
          </Group>
          <Popover>
            <ListBox>
              <ListBoxItem id="Paris">Paris</ListBoxItem>
              <ListBoxItem id="Oslo">Oslo</ListBoxItem>
            </ListBox>
          </Popover>
        </Combobox>
        <FileTrigger inputProps={{ name: "attachment" }}>Upload</FileTrigger>
      </form>,
    );

    const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
    const form = container.querySelector("form");
    const formData = new FormData(form!);

    expect(formData.get("title")).toBe("Acme");
    expect(formData.get("notes")).toBe("Todo list");
    expect(formData.get("query")).toBe("tickets");
    expect(formData.getAll("letters")).toEqual(["a", "c"]);
    expect(formData.get("mode")).toBe("beta");
    expect(formData.get("enabled")).toBe("on");
    expect(formData.get("count")).toBe("7");
    expect(formData.get("volume")).toBe("42");
    expect(formData.get("plan")).toBe("react");
    expect(formData.get("city")).toBe("Paris");
    const attachment = formData.get("attachment");

    expect(fileInput?.name).toBe("attachment");
    expect(attachment).toBeInstanceOf(File);
  });
});

describe("choice inputs", () => {
  it("uses native checkbox, radio, and switch inputs with group state", () => {
    const { container } = render(
      <>
        <CheckboxGroup defaultValue={["a"]} name="letters">
          <Legend>Letters</Legend>
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
        </CheckboxGroup>
        <RadioGroup defaultValue="x" name="axis">
          <Radio value="x">X</Radio>
          <Radio value="y">Y</Radio>
        </RadioGroup>
        <Switch defaultSelected inputProps={{ "aria-label": "Enabled" }} />
      </>,
    );

    const checkboxes = container.querySelectorAll<HTMLInputElement>("input[type='checkbox']");
    const radios = container.querySelectorAll<HTMLInputElement>("input[type='radio']");

    expect(checkboxes[0]?.checked).toBe(true);
    expect(checkboxes[0]?.style.position).toBe("absolute");
    expect(checkboxes[0]?.closest("label")?.getAttribute("data-selected")).toBe("");
    fireClick(checkboxes[1]!);
    expect(checkboxes[1]?.checked).toBe(true);
    expect(checkboxes[1]?.closest("label")?.getAttribute("data-selected")).toBe("");
    expect(radios[0]?.checked).toBe(true);
    expect(radios[0]?.style.position).toBe("absolute");
    fireClick(radios[1]!);
    expect(radios[1]?.checked).toBe(true);
    expect(radios[1]?.closest("label")?.getAttribute("data-selected")).toBe("");
    expect(container.querySelector("input[role='switch']")?.getAttribute("aria-label")).toBe(
      "Enabled",
    );
  });
});

describe("range and status components", () => {
  it("uses native range and meter primitives with progress state", () => {
    const { container } = render(
      <>
        <Slider aria-label="Volume" defaultValue={25} />
        <ProgressBar value={50}>{({ percentage }) => `${percentage}%`}</ProgressBar>
        <Meter value={1} max={1} />
      </>,
    );

    const slider = container.querySelector<HTMLInputElement>("input[type='range']");
    expect(slider?.value).toBe("25");
    expect(container.querySelector("[role='progressbar']")?.getAttribute("aria-valuenow")).toBe(
      "50",
    );
    expect(container.querySelector("meter")?.hasAttribute("data-complete")).toBe(true);
  });
});

describe("disclosure and navigation", () => {
  it("uses details/summary for disclosure and arrow keys for tabs", () => {
    const { container } = render(
      <>
        <Disclosure defaultOpen>
          <DisclosureTrigger>More</DisclosureTrigger>
          <DisclosurePanel>Panel</DisclosurePanel>
        </Disclosure>
        <Tabs defaultValue="one">
          <TabList>
            <Tab tabKey="one">One</Tab>
            <Tab tabKey="two">Two</Tab>
          </TabList>
          <TabPanel tabKey="one">First</TabPanel>
          <TabPanel tabKey="two">Second</TabPanel>
        </Tabs>
        <Breadcrumbs>
          <ol>
            <li>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </li>
          </ol>
        </Breadcrumbs>
      </>,
    );

    expect(container.querySelector("details")?.open).toBe(true);
    const tabList = container.querySelector("[role='tablist']");
    fireKeyDown(tabList!, "ArrowRight");
    expect(container.querySelectorAll("[role='tab']")[1]?.getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe("Breadcrumbs");
  });
});

describe("collections and pickers", () => {
  it("selects listbox items with keyboard and supports native picker defaults", () => {
    const { container } = render(
      <>
        <ListBox defaultValue="one">
          <ListBoxItem id="one">One</ListBoxItem>
          <ListBoxItem id="two">Two</ListBoxItem>
        </ListBox>
        <Select defaultValue="b" name="plan">
          <Label>Plan</Label>
          <Button>
            <SelectValue />
          </Button>
          <Description>Choose a plan.</Description>
          <Popover>
            <ListBox>
              <ListBoxItem id="a">Alpha</ListBoxItem>
              <ListBoxItem id="b">Beta</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <Combobox defaultValue="Paris">
          <Label>City</Label>
          <Group>
            <Input />
            <Button>Toggle cities</Button>
          </Group>
          <Popover>
            <ListBox>
              <ListBoxItem id="Paris">Paris</ListBoxItem>
            </ListBox>
          </Popover>
        </Combobox>
      </>,
    );

    const listbox = container.querySelector("[role='listbox']");
    fireKeyDown(listbox!, "ArrowDown");
    expect(container.querySelector("#two")?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector("input[name='plan']")?.getAttribute("value")).toBe("b");
    expect(container.querySelector("button[aria-haspopup='listbox']")?.textContent).toBe("Beta");
    expect(
      container.querySelector("input[role='combobox']")?.getAttribute("aria-controls"),
    ).toBeTruthy();
  });

  it("keeps only one listbox option in the tab order without an initial selection", () => {
    const { container } = render(
      <ListBox>
        <ListBoxItem id="one">One</ListBoxItem>
        <ListBoxItem id="two">Two</ListBoxItem>
        <ListBoxItem id="three" disabled>
          Three
        </ListBoxItem>
      </ListBox>,
    );
    const listbox = container.querySelector("[role='listbox']");
    const options = container.querySelectorAll<HTMLElement>("[role='option']");

    expect([...options].map((option) => option.tabIndex)).toEqual([0, -1, -1]);

    options[0]?.focus();
    fireKeyDown(listbox!, "ArrowDown");

    expect(document.activeElement).toBe(options[1]);
    expect([...options].map((option) => option.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("keeps menu semantics and uses listbox semantics inside autocomplete", () => {
    const { container } = render(
      <>
        <MenuPrimitive>
          <MenuItem id="copy">Copy</MenuItem>
          <MenuItem id="paste" disabled>
            Paste
          </MenuItem>
        </MenuPrimitive>
        <MenuPrimitive role="toolbar">
          <MenuItem id="bold" role="note">
            Bold
          </MenuItem>
        </MenuPrimitive>
        <Autocomplete defaultValue="">
          <TextField>
            <Input />
          </TextField>
          <MenuPrimitive>
            <MenuItem id="react">React</MenuItem>
          </MenuPrimitive>
        </Autocomplete>
      </>,
    );

    expect(container.querySelector("[role='menu']")).toBeTruthy();
    expect(container.querySelector("#copy")?.getAttribute("role")).toBe("menuitem");
    expect(container.querySelector("#paste")?.getAttribute("aria-disabled")).toBe("true");
    expect(container.querySelector("[role='toolbar']")).toBeTruthy();
    expect(container.querySelector("#bold")?.getAttribute("role")).toBe("note");
    expect(container.querySelector("[role='listbox']")).toBeTruthy();
    expect(container.querySelector("#react")?.getAttribute("role")).toBe("option");
  });

  it("uses string item children for listbox and menu typeahead", () => {
    const { container } = render(
      <>
        <ListBox>
          <ListBoxItem id="react">React</ListBoxItem>
          <ListBoxItem id="vue">Vue</ListBoxItem>
        </ListBox>
        <MenuPrimitive>
          <MenuItem id="copy">Copy</MenuItem>
          <MenuItem id="paste">Paste</MenuItem>
        </MenuPrimitive>
      </>,
    );
    const listbox = container.querySelector<HTMLElement>("[role='listbox']")!;
    const menu = container.querySelector<HTMLElement>("[role='menu']")!;
    const copy = container.querySelector<HTMLElement>("#copy")!;

    fireKeyDown(listbox, "v");
    expect(container.querySelector("#vue")?.getAttribute("aria-selected")).toBe("true");

    copy.focus();
    fireKeyDown(menu, "p");
    expect(document.activeElement).toBe(container.querySelector("#paste"));
  });

  it("supports composed controlled and uncontrolled select state", () => {
    const onChange = vi.fn();

    const { container } = render(
      <>
        <Select defaultValue="react" onChange={onChange} name="framework">
          <Label>Framework</Label>
          <Button>
            <SelectValue placeholder="Select framework" />
          </Button>
          <Description>Choose the rendering target.</Description>
          <Popover>
            <ListBox>
              <ListBoxItem id="react">React</ListBoxItem>
              <ListBoxItem id="vanilla">Vanilla</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <Select value="react" onChange={onChange}>
          <Label>Controlled framework</Label>
          <Button>
            <SelectValue placeholder="Select framework" />
          </Button>
          <Popover>
            <ListBox>
              <ListBoxItem id="react">React</ListBoxItem>
              <ListBoxItem id="vanilla">Vanilla</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <Combobox defaultValue="Paris" defaultSelectedValue="Paris" name="city">
          <Label>City uncontrolled</Label>
          <Group>
            <Input />
            <Button>Toggle cities</Button>
          </Group>
          <Popover>
            <ListBox>
              <ListBoxItem id="Paris">Paris</ListBoxItem>
              <ListBoxItem id="Berlin">Berlin</ListBoxItem>
              <ListBoxItem id="Oslo" disabled>
                Oslo
              </ListBoxItem>
            </ListBox>
          </Popover>
        </Combobox>
        <Combobox value="Paris" selectedValue="Paris">
          <Label>City controlled</Label>
          <Group>
            <Input />
            <Button>Toggle cities</Button>
          </Group>
          <Popover>
            <ListBox>
              <ListBoxItem id="Paris">Paris</ListBoxItem>
              <ListBoxItem id="Berlin">Berlin</ListBoxItem>
            </ListBox>
          </Popover>
        </Combobox>
      </>,
    );

    const selectRoots = container.querySelectorAll("[data-value='react']");
    const trigger = container.querySelector("button[aria-haspopup='listbox']");
    const firstSelectListbox = container.querySelectorAll("[role='listbox']")[0]!;
    const comboboxes = container.querySelectorAll("input[role='combobox']");
    const uncontrolledCombo = comboboxes[0] as HTMLInputElement | null;
    const controlledCombo = comboboxes[1] as HTMLInputElement | null;

    expect(selectRoots.length).toBeGreaterThanOrEqual(2);
    expect(trigger?.textContent).toBe("React");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("input[name='framework']")?.getAttribute("value")).toBe("react");

    expect(uncontrolledCombo?.value).toBe("Paris");
    expect(controlledCombo?.value).toBe("Paris");

    fireClick(trigger!);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    fireClick(firstSelectListbox.querySelector("#vanilla")!);
    expect(trigger?.textContent).toBe("Vanilla");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("input[name='framework']")?.getAttribute("value")).toBe(
      "vanilla",
    );
    expect(onChange).toHaveBeenCalledWith("vanilla");

    expect(uncontrolledCombo?.getAttribute("aria-controls")).toBeTruthy();
    expect(controlledCombo?.getAttribute("aria-controls")).toBeTruthy();
    expect(
      [...container.querySelectorAll("[role='option'][data-value='react']")].some((option) =>
        option.hasAttribute("data-selected"),
      ),
    ).toBe(true);
    expect(container.querySelector("input[role='combobox']")?.getAttribute("data-value")).toBe(
      "Paris",
    );
    const uncontrolledToggle = uncontrolledCombo
      ?.closest("[data-selected-key='Paris']")
      ?.querySelector("button");
    fireClick(uncontrolledToggle!);
    expect(uncontrolledCombo?.getAttribute("aria-expanded")).toBe("true");
    fireClick(container.querySelector("[role='option'][data-value='Berlin']")!);
    expect(uncontrolledCombo?.value).toBe("Berlin");
    expect(container.querySelector("input[name='city']")?.getAttribute("value")).toBe("Berlin");

    expect(container.querySelector("[data-value='vanilla']")?.hasAttribute("data-disabled")).toBe(
      false,
    );
  });

  it("renders collection sections as DOM-like grouped divs", () => {
    const { container } = render(
      <>
        <ListBox>
          <ListBoxSection aria-label="Libraries" data-testid="listbox-section">
            <ListBoxItem id="react">React</ListBoxItem>
          </ListBoxSection>
        </ListBox>
        <MenuPrimitive>
          <MenuSection aria-labelledby="actions-heading" data-testid="menu-section">
            <span id="actions-heading">Actions</span>
            <MenuItem id="rename">Rename</MenuItem>
          </MenuSection>
        </MenuPrimitive>
      </>,
    );
    const listboxSection = container.querySelector("[data-testid='listbox-section']");
    const menuSection = container.querySelector("[data-testid='menu-section']");

    expect(listboxSection?.getAttribute("role")).toBe("group");
    expect(listboxSection?.getAttribute("aria-label")).toBe("Libraries");
    expect(menuSection?.getAttribute("role")).toBe("group");
    expect(menuSection?.getAttribute("aria-labelledby")).toBe("actions-heading");
    expect(container.querySelector("[role='presentation']")).toBeNull();
  });

  it("renders native option wrappers from children text", () => {
    const html = renderToString(
      <>
        <select>
          <SelectOption value="basic">Basic</SelectOption>
        </select>
        <datalist>
          <ComboboxOption value="react">React</ComboboxOption>
        </datalist>
      </>,
    );

    expect(html).toContain("<option");
    expect(html).toContain('value="basic"');
    expect(html).toContain(">Basic</option>");
    expect(html).toContain('value="react"');
    expect(html).toContain(">React</option>");
    expect(html).not.toContain("textValue");
  });

  it("does not export removed compatibility aliases from the root package", () => {
    expect("Breadcrumb" in ReactComponents).toBe(false);
    expect("Item" in ReactComponents).toBe(false);
    expect("Section" in ReactComponents).toBe(false);
    expect("ComboBox" in ReactComponents).toBe(false);
    expect("ComboBoxOption" in ReactComponents).toBe(false);
    expect("ListBoxSection" in ReactComponents).toBe(true);
    expect("Combobox" in ReactComponents).toBe(true);
    expect("ComboboxOption" in ReactComponents).toBe(true);
  });

  it("uses active descendant keyboard state for combobox suggestions", () => {
    const { container } = render(
      <Combobox defaultValue="">
        <Label>Framework</Label>
        <Group>
          <Input />
          <Button>Show suggestions</Button>
        </Group>
        <Popover>
          <ListBox>
            <ListBoxItem id="react">React</ListBoxItem>
            <ListBoxItem id="preact">Preact</ListBoxItem>
          </ListBox>
        </Popover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']");

    fireKeyDown(input!, "ArrowDown");

    expect(input?.getAttribute("aria-expanded")).toBe("true");
    expect(input?.getAttribute("aria-activedescendant")).toBe("react");

    fireKeyDown(input!, "ArrowDown");

    expect(input?.getAttribute("aria-activedescendant")).toBe("preact");

    fireKeyDown(input!, "Enter");

    expect(input?.value).toBe("Preact");
    expect(input?.getAttribute("aria-expanded")).toBe("false");
  });

  it("filters autocomplete listbox and menu items while keeping focus on the input", () => {
    const changed = vi.fn();
    const { container } = render(
      <>
        <Autocomplete defaultValue="" onChange={changed}>
          <SearchField>
            <Input />
          </SearchField>
          <ListBox>
            <ListBoxItem id="react">React</ListBoxItem>
            <ListBoxItem id="solid">Solid</ListBoxItem>
            <ListBoxItem id="svelte" disabled>
              Svelte
            </ListBoxItem>
          </ListBox>
        </Autocomplete>
        <Autocomplete defaultValue="re">
          <TextField>
            <Input />
          </TextField>
          <MenuPrimitive>
            <MenuItem id="react">React</MenuItem>
            <MenuItem id="vue">Vue</MenuItem>
          </MenuPrimitive>
        </Autocomplete>
      </>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(container.querySelector("#solid")).toBeTruthy();
    fireInput(input, "rea");
    expect(changed).toHaveBeenCalledWith("rea");
    expect(container.querySelector("#react")).toBeTruthy();
    expect(container.querySelector("#solid")).toBeNull();

    fireKeyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBe("react");
    fireKeyDown(input, "Enter");
    expect(input.value).toBe("React");
    expect(document.activeElement).toBe(input);
    expect(container.querySelectorAll("[role='listbox']").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector("#vue")).toBeNull();
  });

  it("uses aria-label for visual listbox and menu item autocomplete text", () => {
    const { container } = render(
      <>
        <Autocomplete defaultValue="rea">
          <SearchField>
            <Input />
          </SearchField>
          <ListBox>
            <ListBoxItem id="a" aria-label="React">
              <span>R</span>
            </ListBoxItem>
            <ListBoxItem id="b" aria-label="Vue">
              <span>V</span>
            </ListBoxItem>
          </ListBox>
        </Autocomplete>
        <Autocomplete defaultValue="ren">
          <TextField>
            <Input />
          </TextField>
          <MenuPrimitive>
            <MenuItem id="c" aria-label="Rename">
              <span>R</span>
            </MenuItem>
            <MenuItem id="d" aria-label="Copy">
              <span>C</span>
            </MenuItem>
          </MenuPrimitive>
        </Autocomplete>
      </>,
    );

    expect(container.querySelector("#a")).toBeTruthy();
    expect(container.querySelector("#b")).toBeNull();
    expect(container.querySelector("#c")).toBeTruthy();
    expect(container.querySelector("#d")).toBeNull();
  });

  it("wires autocomplete labels and combobox active descendant state", () => {
    const { container } = render(
      <>
        <Autocomplete id="search-framework" defaultValue="">
          <SearchField>
            <Label>Search framework</Label>
            <Input />
          </SearchField>
          <ListBox>
            <ListBoxItem id="react">React</ListBoxItem>
            <ListBoxItem id="solid" disabled>
              Solid
            </ListBoxItem>
            <ListBoxItem id="svelte">Svelte</ListBoxItem>
          </ListBox>
        </Autocomplete>
        <Autocomplete id="text-framework" defaultValue="">
          <TextField>
            <Label>Text framework</Label>
            <Input />
          </TextField>
          <ListBox>
            <ListBoxItem id="vue">Vue</ListBoxItem>
          </ListBox>
        </Autocomplete>
      </>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>("input[role='combobox']");
    const listboxes = container.querySelectorAll<HTMLElement>("[role='listbox']");

    expect(container.querySelector("label")?.htmlFor).toBe(inputs[0]?.id);
    expect(container.querySelectorAll("label")[1]?.htmlFor).toBe(inputs[1]?.id);
    expect(inputs[0]?.getAttribute("aria-autocomplete")).toBe("list");
    expect(inputs[0]?.getAttribute("aria-controls")).toBe(listboxes[0]?.id);
    expect(document.getElementById(inputs[0]!.getAttribute("aria-controls")!)).toBe(listboxes[0]);
    expect(inputs[0]?.getAttribute("aria-expanded")).toBe("false");

    fireKeyDown(inputs[0]!, "ArrowDown");
    expect(inputs[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(inputs[0]?.getAttribute("aria-activedescendant")).toBe("react");

    fireKeyDown(inputs[0]!, "ArrowDown");
    expect(inputs[0]?.getAttribute("aria-activedescendant")).toBe("svelte");

    fireKeyDown(inputs[0]!, "Escape");
    expect(inputs[0]?.getAttribute("aria-expanded")).toBe("false");

    fireKeyDown(inputs[0]!, "ArrowDown");
    fireKeyDown(inputs[0]!, "Enter");
    expect(inputs[0]?.value).toBe("Svelte");
    expect(inputs[0]?.getAttribute("aria-expanded")).toBe("false");
  });

  it("honors autocomplete empty collection filtering mode", () => {
    const { container } = render(
      <>
        <Autocomplete defaultValue="">
          <SearchField>
            <Input />
          </SearchField>
          <ListBox>
            <ListBoxItem id="default-react">React</ListBoxItem>
          </ListBox>
        </Autocomplete>
        <Autocomplete defaultValue="" allowsEmptyCollection>
          <SearchField>
            <Input />
          </SearchField>
          <ListBox>
            <ListBoxItem id="empty-react">React</ListBoxItem>
          </ListBox>
        </Autocomplete>
      </>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>("input[role='combobox']");

    expect(container.querySelector("#default-react")).toBeTruthy();
    expect(container.querySelector("#empty-react")).toBeTruthy();

    fireInput(inputs[0]!, "zzz");
    fireInput(inputs[1]!, "zzz");

    expect(container.querySelector("#default-react")).toBeNull();
    expect(container.querySelector("#empty-react")).toBeTruthy();
  });
});

describe("date, time, and color inputs", () => {
  it("renders an interactive ISO calendar and date segments", () => {
    const changed = vi.fn();
    const { container } = render(
      <>
        <Calendar
          defaultValue="2026-04-29"
          focusedValue="2026-04-29"
          isDateDisabled={(date) => date === "2026-04-30"}
          onChange={changed}
        />
        <DateField defaultValue="2026-04-29" name="release">
          <DateInput>
            <DateSegment part="month" />
            <DateSegment part="literal">/</DateSegment>
            <DateSegment part="day" />
            <DateSegment part="literal">/</DateSegment>
            <DateSegment part="year" />
          </DateInput>
        </DateField>
        <RangeCalendar defaultValue={{ start: "2026-04-27", end: "2026-04-29" }} />
        <DateRangePicker defaultValue={{ start: "2026-04-27", end: "2026-04-29" }} name="sprint" />
      </>,
    );
    const calendar = container.querySelector("[data-slot='calendar']")!;
    const selectedCell = container.querySelector("[data-date='2026-04-29']");
    const disabledCell = container.querySelector("[data-date='2026-04-30']");
    const monthSegment = container.querySelector<HTMLElement>("[data-type='month']")!;

    expect(calendar.getAttribute("role")).toBe("group");
    expect(selectedCell?.getAttribute("aria-selected")).toBe("true");
    expect(disabledCell?.getAttribute("aria-disabled")).toBe("true");
    fireKeyDown(calendar, "ArrowLeft");
    fireKeyDown(calendar, "Enter");
    expect(changed).toHaveBeenCalledWith("2026-04-28");

    expect(container.querySelector<HTMLInputElement>("input[name='release']")?.value).toBe(
      "2026-04-29",
    );
    expect(monthSegment.textContent).toBe("04");
    fireKeyDown(monthSegment, "ArrowUp");
    expect(container.querySelector<HTMLInputElement>("input[name='release']")?.value).toBe(
      "2026-05-29",
    );
    expect(
      container.querySelector("[data-slot='range-calendar']")?.getAttribute("data-start-value"),
    ).toBe("2026-04-27");
    expect(container.querySelector<HTMLInputElement>("input[name='sprint-start']")?.value).toBe(
      "2026-04-27",
    );
    expect(container.querySelector<HTMLInputElement>("input[name='sprint-end']")?.value).toBe(
      "2026-04-29",
    );
  });

  it("allows calendar and range calendar role overrides", () => {
    const { container } = render(
      <>
        <Calendar role="application" />
        <RangeCalendar role="region" />
      </>,
    );

    expect(container.querySelector("[data-slot='calendar']")?.getAttribute("role")).toBe(
      "application",
    );
    expect(container.querySelector("[data-slot='range-calendar']")?.getAttribute("role")).toBe(
      "region",
    );
  });

  it("exposes calendar grid state and keyboard navigation without selecting disabled dates", () => {
    const changed = vi.fn();
    const { container } = render(
      <Calendar
        defaultValue="2026-04-29"
        focusedValue="2026-04-29"
        isDateDisabled={(date) => date === "2026-04-30"}
        isDateUnavailable={(date) => date === "2026-05-01"}
        onChange={changed}
      />,
    );
    const calendar = container.querySelector<HTMLElement>("[data-slot='calendar']")!;
    const grid = container.querySelector<HTMLElement>("[role='grid']")!;
    const focused = () => container.querySelector<HTMLElement>("[role='gridcell'][tabindex='0']");

    expect(grid).toBeTruthy();
    expect(container.querySelector("[data-date='2026-04-29']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(container.querySelector("[data-date='2026-04-30']")?.getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(container.querySelectorAll("[role='gridcell'][tabindex='0']")).toHaveLength(1);

    fireKeyDown(calendar, "ArrowRight");
    expect(focused()?.getAttribute("data-date")).toBe("2026-04-30");
    fireKeyDown(calendar, "Enter");
    expect(changed).not.toHaveBeenCalledWith("2026-04-30");

    fireKeyDown(calendar, "ArrowRight");
    expect(focused()?.getAttribute("data-date")).toBe("2026-05-01");
    fireKeyDown(calendar, " ");
    expect(changed).not.toHaveBeenCalledWith("2026-05-01");

    fireKeyDown(calendar, "ArrowLeft");
    fireKeyDown(calendar, "ArrowUp");
    expect(focused()?.getAttribute("data-date")).toBe("2026-04-23");
    fireKeyDown(calendar, "ArrowDown");
    fireKeyDown(calendar, "PageUp");
    expect(focused()?.getAttribute("data-date")).toBe("2026-03-01");
    fireKeyDown(calendar, "PageDown");
    fireKeyDown(calendar, "Home");
    expect(focused()?.getAttribute("data-date")).toBe("2026-03-29");
    fireKeyDown(calendar, "End");
    expect(focused()?.getAttribute("data-date")).toBe("2026-04-04");
  });

  it("updates range calendars and blocks disabled date selection", () => {
    const changed = vi.fn();
    const { container } = render(
      <RangeCalendar
        focusedValue="2026-04-27"
        isDateDisabled={(date) => date === "2026-04-28"}
        onChange={changed}
      />,
    );
    const range = container.querySelector<HTMLElement>("[data-slot='range-calendar']")!;

    fireClick(container.querySelector("[data-date='2026-04-27']")!);
    expect(range.getAttribute("data-start-value")).toBe("2026-04-27");
    expect(range.getAttribute("data-end-value")).toBeNull();

    fireClick(container.querySelector("[data-date='2026-04-28']")!);
    expect(range.getAttribute("data-end-value")).toBeNull();

    fireKeyDown(range, "ArrowRight");
    fireKeyDown(range, "Enter");
    expect(range.getAttribute("data-end-value")).toBeNull();

    fireKeyDown(range, "ArrowRight");
    fireKeyDown(range, " ");
    expect(changed).toHaveBeenLastCalledWith({ start: "2026-04-27", end: "2026-04-29" });
    expect(range.getAttribute("data-end-value")).toBe("2026-04-29");
    expect(container.querySelector("[data-date='2026-04-28']")?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("keeps date and time segments accessible and bounded", () => {
    const { container } = render(
      <>
        <DateField defaultValue="2026-12-31" name="date">
          <DateInput>
            <DateSegment part="month" />
            <DateSegment part="literal">/</DateSegment>
            <DateSegment part="day" />
            <DateSegment part="literal">/</DateSegment>
            <DateSegment part="year" />
          </DateInput>
        </DateField>
        <TimeField defaultValue="23:59:00" name="time">
          <DateInput>
            <DateSegment part="hour" />
            <DateSegment part="literal">:</DateSegment>
            <DateSegment part="minute" />
          </DateInput>
        </TimeField>
      </>,
    );
    const month = container.querySelector<HTMLElement>("[data-type='month']")!;
    const literals = container.querySelectorAll<HTMLElement>("[data-type='literal']");
    const hour = container.querySelector<HTMLElement>("[data-type='hour']")!;
    const minute = container.querySelector<HTMLElement>("[data-type='minute']")!;

    expect(month.getAttribute("role")).toBe("spinbutton");
    expect(month.tabIndex).toBe(0);
    expect(month.getAttribute("aria-valuemin")).toBe("1");
    expect(month.getAttribute("aria-valuemax")).toBe("12");
    expect(month.getAttribute("aria-valuenow")).toBe("12");
    expect(month.getAttribute("aria-valuetext")).toBe("12");
    expect(hour.getAttribute("aria-valuemin")).toBe("0");
    expect(hour.getAttribute("aria-valuemax")).toBe("23");
    expect(minute.getAttribute("aria-valuemax")).toBe("59");
    expect(literals[0]?.getAttribute("role")).toBeNull();
    expect(literals[0]?.getAttribute("tabindex")).toBeNull();
    expect(literals[0]?.getAttribute("aria-valuemin")).toBeNull();
    expect(literals[0]?.getAttribute("aria-valuemax")).toBeNull();
    expect(literals[0]?.getAttribute("aria-valuenow")).toBeNull();
    expect(literals[0]?.getAttribute("aria-valuetext")).toBeNull();

    fireKeyDown(month, "ArrowUp");
    expect(container.querySelector<HTMLInputElement>("input[name='date']")?.value).toBe(
      "2026-12-31",
    );
    fireKeyDown(month, "ArrowDown");
    expect(container.querySelector<HTMLInputElement>("input[name='date']")?.value).toBe(
      "2026-11-31",
    );
    fireKeyDown(literals[0]!, "ArrowUp");
    expect(container.querySelector<HTMLInputElement>("input[name='date']")?.value).toBe(
      "2026-11-31",
    );

    fireKeyDown(hour, "ArrowUp");
    fireKeyDown(minute, "ArrowUp");
    expect(container.querySelector<HTMLInputElement>("input[name='time']")?.value).toBe("23:59:00");
    fireKeyDown(hour, "ArrowDown");
    expect(container.querySelector<HTMLInputElement>("input[name='time']")?.value).toBe("22:59:00");
  });

  it("wires date picker triggers and hidden form values", () => {
    const { container } = render(
      <>
        <DatePicker id="release" defaultValue="2026-04-29" name="release">
          <Button>Open date</Button>
          <Popover>
            <Calendar focusedValue="2026-04-29" />
          </Popover>
        </DatePicker>
        <DateRangePicker
          id="sprint"
          defaultValue={{ start: "2026-04-27", end: "2026-04-29" }}
          name="sprint"
        >
          <Button>Open range</Button>
          <Popover>
            <RangeCalendar focusedValue="2026-04-27" />
          </Popover>
        </DateRangePicker>
      </>,
    );
    const pickers = container.querySelectorAll<HTMLElement>("[data-slot$='picker']");
    const buttons = container.querySelectorAll<HTMLButtonElement>("button[aria-haspopup='dialog']");

    expect(pickers[0]?.getAttribute("data-open")).toBeNull();
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(buttons[0]?.getAttribute("aria-controls")).toBe("release-popover");
    expect(document.getElementById("release-popover")).toBeTruthy();

    fireClick(buttons[0]!);
    expect(pickers[0]?.getAttribute("data-open")).toBe("");
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("true");
    fireClick(container.querySelector("[data-date='2026-04-30']")!);
    expect(buttons[0]?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector<HTMLInputElement>("input[name='release']")?.value).toBe(
      "2026-04-30",
    );

    fireKeyDown(buttons[1]!, "Enter");
    expect(pickers[1]?.getAttribute("data-open")).toBe("");
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    fireClick(pickers[1]!.querySelector("[data-date='2026-04-30']")!);
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("true");
    fireClick(pickers[1]!.querySelector("[data-date='2026-05-01']")!);
    expect(buttons[1]?.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector<HTMLInputElement>("input[name='sprint-start']")?.value).toBe(
      "2026-04-30",
    );
    expect(container.querySelector<HTMLInputElement>("input[name='sprint-end']")?.value).toBe(
      "2026-05-01",
    );
  });

  it("parses color values, updates channels, and selects swatches", () => {
    const { container } = render(
      <ColorField defaultValue="rgb(255, 0, 0)" name="accent">
        <ColorSlider channel="hue" />
        <ColorSwatchPicker>
          <ColorSwatchPickerItem color="#ff0000" />
          <ColorSwatchPickerItem color="#00ff00" />
        </ColorSwatchPicker>
      </ColorField>,
    );
    const slider = container.querySelector<HTMLElement>("[role='slider']")!;
    const swatches = container.querySelectorAll<HTMLElement>("[role='option']");

    expect(slider.getAttribute("aria-valuenow")).toBe("0");
    expect(container.querySelector<HTMLInputElement>("input[name='accent']")?.value).toBe(
      "rgb(255, 0, 0)",
    );

    fireKeyDown(slider, "ArrowRight");
    expect(slider.getAttribute("aria-valuenow")).toBe("1");

    fireClick(swatches[1]!);
    expect(container.querySelector<HTMLInputElement>("input[name='accent']")?.value).toBe(
      "#00ff00",
    );
    expect(swatches[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("exposes color validity and slider keyboard accessibility", () => {
    const { container, rerender } = render(
      <ColorField defaultValue="#ff0000">
        <ColorSlider channel="hue" aria-label="Hue" />
        <ColorArea aria-label="Saturation" />
        <ColorWheel aria-label="Wheel hue" />
      </ColorField>,
    );
    const field = container.querySelector<HTMLElement>("[data-slot='color-field']")!;
    const sliders = container.querySelectorAll<HTMLElement>("[role='slider']");

    expect(field.getAttribute("aria-invalid")).toBeNull();
    expect(field.hasAttribute("data-invalid")).toBe(false);
    expect(sliders[0]?.getAttribute("aria-label")).toBe("Hue");
    expect(sliders[0]?.getAttribute("aria-valuemin")).toBe("0");
    expect(sliders[0]?.getAttribute("aria-valuemax")).toBe("360");
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("0");
    expect(sliders[1]?.getAttribute("aria-valuemax")).toBe("100");
    expect(sliders[2]?.getAttribute("aria-valuemax")).toBe("360");

    fireKeyDown(sliders[0]!, "ArrowRight");
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("1");
    fireModifiedKeyDown(sliders[0]!, "ArrowRight", { shiftKey: true });
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("11");
    fireKeyDown(sliders[0]!, "Home");
    expect(sliders[0]?.getAttribute("aria-valuenow")).toBe("0");
    fireKeyDown(sliders[1]!, "Home");
    expect(sliders[1]?.getAttribute("aria-valuenow")).toBe("0");
    fireKeyDown(sliders[1]!, "End");
    expect(sliders[1]?.getAttribute("aria-valuenow")).toBe("100");
    fireKeyDown(sliders[1]!, "ArrowDown");
    expect(sliders[1]?.getAttribute("aria-valuenow")).toBe("99");

    rerender(<ColorField key="invalid" defaultValue="not-a-color" />);
    const invalidField = container.querySelector<HTMLElement>("[data-slot='color-field']")!;
    expect(invalidField.getAttribute("aria-invalid")).toBe("true");
    expect(invalidField.hasAttribute("data-invalid")).toBe(true);
  });

  it("uses listbox option semantics for color swatches and blocks disabled selection", () => {
    const { container } = render(
      <ColorField defaultValue="#ff0000" name="accent">
        <ColorSwatchPicker aria-label="Accent color">
          <ColorSwatchPickerItem color="#ff0000" />
          <ColorSwatchPickerItem color="#00ff00" />
          <ColorSwatchPickerItem color="#0000ff" disabled />
        </ColorSwatchPicker>
      </ColorField>,
    );
    const picker = container.querySelector<HTMLElement>("[role='listbox']")!;
    const swatches = container.querySelectorAll<HTMLElement>("[role='option']");
    const hidden = container.querySelector<HTMLInputElement>("input[name='accent']")!;

    expect(picker.getAttribute("aria-label")).toBe("Accent color");
    expect(swatches[0]?.getAttribute("aria-selected")).toBe("true");
    expect(swatches[2]?.getAttribute("aria-disabled")).toBe("true");

    fireModifiedKeyDown(swatches[1]!, " ");
    expect(hidden.value).toBe("#00ff00");
    expect(swatches[1]?.getAttribute("aria-selected")).toBe("true");

    fireClick(swatches[2]!);
    expect(hidden.value).toBe("#00ff00");
    fireKeyDown(swatches[2]!, "Enter");
    expect(hidden.value).toBe("#00ff00");
  });
});

describe("overlays and tables", () => {
  it("renders overlay roles and native table markup", () => {
    const { container } = render(
      <>
        <Dialog aria-label="Settings">Body</Dialog>
        <Modal defaultOpen>Modal body</Modal>
        <Button command="toggle-popover" commandfor="menu">
          Open menu
        </Button>
        <Popover id="menu" popover="auto" anchor="menu-button">
          Native popover body
        </Popover>
        <Popover defaultOpen>Popover body</Popover>
        <Tooltip>Tip</Tooltip>
        <Table>
          <TableHeader>
            <Row>
              <Column>Name</Column>
            </Row>
          </TableHeader>
          <TableBody>
            <Row selected>
              <Cell>Ada</Cell>
            </Row>
          </TableBody>
        </Table>
      </>,
    );

    expect(container.querySelector("[role='dialog']")?.textContent).toContain("Body");
    expect(document.body.querySelector("dialog")?.getAttribute("aria-modal")).toBe("true");
    expect(container.querySelector("button[commandfor='menu']")?.getAttribute("command")).toBe(
      "toggle-popover",
    );
    expect(container.querySelector("#menu")?.hasAttribute("hidden")).toBe(false);
    expect(container.querySelector("#menu")?.getAttribute("popover")).toBe("auto");
    expect(container.querySelector("#menu")?.getAttribute("anchor")).toBe("menu-button");
    expect(container.querySelector("[role='tooltip']")?.textContent).toBe("Tip");
    expect(container.querySelector("table th")?.getAttribute("scope")).toBe("col");
    expect(container.querySelector("tbody tr")?.hasAttribute("data-selected")).toBe(true);
  });

  it("can render representative components on the server", () => {
    const html = renderToString(
      <div>
        <Button>Save</Button>
        <TextField id="name">
          <Label>Name</Label>
          <Input name="name" />
        </TextField>
        <ListBox defaultValue="a">
          <ListBoxItem id="a">Alpha</ListBoxItem>
        </ListBox>
        <Select defaultValue="a" name="picker">
          <Label>Picker</Label>
          <Button>
            <SelectValue />
          </Button>
          <Popover>
            <ListBox>
              <ListBoxItem id="a">Alpha</ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <Combobox defaultValue="Alpha" defaultSelectedValue="a">
          <Label>Combo</Label>
          <Group>
            <Input />
            <Button>Toggle</Button>
          </Group>
          <Popover>
            <ListBox>
              <ListBoxItem id="a">Alpha</ListBoxItem>
            </ListBox>
          </Popover>
        </Combobox>
        <Dialog aria-label="Server dialog" />
      </div>,
    );

    expect(html).toContain("Save");
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('data-value="Alpha"');
    expect(html).toContain('aria-label="Server dialog"');
  });
});

describe("drag and drop", () => {
  it("accepts external file drags and exposes drop target state", () => {
    const dropped = vi.fn();
    const { container } = render(
      <DropZone onDrop={(event) => dropped(Array.from(event.dataTransfer.files))}>
        Drop files
      </DropZone>,
    );
    const dropZone = container.querySelector("[data-slot='drop-zone']");
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });

    const dragEnter = fireFileDragEvent(dropZone!, "dragenter", [file]);
    expect(dragEnter.defaultPrevented).toBe(true);
    expect(dropZone?.hasAttribute("data-drop-target")).toBe(true);

    const dragOver = fireFileDragEvent(dropZone!, "dragover", [file]);
    expect(dragOver.defaultPrevented).toBe(true);

    const drop = fireFileDragEvent(dropZone!, "drop", [file]);
    expect(drop.defaultPrevented).toBe(true);
    expect(dropped).toHaveBeenCalledWith([file]);
    expect(dropZone?.hasAttribute("data-drop-target")).toBe(false);
  });
});
