import axe from "axe-core";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Autocomplete,
  Checkbox,
  ColorArea,
  ColorAreaThumb,
  ColorPicker,
  ColorPickerInput,
  ColorPickerPopover,
  ColorPickerTrigger,
  ColorSlider,
  Combobox,
  ComboboxPopover,
  ComboboxInput,
  ComboboxOption,
  Dialog,
  DialogContent,
  DialogTrigger,
  GridList,
  GridListItem,
  GridListMoveButton,
  GridListReorderGroup,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  PasswordField,
  PasswordFieldInput,
  PasswordFieldToggle,
  Radio,
  RadioGroup,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  SearchField,
  SearchFieldInput,
  TextField,
  Input,
  Inventory,
  InventoryItem,
  InventoryMoveHandle,
  InventoryPreview,
  InventoryResizeHandle,
  Tour,
  TourOverlay,
  TourTrigger,
} from "./index.js";
import { render } from "../test/render.js";

describe("retained accessibility contracts", () => {
  it("has no automated WCAG violations in canonical compositions", async () => {
    render(
      <main>
        <TextField id="name" required>
          <Label>Name</Label>
          <Input />
        </TextField>
        <PasswordField id="password">
          <Label>Password</Label>
          <PasswordFieldInput autoComplete="current-password" />
          <PasswordFieldToggle />
        </PasswordField>
        <NumberField id="tickets" defaultValue={2} min={1} max={10}>
          <Label>Tickets</Label>
          <NumberFieldDecrement aria-label="Decrease tickets" />
          <NumberFieldInput />
          <NumberFieldIncrement aria-label="Increase tickets" />
        </NumberField>
        <ColorPicker id="accent-color" defaultValue="#0d9488" defaultOpen>
          <Label>Accent color</Label>
          <ColorPickerTrigger />
          <ColorPickerPopover>
            <ColorArea aria-label="Accent saturation and brightness">
              <ColorAreaThumb />
            </ColorArea>
            <ColorSlider channel="hue" />
            <ColorPickerInput />
          </ColorPickerPopover>
        </ColorPicker>
        <Checkbox name="updates">Product updates</Checkbox>
        <RadioGroup name="plan" defaultValue="free">
          <legend>Plan</legend>
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
        </RadioGroup>
        <Select id="language" defaultValue="typescript">
          <Label>Language</Label>
          <SelectTrigger>Choose language</SelectTrigger>
          <SelectPopover>
            <SelectOption value="typescript">TypeScript</SelectOption>
            <SelectOption value="rust">Rust</SelectOption>
          </SelectPopover>
        </Select>
        <Combobox id="framework" allowEmptyCollection>
          <Label>Framework</Label>
          <ComboboxInput />
          <ComboboxPopover>
            <ComboboxOption value="react">React</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
        <Autocomplete>
          <SearchField>
            <Label>Destination</Label>
            <SearchFieldInput />
          </SearchField>
          <ListBox aria-label="Destination suggestions">
            <ListBoxItem value="warsaw">Warsaw</ListBoxItem>
          </ListBox>
        </Autocomplete>
        <GridListReorderGroup value={{ todo: ["review"], done: [] }} onChange={() => {}}>
          <GridList name="todo" aria-label="To do">
            <GridListItem value="review" textValue="Review changes">
              Review changes
              <GridListMoveButton to="done">Move to done</GridListMoveButton>
            </GridListItem>
          </GridList>
          <GridList name="done" aria-label="Done" />
        </GridListReorderGroup>
        <Inventory
          aria-label="Dashboard"
          columns={2}
          rows={2}
          defaultValue={[{ value: "revenue", column: 1, row: 1, columnSpan: 1, rowSpan: 1 }]}
        >
          <InventoryItem value="revenue" textValue="Revenue">
            Revenue
            <InventoryMoveHandle />
            <InventoryResizeHandle />
          </InventoryItem>
          <InventoryPreview />
        </Inventory>
        <Accordion defaultValue="one">
          <AccordionItem value="one">
            <AccordionHeader>
              <AccordionTrigger>Details</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>Content</AccordionPanel>
          </AccordionItem>
        </Accordion>
        <Tabs defaultValue="overview">
          <TabList aria-label="Project">
            <Tab value="overview">Overview</Tab>
          </TabList>
          <TabPanel value="overview">Overview content</TabPanel>
        </Tabs>
        <Dialog>
          <DialogTrigger>Open settings</DialogTrigger>
          <DialogContent aria-label="Settings">Settings</DialogContent>
        </Dialog>
        <Tour defaultStep={0} steps={[{ target: "project-search", title: "Find projects" }]}>
          <TourTrigger>Start product tour</TourTrigger>
          <button type="button" data-tour-target="project-search">
            Search projects
          </button>
          <TourOverlay aria-label="Product tour">
            {({ step, next }) => (
              <button type="button" onClick={next}>
                {step.title}
              </button>
            )}
          </TourOverlay>
        </Tour>
      </main>,
    );

    const result = await axe.run(document.body, {
      rules: {
        "color-contrast": { enabled: false },
        "target-size": { enabled: false },
      },
    });

    expect(result.violations).toEqual([]);
  });
});
