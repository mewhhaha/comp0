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
        <Combobox id="framework" allowsEmptyCollection>
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
            <Tab tab="overview">Overview</Tab>
          </TabList>
          <TabPanel tab="overview">Overview content</TabPanel>
        </Tabs>
        <Dialog>
          <DialogTrigger>Open settings</DialogTrigger>
          <DialogContent aria-label="Settings">Settings</DialogContent>
        </Dialog>
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
