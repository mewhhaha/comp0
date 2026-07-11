import axe from "axe-core";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxOption,
  Dialog,
  DialogContent,
  DialogTrigger,
  Label,
  Radio,
  RadioGroup,
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  TextField,
  Input,
  Popover,
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
          <Popover>
            <SelectTrigger>Choose language</SelectTrigger>
            <SelectContent>
              <SelectOption value="typescript">TypeScript</SelectOption>
              <SelectOption value="rust">Rust</SelectOption>
            </SelectContent>
          </Popover>
        </Select>
        <Combobox id="framework" allowsEmptyCollection>
          <Label>Framework</Label>
          <Popover>
            <ComboboxInput />
            <ComboboxContent>
              <ComboboxOption value="react">React</ComboboxOption>
            </ComboboxContent>
          </Popover>
        </Combobox>
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
