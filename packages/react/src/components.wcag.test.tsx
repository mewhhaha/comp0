import axe from "axe-core";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import * as C from "./index.js";
import { render } from "../test/render.js";

type AccessibilityFixture = {
  name: string;
  components: string[];
  render(): ReactElement;
};

const axeOptions: axe.RunOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"],
  },
  rules: {
    "color-contrast": { enabled: false },
    "target-size": { enabled: false },
  },
};

const fieldContext = {
  controlId: "provided-field",
  labelId: "provided-field-label",
  descriptionId: "provided-field-description",
  errorId: "provided-field-error",
  invalid: true,
  required: true,
};

const fixtures: AccessibilityFixture[] = [
  {
    name: "primitives, fields, choice controls, and range controls",
    components: [
      "Button",
      "Checkbox",
      "CheckboxGroup",
      "Description",
      "FieldError",
      "FieldProvider",
      "Fieldset",
      "Group",
      "Heading",
      "Input",
      "Label",
      "Legend",
      "Link",
      "Meter",
      "NumberField",
      "ProgressBar",
      "Radio",
      "RadioGroup",
      "SearchField",
      "Separator",
      "Slider",
      "Switch",
      "Text",
      "TextArea",
      "TextField",
      "ToggleButton",
    ],
    render: () => (
      <section aria-label="Primitive controls">
        <C.Heading level={1}>Settings</C.Heading>
        <C.Text>Headless controls preserve native labels and form semantics.</C.Text>
        <C.Group aria-label="Actions">
          <C.Button>Save</C.Button>
          <C.ToggleButton>Bold</C.ToggleButton>
          <C.Link href="/docs">Documentation</C.Link>
        </C.Group>
        <C.Separator />
        <C.FieldProvider value={fieldContext}>
          <C.Label>Provided input</C.Label>
          <C.Input />
          <C.Description>Use at least two characters.</C.Description>
          <C.FieldError>Required</C.FieldError>
        </C.FieldProvider>
        <C.TextField id="name" required>
          <C.Label>Name</C.Label>
          <C.Input />
          <C.Description>Shown on your profile.</C.Description>
        </C.TextField>
        <C.TextField id="bio">
          <C.Label>Bio</C.Label>
          <C.TextArea />
        </C.TextField>
        <C.SearchField id="search" defaultValue="docs">
          <C.Label>Search</C.Label>
          <C.Input />
          <C.Button aria-label="Clear search" slot="clear">
            Clear
          </C.Button>
        </C.SearchField>
        <C.Fieldset id="notifications" required>
          <C.Legend>Notifications</C.Legend>
          <C.CheckboxGroup defaultValue={["email"]}>
            <C.Legend>Channels</C.Legend>
            <C.Checkbox value="email">Email</C.Checkbox>
            <C.Checkbox value="sms">SMS</C.Checkbox>
          </C.CheckboxGroup>
          <C.RadioGroup defaultValue="daily">
            <C.Legend>Cadence</C.Legend>
            <C.Radio value="daily">Daily</C.Radio>
            <C.Radio value="weekly">Weekly</C.Radio>
          </C.RadioGroup>
          <C.Switch>Enable reminders</C.Switch>
        </C.Fieldset>
        <C.NumberField id="quantity" defaultValue={2}>
          <C.Label>Quantity</C.Label>
          <C.Input type="number" min={1} max={10} />
        </C.NumberField>
        <C.Slider aria-label="Volume" defaultValue={40} min={0} max={100} />
        <C.ProgressBar aria-label="Upload progress" value={60} maxValue={100} />
        <C.Meter aria-label="Storage used" value={0.5} min={0} max={1} />
      </section>
    ),
  },
  {
    name: "selectable collections, menus, native options, and autocomplete",
    components: [
      "Autocomplete",
      "Collection",
      "CollectionBuilder",
      "ComboBoxValue",
      "Combobox",
      "ComboboxOption",
      "ContextMenu",
      "ContextMenuContent",
      "ContextMenuTrigger",
      "DefaultCollectionRenderer",
      "Feed",
      "FeedArticle",
      "ListBox",
      "ListBoxItem",
      "ListBoxLoadMoreItem",
      "ListBoxSection",
      "Menu",
      "MenuItem",
      "MenuSection",
      "MenuTrigger",
      "Popover",
      "Select",
      "SelectOption",
      "SelectValue",
      "SubmenuTrigger",
    ],
    render: () => (
      <section aria-label="Collections">
        <C.CollectionBuilder>Builder hook point</C.CollectionBuilder>
        <C.DefaultCollectionRenderer>Default renderer hook point</C.DefaultCollectionRenderer>
        <C.ComboBoxValue>Current combobox value</C.ComboBoxValue>
        <C.Select id="plan" defaultValue="pro">
          <C.Label>Plan</C.Label>
          <C.Button>
            <C.SelectValue placeholder="Choose a plan" />
          </C.Button>
          <C.Popover>
            <C.ListBox>
              <C.ListBoxSection aria-label="Paid plans">
                <C.ListBoxItem id="pro">Pro</C.ListBoxItem>
                <C.ListBoxItem id="team">Team</C.ListBoxItem>
              </C.ListBoxSection>
              <C.ListBoxLoadMoreItem>Load more plans</C.ListBoxLoadMoreItem>
            </C.ListBox>
          </C.Popover>
        </C.Select>
        <C.Combobox id="city" defaultValue="">
          <C.Label>City</C.Label>
          <C.Input />
          <C.Popover>
            <C.ListBox>
              <C.ListBoxItem id="paris">Paris</C.ListBoxItem>
              <C.ListBoxItem id="rome">Rome</C.ListBoxItem>
            </C.ListBox>
          </C.Popover>
        </C.Combobox>
        <C.Autocomplete id="framework" defaultValue="">
          <C.Label htmlFor="framework">Framework</C.Label>
          <C.Input aria-label="Framework" />
          <C.Menu>
            <C.MenuItem id="react">React</C.MenuItem>
            <C.MenuItem id="svelte">Svelte</C.MenuItem>
          </C.Menu>
        </C.Autocomplete>
        <C.ListBox aria-label="Libraries" defaultValue="react">
          <C.Collection
            items={[
              { id: "react", label: "React" },
              { id: "vue", label: "Vue" },
            ]}
          >
            {(item) => (
              <C.ListBoxItem id={item.id} key={item.id}>
                {item.label}
              </C.ListBoxItem>
            )}
          </C.Collection>
        </C.ListBox>
        <C.Menu aria-label="File actions">
          <C.MenuSection aria-label="File actions">
            <C.MenuItem id="copy">Copy</C.MenuItem>
            <C.MenuItem id="paste">Paste</C.MenuItem>
          </C.MenuSection>
        </C.Menu>
        <C.MenuTrigger>Open menu</C.MenuTrigger>
        <C.SubmenuTrigger>Open submenu</C.SubmenuTrigger>
        <C.ContextMenu>
          <C.ContextMenuTrigger>Repository row</C.ContextMenuTrigger>
          <C.ContextMenuContent>
            <C.MenuItem id="rename">Rename</C.MenuItem>
            <C.MenuItem id="delete">Delete</C.MenuItem>
          </C.ContextMenuContent>
        </C.ContextMenu>
        <C.Feed aria-label="Activity feed">
          <C.FeedArticle id="build">Build passed</C.FeedArticle>
          <C.FeedArticle id="deploy">Deploy started</C.FeedArticle>
        </C.Feed>
        <select aria-label="Native framework">
          <C.SelectOption value="solid" label="Solid">
            Solid
          </C.SelectOption>
          <C.ComboboxOption value="qwik" label="Qwik">
            Qwik
          </C.ComboboxOption>
        </select>
      </section>
    ),
  },
  {
    name: "date, time, calendar, and picker controls",
    components: [
      "Calendar",
      "CalendarCell",
      "CalendarGrid",
      "CalendarGridBody",
      "CalendarGridHeader",
      "CalendarHeaderCell",
      "DateField",
      "DateInput",
      "DatePicker",
      "DateRangePicker",
      "DateSegment",
      "RangeCalendar",
      "TimeField",
    ],
    render: () => (
      <section aria-label="Date and time controls">
        <C.DateField id="start-date" defaultValue="2026-04-30" aria-label="Start date">
          <C.DateInput aria-label="Start date segments">
            <C.DateSegment part="month" aria-label="Month" />
            <C.DateSegment part="literal">/</C.DateSegment>
            <C.DateSegment part="day" aria-label="Day" />
            <C.DateSegment part="literal">/</C.DateSegment>
            <C.DateSegment part="year" aria-label="Year" />
          </C.DateInput>
        </C.DateField>
        <C.TimeField id="start-time" defaultValue="09:30:00" aria-label="Start time">
          <C.DateInput aria-label="Start time segments">
            <C.DateSegment part="hour" aria-label="Hour" />
            <C.DateSegment part="literal">:</C.DateSegment>
            <C.DateSegment part="minute" aria-label="Minute" />
          </C.DateInput>
        </C.TimeField>
        <C.Calendar aria-label="Release calendar" focusedValue="2026-04-30" />
        <C.RangeCalendar aria-label="Sprint calendar" focusedValue="2026-04-30" />
        <C.CalendarGrid aria-label="Standalone calendar grid">
          <C.CalendarGridHeader>
            <tr>
              <C.CalendarHeaderCell>Thu</C.CalendarHeaderCell>
            </tr>
          </C.CalendarGridHeader>
          <C.CalendarGridBody>
            <tr>
              <C.CalendarCell date="2026-04-30" selected>
                30
              </C.CalendarCell>
            </tr>
          </C.CalendarGridBody>
        </C.CalendarGrid>
        <C.DatePicker id="release-picker" defaultValue="2026-04-30">
          <C.Button>Open release date</C.Button>
          <C.Popover aria-label="Release date calendar">
            <C.Calendar focusedValue="2026-04-30" />
          </C.Popover>
        </C.DatePicker>
        <C.DateRangePicker id="sprint-picker">
          <C.Button>Open sprint dates</C.Button>
          <C.Popover aria-label="Sprint date range calendar">
            <C.RangeCalendar focusedValue="2026-04-30" />
          </C.Popover>
        </C.DateRangePicker>
      </section>
    ),
  },
  {
    name: "color controls",
    components: [
      "ColorArea",
      "ColorField",
      "ColorPicker",
      "ColorSlider",
      "ColorSwatch",
      "ColorSwatchPicker",
      "ColorSwatchPickerItem",
      "ColorThumb",
      "ColorWheel",
      "ColorWheelTrack",
    ],
    render: () => (
      <section aria-label="Color controls">
        <C.ColorField defaultValue="#ff0000">
          <C.ColorSlider channel="hue" aria-label="Hue" />
          <C.ColorArea aria-label="Saturation and brightness">
            <C.ColorThumb />
          </C.ColorArea>
          <C.ColorWheel aria-label="Hue wheel">
            <C.ColorWheelTrack />
          </C.ColorWheel>
          <C.ColorSwatchPicker aria-label="Saved colors">
            <C.ColorSwatchPickerItem color="#ff0000" aria-label="Red">
              <C.ColorSwatch />
            </C.ColorSwatchPickerItem>
            <C.ColorSwatchPickerItem color="#00ff00" aria-label="Green">
              <C.ColorSwatch color="#00ff00" />
            </C.ColorSwatchPickerItem>
          </C.ColorSwatchPicker>
        </C.ColorField>
        <C.ColorPicker defaultValue="#0000ff" aria-label="Accent color">
          <C.ColorSlider channel="alpha" aria-label="Alpha" />
        </C.ColorPicker>
      </section>
    ),
  },
  {
    name: "disclosure, tabs, and breadcrumbs",
    components: [
      "Accordion",
      "AccordionHeader",
      "AccordionItem",
      "AccordionPanel",
      "AccordionTrigger",
      "BreadcrumbLink",
      "Breadcrumbs",
      "Disclosure",
      "DisclosureGroup",
      "DisclosurePanel",
      "DisclosureTrigger",
      "Tab",
      "TabList",
      "TabPanel",
      "TabPanels",
      "Tabs",
      "Menubar",
      "MenubarContent",
      "MenubarItem",
      "MenubarMenu",
      "MenubarTrigger",
    ],
    render: () => (
      <section aria-label="Disclosure controls">
        <C.Breadcrumbs>
          <ol>
            <li>
              <C.BreadcrumbLink href="/">Home</C.BreadcrumbLink>
            </li>
            <li>
              <C.BreadcrumbLink href="/docs" current>
                Docs
              </C.BreadcrumbLink>
            </li>
          </ol>
        </C.Breadcrumbs>
        <C.DisclosureGroup>
          <C.Disclosure id="faq" defaultOpen>
            <C.DisclosureTrigger>Details</C.DisclosureTrigger>
            <C.DisclosurePanel>Panel content</C.DisclosurePanel>
          </C.Disclosure>
        </C.DisclosureGroup>
        <C.Accordion defaultValue="install">
          <C.AccordionItem value="install">
            <C.AccordionHeader>
              <C.AccordionTrigger>Install</C.AccordionTrigger>
            </C.AccordionHeader>
            <C.AccordionPanel>Install with pnpm.</C.AccordionPanel>
          </C.AccordionItem>
          <C.AccordionItem value="style">
            <C.AccordionHeader>
              <C.AccordionTrigger>Style</C.AccordionTrigger>
            </C.AccordionHeader>
            <C.AccordionPanel>Use data attributes.</C.AccordionPanel>
          </C.AccordionItem>
        </C.Accordion>
        <C.Tabs defaultValue="overview">
          <C.TabList>
            <C.Tab tabKey="overview">Overview</C.Tab>
            <C.Tab tabKey="settings">Settings</C.Tab>
          </C.TabList>
          <C.TabPanels>
            <C.TabPanel tabKey="overview">Overview panel</C.TabPanel>
            <C.TabPanel tabKey="settings">Settings panel</C.TabPanel>
          </C.TabPanels>
        </C.Tabs>
        <C.Menubar aria-label="Application menu">
          <C.MenubarMenu id="file">
            <C.MenubarTrigger>File</C.MenubarTrigger>
            <C.MenubarContent>
              <C.MenuItem id="new">New</C.MenuItem>
              <C.MenuItem id="open">Open</C.MenuItem>
            </C.MenubarContent>
          </C.MenubarMenu>
          <C.MenubarItem id="help">Help</C.MenubarItem>
        </C.Menubar>
      </section>
    ),
  },
  {
    name: "overlays and tooltip primitives",
    components: [
      "Dialog",
      "DialogTrigger",
      "AlertDialog",
      "Modal",
      "ModalOverlay",
      "OverlayArrow",
      "Popover",
      "Tooltip",
      "TooltipTrigger",
    ],
    render: () => (
      <section aria-label="Overlay controls">
        <C.Dialog aria-label="Inline dialog">Dialog body</C.Dialog>
        <C.DialogTrigger>Dialog trigger</C.DialogTrigger>
        <C.AlertDialog aria-label="Confirmation" aria-describedby="alert-dialog-body">
          <p id="alert-dialog-body">Alert dialog body</p>
        </C.AlertDialog>
        <C.Modal defaultOpen aria-label="Modal dialog">
          Modal body
        </C.Modal>
        <C.ModalOverlay>Overlay backdrop</C.ModalOverlay>
        <C.Popover defaultOpen aria-label="Standalone popover">
          <C.OverlayArrow />
          Popover body
        </C.Popover>
        <C.TooltipTrigger>Tooltip trigger</C.TooltipTrigger>
        <C.Tooltip>Helpful hint</C.Tooltip>
      </section>
    ),
  },
  {
    name: "tables, grids, and trees",
    components: [
      "Cell",
      "Column",
      "ColumnResizer",
      "GridList",
      "GridListHeader",
      "GridListItem",
      "GridListLoadMoreItem",
      "GridListSection",
      "ResizableTableContainer",
      "Row",
      "Table",
      "TableBody",
      "TableHeader",
      "TableLoadMoreItem",
      "Tree",
      "TreeHeader",
      "TreeItem",
      "TreeItemContent",
      "TreeLoadMoreItem",
      "TreeSection",
    ],
    render: () => (
      <section aria-label="Structured data">
        <C.ResizableTableContainer>
          <C.Table>
            <C.TableHeader>
              <C.Row>
                <C.Column>
                  Name
                  <C.ColumnResizer aria-label="Resize name column" />
                </C.Column>
                <C.Column>Status</C.Column>
              </C.Row>
            </C.TableHeader>
            <C.TableBody>
              <C.Row>
                <C.Cell>Ada</C.Cell>
                <C.Cell>Ready</C.Cell>
              </C.Row>
              <C.TableLoadMoreItem>
                <C.Cell colSpan={2}>Load more rows</C.Cell>
              </C.TableLoadMoreItem>
            </C.TableBody>
          </C.Table>
        </C.ResizableTableContainer>
        <C.GridList aria-label="Packages">
          <C.GridListSection aria-label="Published packages">
            <C.GridListItem>
              <C.GridListHeader>Core</C.GridListHeader>
              <span role="gridcell">Stable</span>
            </C.GridListItem>
            <C.GridListLoadMoreItem>
              <span role="gridcell">Load more packages</span>
            </C.GridListLoadMoreItem>
          </C.GridListSection>
        </C.GridList>
        <C.Tree aria-label="Documentation tree">
          <C.TreeHeader>Documentation</C.TreeHeader>
          <C.TreeSection>
            <C.TreeItem>
              <C.TreeItemContent>Components</C.TreeItemContent>
            </C.TreeItem>
            <C.TreeLoadMoreItem>Load more pages</C.TreeLoadMoreItem>
          </C.TreeSection>
        </C.Tree>
      </section>
    ),
  },
  {
    name: "tags, toolbar, file, utility, and toast primitives",
    components: [
      "DefaultCollectionRenderer",
      "Carousel",
      "CarouselIndicator",
      "CarouselIndicatorGroup",
      "CarouselNext",
      "CarouselPrevious",
      "CarouselRotationControl",
      "CarouselSlide",
      "CarouselViewport",
      "DropIndicator",
      "DropZone",
      "FileTrigger",
      "Focusable",
      "Header",
      "Keyboard",
      "Pressable",
      "SelectionIndicator",
      "SharedElement",
      "SharedElementTransition",
      "SliderOutput",
      "SliderThumb",
      "SliderTrack",
      "Tag",
      "TagGroup",
      "TagList",
      "ToggleButtonGroup",
      "Toolbar",
      "UNSTABLE_Toast",
      "UNSTABLE_ToastContent",
      "UNSTABLE_ToastList",
      "UNSTABLE_ToastRegion",
      "VisuallyHidden",
      "WindowSplitter",
    ],
    render: () => (
      <section aria-label="Utility primitives">
        <C.Header>App header</C.Header>
        <C.Toolbar aria-label="Formatting toolbar">
          <C.Button>Bold</C.Button>
          <C.Button>Italic</C.Button>
        </C.Toolbar>
        <C.ToggleButtonGroup aria-label="Alignment">
          <C.ToggleButton>Left</C.ToggleButton>
          <C.ToggleButton>Right</C.ToggleButton>
        </C.ToggleButtonGroup>
        <C.Carousel aria-label="Featured releases" defaultValue="one">
          <C.CarouselViewport>
            <C.CarouselSlide id="one">Release one</C.CarouselSlide>
            <C.CarouselSlide id="two">Release two</C.CarouselSlide>
          </C.CarouselViewport>
          <C.CarouselPrevious aria-label="Previous slide">Previous</C.CarouselPrevious>
          <C.CarouselNext aria-label="Next slide">Next</C.CarouselNext>
          <C.CarouselRotationControl>Rotate slides</C.CarouselRotationControl>
          <C.CarouselIndicatorGroup aria-label="Slides">
            <C.CarouselIndicator id="one">One</C.CarouselIndicator>
            <C.CarouselIndicator id="two">Two</C.CarouselIndicator>
          </C.CarouselIndicatorGroup>
        </C.Carousel>
        <C.TagGroup aria-label="Selected filters">
          <C.TagList>
            <C.Tag id="a11y">Accessibility</C.Tag>
            <C.Tag id="headless">Headless</C.Tag>
          </C.TagList>
        </C.TagGroup>
        <C.DropZone aria-label="Upload files">
          Drop files here
          <C.DropIndicator>Drop target</C.DropIndicator>
        </C.DropZone>
        <C.FileTrigger inputProps={{ name: "attachment" }}>Choose file</C.FileTrigger>
        <C.Focusable tabIndex={0}>Focusable region</C.Focusable>
        <section id="preview-pane">Preview pane</section>
        <C.WindowSplitter aria-label="Resize preview" controls="preview-pane" />
        <C.Pressable>Pressable region</C.Pressable>
        <C.SharedElementTransition>
          <C.SharedElement>Shared element</C.SharedElement>
        </C.SharedElementTransition>
        <C.SelectionIndicator>Selected</C.SelectionIndicator>
        <C.SliderTrack>
          <C.SliderThumb
            aria-label="Volume thumb"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
          />
        </C.SliderTrack>
        <C.SliderOutput htmlFor="volume">50</C.SliderOutput>
        <C.Keyboard>Ctrl K</C.Keyboard>
        <C.VisuallyHidden>Screen reader only text</C.VisuallyHidden>
        <C.UNSTABLE_ToastRegion aria-label="Notifications">
          <C.UNSTABLE_ToastList aria-label="Notification list">
            <C.UNSTABLE_Toast>
              <C.UNSTABLE_ToastContent>Saved successfully</C.UNSTABLE_ToastContent>
            </C.UNSTABLE_Toast>
          </C.UNSTABLE_ToastList>
        </C.UNSTABLE_ToastRegion>
      </section>
    ),
  },
];

describe("headless WCAG accessibility fixtures", () => {
  it("cover every public component export", () => {
    const publicComponents = discoverPublicComponents();
    const coveredComponents = new Set(fixtures.flatMap((fixture) => fixture.components));

    expect([...publicComponents].filter((component) => !coveredComponents.has(component))).toEqual(
      [],
    );
    expect([...coveredComponents].filter((component) => !publicComponents.has(component))).toEqual(
      [],
    );
  });

  it.each(fixtures)("$name has no automated WCAG A/AA axe violations", async (fixture) => {
    const { unmount } = render(fixture.render());
    try {
      const result = await axe.run(document.body, axeOptions);
      expect(result.violations, formatAxeViolations(result.violations)).toEqual([]);
    } finally {
      unmount();
    }
  });
});

function formatAxeViolations(violations: axe.Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `    ${node.target.join(", ")}\n${node.html}`);
      return `${violation.id}: ${violation.help}\n${nodes.join("\n")}`;
    })
    .join("\n\n");
}

function discoverPublicComponents(): Set<string> {
  const sourceDir = dirname(fileURLToPath(import.meta.url));
  const seen = new Set<string>();
  const components = new Set<string>();

  function resolveSource(specifier: string): string {
    const base = resolve(sourceDir, specifier.replace(/^\.\//, ""));
    let candidates = [base, `${base}.tsx`, `${base}.ts`];
    if (specifier.endsWith(".js")) {
      candidates = [base.replace(/\.js$/, ".tsx"), base.replace(/\.js$/, ".ts")];
    }
    const path = candidates.find((candidate) => existsSync(candidate));
    if (!path) throw new Error(`Unable to resolve export source '${specifier}'`);
    return path;
  }

  function visit(specifier: string): void {
    const path = resolveSource(specifier);
    if (seen.has(path)) return;
    seen.add(path);

    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/export \* from "(.+)"/g)) {
      const exportSpecifier = match[1]!;
      if (exportSpecifier.startsWith("./components/")) {
        components.add(exportSpecifier.split("/").at(-1)!.replace(/\.js$/, ""));
      } else {
        visit(exportSpecifier);
      }
    }

    for (const match of source.matchAll(/export \{\s*([A-Z][A-Za-z0-9_]*)/g)) {
      components.add(match[1]!);
    }
  }

  visit("./index.ts");
  return components;
}
