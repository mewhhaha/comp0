import { type ComponentType, useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  AlertDialog,
  AlertDialogContent,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxOption,
  Description,
  Dialog,
  DialogContent,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  Fieldset,
  FileTrigger,
  Input,
  Label,
  Legend,
  Link,
  ListBox,
  ListBoxItem,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  NumberField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Radio,
  RadioGroup,
  SearchField,
  SearchFieldClear,
  SearchFieldInput,
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextArea,
  TextField,
  ToggleButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VisuallyHidden,
} from "@comp0/react";

function ButtonExample() {
  const [saved, setSaved] = useState(false);

  return (
    <Button
      className="rounded bg-teal-700 px-3 py-2.5 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
      onClick={() => setSaved(true)}
    >
      {saved ? "Saved" : "Save changes"}
    </Button>
  );
}

function ToggleButtonExample() {
  return (
    <ToggleButton
      className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
      defaultSelected
    >
      Pin note
    </ToggleButton>
  );
}

function LinkExample() {
  const [followed, setFollowed] = useState(false);

  return (
    <p className="text-base text-zinc-700 sm:text-sm dark:text-zinc-300">
      <Link
        href="#link-example"
        className="text-teal-700 underline underline-offset-4 dark:text-teal-300"
        onClick={(event) => {
          event.preventDefault();
          setFollowed(true);
        }}
      >
        {followed ? "Thanks for following" : "Read the guide"}
      </Link>
    </p>
  );
}

function FileTriggerExample() {
  const [name, setName] = useState("No file selected");

  return (
    <div className="flex flex-col gap-2">
      <FileTrigger
        className="inline-flex w-fit cursor-pointer rounded border border-dashed border-zinc-950/20 px-3 py-2.5 text-base text-zinc-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:border-white/20 dark:text-zinc-100 dark:has-focus-visible:outline-teal-400"
        inputProps={{
          name: "example-file",
          className: "sr-only",
          hidden: false,
          "aria-label": "Choose a file",
          onChange: (event) => setName(event.currentTarget.files?.[0]?.name ?? "No file selected"),
        }}
      >
        Choose a file
      </FileTrigger>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">{name}</p>
    </div>
  );
}

function VisuallyHiddenExample() {
  return (
    <button
      type="button"
      className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
    >
      Notifications <VisuallyHidden>(3 unread)</VisuallyHidden>
    </button>
  );
}

function TextFieldExample() {
  return (
    <TextField as="div" className="flex max-w-xs flex-col gap-1.5">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Email
      </Label>
      <Input
        className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        name="email"
        type="email"
        placeholder="you@example.com"
      />
      <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        We only use this for receipts.
      </Description>
    </TextField>
  );
}

function TextAreaExample() {
  return (
    <TextField as="div" className="flex max-w-xs flex-col gap-1.5">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Feedback
      </Label>
      <TextArea
        className="min-h-28 w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        name="feedback"
        placeholder="Tell us what you think."
      />
    </TextField>
  );
}

function SearchFieldExample() {
  const [submitted, setSubmitted] = useState("");

  return (
    <SearchField as="div" className="flex max-w-xs flex-col gap-2" onSubmit={setSubmitted}>
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Search
      </Label>
      <div className="flex gap-2">
        <SearchFieldInput
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          name="query"
          placeholder="Press Enter"
        />
        <SearchFieldClear className="shrink-0 rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
          Clear
        </SearchFieldClear>
      </div>
      {submitted && (
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Searching for “{submitted}”
        </p>
      )}
    </SearchField>
  );
}

function CheckboxExample() {
  return (
    <Checkbox
      className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      defaultSelected
      name="product-updates"
    >
      <span className="size-5 shrink-0 rounded-sm border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 group-data-selected:bg-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400 dark:group-data-selected:bg-teal-400" />
      Send me product updates
    </Checkbox>
  );
}

function RadioExample() {
  return (
    <RadioGroup
      className="flex flex-col gap-2 sm:flex-row sm:gap-4"
      defaultValue="standard"
      name="shipping"
    >
      <Radio
        value="standard"
        className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400">
          <span className="size-2 rounded-full bg-teal-600 opacity-0 group-data-selected:opacity-100 dark:bg-teal-400" />
        </span>
        Standard
      </Radio>
      <Radio
        value="express"
        className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400">
          <span className="size-2 rounded-full bg-teal-600 opacity-0 group-data-selected:opacity-100 dark:bg-teal-400" />
        </span>
        Express
      </Radio>
    </RadioGroup>
  );
}

function SwitchExample() {
  return (
    <Switch
      className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      defaultSelected
      name="alerts"
    >
      <span className="h-6 w-11 shrink-0 rounded-full bg-zinc-200 p-0.5 ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:bg-teal-600 sm:h-5 sm:w-9 dark:bg-zinc-800 dark:group-data-focused:ring-teal-400 dark:group-data-selected:bg-teal-400">
        <span className="block size-5 rounded-full bg-white shadow-sm group-data-selected:translate-x-5 sm:size-4 sm:group-data-selected:translate-x-4 dark:shadow-none" />
      </span>
      Enable alerts
    </Switch>
  );
}

function FieldsetExample() {
  return (
    <Fieldset className="flex max-w-xs flex-col gap-2 rounded border border-zinc-950/10 p-3 dark:border-white/10">
      <Legend className="px-1 text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Delivery
      </Legend>
      <Checkbox
        className="flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
        defaultSelected
        name="leave-at-door"
      >
        <span className="size-5 shrink-0 rounded-sm border border-zinc-950/20 bg-white sm:size-4 dark:border-white/20 dark:bg-zinc-900" />
        Leave at the door
      </Checkbox>
    </Fieldset>
  );
}

function NumberFieldExample() {
  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="tickets"
      >
        Tickets
      </Label>
      <NumberField
        className="[&_input]:w-full [&_input]:rounded [&_input]:border [&_input]:border-zinc-950/10 [&_input]:bg-white [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-base [&_input]:text-zinc-950 [&_input]:outline-teal-600 [&_input]:focus-visible:outline-2 sm:[&_input]:py-2 sm:[&_input]:text-sm dark:[&_input]:border-white/10 dark:[&_input]:bg-zinc-900 dark:[&_input]:text-zinc-50 dark:[&_input]:outline-teal-400"
        defaultValue={2}
        id="tickets"
        max={10}
        min={1}
        name="tickets"
      />
    </div>
  );
}

function SliderExample() {
  const [value, setValue] = useState(40);

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="volume"
      >
        Volume
      </Label>
      <Slider
        aria-label="Volume"
        className="w-full accent-teal-600 dark:accent-teal-400"
        id="volume"
        name="volume"
        value={value}
        onChange={setValue}
      />
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        Volume: {value}%
      </p>
    </div>
  );
}

function AccordionExample() {
  return (
    <Accordion
      as="div"
      className="divide-y divide-zinc-950/10 rounded border border-zinc-950/10 dark:divide-white/10 dark:border-white/10"
      defaultValue="shipping"
    >
      <AccordionItem value="shipping">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Shipping <span aria-hidden="true">+</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Orders leave our warehouse in two business days.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionHeader className="m-0">
          <AccordionTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left text-base text-zinc-900 sm:py-2 sm:text-sm dark:text-zinc-100">
            Returns <span aria-hidden="true">+</span>
          </AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel className="px-3 pb-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Returns are accepted within 30 days.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

function DisclosureExample() {
  return (
    <Disclosure className="flex max-w-xs flex-col gap-2 rounded border border-zinc-950/10 p-3 dark:border-white/10">
      <DisclosureTrigger className="cursor-pointer text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        What is included?
      </DisclosureTrigger>
      <DisclosurePanel className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Source files, updates, and email support.
      </DisclosurePanel>
    </Disclosure>
  );
}

function TabsExample() {
  return (
    <Tabs as="div" defaultValue="preview">
      <TabList className="flex max-w-full gap-1 overflow-x-auto border-b border-zinc-950/10 dark:border-white/10">
        <Tab
          className="shrink-0 px-3 py-2.5 text-base text-zinc-700 data-selected:border-b-2 data-selected:border-teal-600 data-selected:text-teal-800 sm:py-2 sm:text-sm dark:text-zinc-300 dark:data-selected:border-teal-400 dark:data-selected:text-teal-200"
          tabKey="preview"
        >
          Preview
        </Tab>
        <Tab
          className="shrink-0 px-3 py-2.5 text-base text-zinc-700 data-selected:border-b-2 data-selected:border-teal-600 data-selected:text-teal-800 sm:py-2 sm:text-sm dark:text-zinc-300 dark:data-selected:border-teal-400 dark:data-selected:text-teal-200"
          tabKey="code"
        >
          Code
        </Tab>
      </TabList>
      <TabPanel
        className="pt-3 text-base text-zinc-700 sm:text-sm dark:text-zinc-300"
        tabKey="preview"
      >
        A live component preview.
      </TabPanel>
      <TabPanel
        className="pt-3 font-mono text-base text-zinc-700 sm:text-sm dark:text-zinc-300"
        tabKey="code"
      >
        import {"{ Button }"} from "@comp0/react"
      </TabPanel>
    </Tabs>
  );
}

function BreadcrumbsExample() {
  return (
    <Breadcrumbs className="flex flex-wrap gap-2 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
      <BreadcrumbLink
        href="#home"
        className="underline"
        onClick={(event) => event.preventDefault()}
      >
        Home
      </BreadcrumbLink>
      <span aria-hidden="true">/</span>
      <BreadcrumbLink
        href="#docs"
        className="underline"
        onClick={(event) => event.preventDefault()}
      >
        Docs
      </BreadcrumbLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Components</span>
    </Breadcrumbs>
  );
}

function ListBoxExample() {
  const [value, setValue] = useState("mint");

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <ListBox
        aria-label="Flavor"
        className="rounded border border-zinc-950/10 p-1 dark:border-white/10"
        value={value}
        onChange={setValue}
      >
        <ListBoxItem
          className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
          value="mint"
        >
          Mint
        </ListBoxItem>
        <ListBoxItem
          className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
          value="plum"
        >
          Plum
        </ListBoxItem>
      </ListBox>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {value}</p>
    </div>
  );
}

function MenuExample() {
  return (
    <Menu>
      <MenuTrigger className="[anchor-name:--menu-example] rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Actions
      </MenuTrigger>
      <MenuContent className="[position-anchor:--menu-example] inset-auto m-0 mt-2 w-40 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block] dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
        <MenuItem
          className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
          value="rename"
        >
          Rename
        </MenuItem>
        <MenuItem
          className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
          value="duplicate"
        >
          Duplicate
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function SelectExample() {
  return (
    <Select as="div" className="flex max-w-xs flex-col gap-1.5" defaultValue="medium" name="size">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Size
      </Label>
      <Popover>
        <SelectTrigger className="[anchor-name:--select-example] w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="[position-anchor:--select-example] m-0 max-h-60 w-[anchor-size(width)] max-w-[anchor-size(width)] overflow-y-auto inset-auto rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 [position-area:block-end] [position-try-fallbacks:flip-block] dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
          <SelectOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="small"
          >
            Small
          </SelectOption>
          <SelectOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="medium"
          >
            Medium
          </SelectOption>
          <SelectOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="large"
          >
            Large
          </SelectOption>
        </SelectContent>
      </Popover>
    </Select>
  );
}

function ComboboxExample() {
  return (
    <Combobox as="div" className="flex max-w-xs flex-col gap-1.5" name="city">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        City
      </Label>
      <Popover>
        <ComboboxInput
          className="[anchor-name:--combobox-example] w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          placeholder="Filter cities"
        />
        <ComboboxContent className="[position-anchor:--combobox-example] m-0 max-h-60 w-[anchor-size(width)] max-w-[anchor-size(width)] overflow-y-auto inset-auto rounded border-0 bg-white p-1 ring-1 ring-zinc-950/10 [position-area:block-end] [position-try-fallbacks:flip-block] dark:bg-zinc-900 dark:ring-white/10">
          <ComboboxOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="Warsaw"
          >
            Warsaw
          </ComboboxOption>
          <ComboboxOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="Tokyo"
          >
            Tokyo
          </ComboboxOption>
          <ComboboxOption
            className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
            value="Lisbon"
          >
            Lisbon
          </ComboboxOption>
        </ComboboxContent>
      </Popover>
    </Combobox>
  );
}

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950">
        Open dialog
      </DialogTrigger>
      <DialogContent
        aria-label="Example dialog"
        className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[min(1vw,12px)] bg-white p-4 text-zinc-900 shadow-2xl ring-1 ring-zinc-950/10 backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
      >
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium sm:text-sm">Ready to publish?</p>
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
            This dialog is scoped to this example.
          </p>
          <form method="dialog" className="flex pt-2">
            <Button
              className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
              type="submit"
            >
              Done
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialogExample() {
  return (
    <AlertDialog>
      <DialogTrigger className="rounded border border-red-950/10 px-3 py-2.5 text-base text-red-700 sm:py-2 sm:text-sm dark:border-red-200/10 dark:text-red-300">
        Delete draft
      </DialogTrigger>
      <AlertDialogContent
        aria-label="Delete draft"
        className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[min(1vw,12px)] bg-white p-4 text-zinc-900 shadow-2xl ring-1 ring-red-950/10 backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-red-200/10"
      >
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium sm:text-sm">Delete this draft?</p>
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
            This action cannot be undone.
          </p>
          <form method="dialog" className="flex gap-2 pt-2">
            <Button
              className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100"
              type="submit"
            >
              Cancel
            </Button>
            <Button
              className="rounded bg-red-600 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm"
              type="submit"
            >
              Delete
            </Button>
          </form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PopoverExample() {
  return (
    <Popover>
      <PopoverTrigger className="[anchor-name:--popover-example] rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Show details
      </PopoverTrigger>
      <PopoverContent className="[position-anchor:--popover-example] inset-auto m-0 mt-2 flex w-56 flex-col gap-1 rounded border-0 bg-white p-3 shadow-lg ring-1 ring-zinc-950/10 [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block] dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
        <p className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          New release
        </p>
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Version 0.1 is ready to explore.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function TooltipExample() {
  return (
    <Tooltip>
      <TooltipTrigger className="[anchor-name:--tooltip-example] rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Hover or focus
      </TooltipTrigger>
      <TooltipContent className="[position-anchor:--tooltip-example] inset-auto m-0 mt-2 w-max rounded border-0 bg-zinc-900 px-2 py-1 text-base text-white [position-area:block-end_span-inline-end] [position-try-fallbacks:flip-block] sm:text-sm dark:bg-zinc-100 dark:text-zinc-900">
        Helpful context
      </TooltipContent>
    </Tooltip>
  );
}

export const exampleRegistry: Record<string, ComponentType> = {
  button: ButtonExample,
  "toggle-button": ToggleButtonExample,
  link: LinkExample,
  "file-trigger": FileTriggerExample,
  "visually-hidden": VisuallyHiddenExample,
  "text-field": TextFieldExample,
  "text-area": TextAreaExample,
  "search-field": SearchFieldExample,
  checkbox: CheckboxExample,
  radio: RadioExample,
  switch: SwitchExample,
  fieldset: FieldsetExample,
  "number-field": NumberFieldExample,
  slider: SliderExample,
  accordion: AccordionExample,
  disclosure: DisclosureExample,
  tabs: TabsExample,
  breadcrumbs: BreadcrumbsExample,
  "list-box": ListBoxExample,
  menu: MenuExample,
  select: SelectExample,
  combobox: ComboboxExample,
  dialog: DialogExample,
  "alert-dialog": AlertDialogExample,
  popover: PopoverExample,
  tooltip: TooltipExample,
};

export function getExample(slug: string): ComponentType | undefined {
  return exampleRegistry[slug];
}
