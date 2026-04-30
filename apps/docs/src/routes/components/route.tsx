import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Menu as MenuIcon, Moon, Search, Sun, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import type { HighlighterCore } from "shiki/core";
import {
  componentGroups,
  accessibilityAuditDimensionLabels,
  accessibilityAuditDimensions,
  accessibilityAuditStatusLabels,
  accessibilitySupportStatement,
  accessibilityTraceabilityMatrix,
  manualAuditScripts,
  pages,
  type ComponentDoc,
  type ComponentPage,
  type Theme,
} from "../../docs-data.js";
import {
  Autocomplete,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  BreadcrumbLink,
  Breadcrumbs,
  Button,
  Cell,
  Checkbox,
  CheckboxGroup,
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  ColorWheel,
  ColorWheelTrack,
  Collection,
  CollectionBuilder,
  Column,
  Combobox,
  ComboBoxValue,
  ComboboxOption,
  Description,
  Dialog,
  DialogTrigger,
  DropIndicator,
  DropZone,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
  FieldError,
  Fieldset,
  FileTrigger,
  Focusable,
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  Group,
  Header,
  Heading,
  Input,
  Keyboard,
  Label,
  Legend,
  Link as CompLink,
  ListBox,
  ListBoxLoadMoreItem,
  ListBoxItem,
  ListBoxSection,
  Menu as MenuPrimitive,
  MenuItem,
  MenuSection,
  Meter,
  Modal,
  ModalOverlay,
  NumberField,
  OverlayArrow,
  Popover,
  ProgressBar,
  Pressable,
  RangeCalendar,
  Radio,
  RadioGroup,
  Row,
  SearchField,
  Select,
  SelectOption,
  SelectValue,
  Separator,
  SharedElement,
  SharedElementTransition,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableHeader,
  Tag,
  TagGroup,
  TagList,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextArea,
  TextField,
  TimeField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tree,
  TreeHeader,
  TreeItem,
  TreeItemContent,
  TreeSection,
  UNSTABLE_Toast,
  UNSTABLE_ToastContent,
  UNSTABLE_ToastList,
  UNSTABLE_ToastRegion,
  VisuallyHidden,
  DateField,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateSegment,
  Tooltip,
  TooltipTrigger,
} from "@comp0/react";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function displayGroupTitle(group: string) {
  if (group === "Drag and drop") return "Drag & drop";
  if (group === "Status and motion") return "Status & motion";
  if (group === "Text and layout") return "Text & layout";
  return group;
}

const groups = componentGroups.map((group) => group.title);
const pageSections = ["Examples", "Value", "API", "Styling", "Accessibility", "SSR", "Related"];
let highlighterPromise: Promise<HighlighterCore> | undefined;

function pagePath(slug: string) {
  return `/components/${slug}`;
}

function getHighlighter() {
  highlighterPromise ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("shiki/langs/tsx.mjs"),
    import("shiki/themes/github-dark.mjs"),
    import("shiki/themes/github-light.mjs"),
  ]).then(([core, engine, tsxLanguage, githubDarkTheme, githubLightTheme]) =>
    core.createHighlighterCore({
      engine: engine.createJavaScriptRegexEngine(),
      langs: [tsxLanguage.default],
      themes: [githubLightTheme.default, githubDarkTheme.default],
    }),
  );

  return highlighterPromise;
}

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function CodeBlock({
  code,
  theme,
  surface = "default",
}: {
  code: string;
  theme: Theme;
  surface?: "default" | "inverted";
}) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((highlighter) =>
        highlighter.codeToHtml(code, {
          lang: "tsx",
          theme: theme === "dark" ? "github-dark" : "github-light",
        }),
      )
      .then((nextHtml) => {
        if (!cancelled) setHtml(nextHtml);
      });

    return () => {
      cancelled = true;
    };
  }, [code, theme]);

  if (!html) {
    return (
      <pre
        className={cx(
          `
            min-w-0 max-w-full overflow-x-auto rounded-md border p-4 text-base/7
            sm:text-sm/6
          `,
          surface === "inverted" && "border-white/10 bg-neutral-900 text-zinc-100",
          surface !== "inverted" &&
            `
              border-zinc-950/10 bg-neutral-50 text-zinc-800
              dark:border-white/10 dark:bg-neutral-950 dark:text-zinc-100
            `,
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  let backgroundColor = "#ffffff";
  if (surface === "inverted") {
    backgroundColor = "#171717";
  } else if (theme === "dark") {
    backgroundColor = "#0a0a0a";
  }

  return (
    <div
      className={cx(
        "code-block w-full min-w-0 max-w-full overflow-x-auto rounded-md border",
        surface === "inverted" && "border-white/10 bg-neutral-900",
        surface !== "inverted" &&
          `
            border-zinc-950/10 bg-white
            dark:border-white/10 dark:bg-neutral-950
          `,
      )}
      style={{ backgroundColor }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function groupExampleCode(page: ComponentPage) {
  if (page.docs.length === 1) return page.docs[0]!.examples.uncontrolled;

  if (page.title === "DisclosureGroup") {
    return `<DisclosureGroup>\n  <Disclosure defaultOpen>\n    <DisclosureTrigger>Installation</DisclosureTrigger>\n    <DisclosurePanel>Install with pnpm.</DisclosurePanel>\n  </Disclosure>\n  <Disclosure>\n    <DisclosureTrigger>Styling</DisclosureTrigger>\n    <DisclosurePanel>Style from data attributes.</DisclosurePanel>\n  </Disclosure>\n</DisclosureGroup>`;
  }

  if (page.title === "CheckboxGroup") {
    return `<CheckboxGroup value={channels} onChange={setChannels}>\n  <Legend>Channels</Legend>\n  <Checkbox value="email"><span aria-hidden />Email</Checkbox>\n  <Checkbox value="sms"><span aria-hidden />SMS</Checkbox>\n</CheckboxGroup>`;
  }

  if (page.title === "RadioGroup") {
    return `<RadioGroup value={density} onChange={setDensity}>\n  <Legend>Density</Legend>\n  <Radio value="compact"><span aria-hidden />Compact</Radio>\n  <Radio value="comfortable"><span aria-hidden />Comfortable</Radio>\n</RadioGroup>`;
  }

  if (page.title === "Select") {
    return `<Select value={choice} onChange={setChoice}>\n  <Label>Plan</Label>\n  <Button><SelectValue placeholder="Choose a plan" /></Button>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n      <ListBoxItem id="pro">Pro</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`;
  }

  if (page.title === "TextField" || page.title === "Input" || page.title === "TextArea") {
    return `<form action="/api/profile">\n  <TextField invalid={invalid} required>\n    <Label>Email</Label>\n    <Input name="email" defaultValue="headless" />\n    <Description>Used for account notifications.</Description>\n    <FieldError>Enter a valid email.</FieldError>\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`;
  }

  if (page.title === "Table") {
    return `<Table>\n  <TableHeader>\n    <Row><Column>Component</Column><Column>Status</Column></Row>\n  </TableHeader>\n  <TableBody>\n    <Row selected><Cell>Button</Cell><Cell>Stable</Cell></Row>\n  </TableBody>\n</Table>`;
  }

  const [first, second] = page.docs;
  return `<${first?.name ?? "Group"}>\n  ${second ? `<${second.name}>Content</${second.name}>` : "Content"}\n</${first?.name ?? "Group"}>`;
}

function relatedPagesFor(page: ComponentPage) {
  const siblings = pages.filter((item) => item.group === page.group && item.slug !== page.slug);
  return (siblings.length ? siblings : pages.filter((item) => item.slug !== page.slug)).slice(0, 6);
}

function stylingExample(doc: ComponentDoc) {
  const selectors = doc.data
    .slice(0, 4)
    .map((attribute) => `    ${attribute}:bg-cyan-50 ${attribute}:text-cyan-950`)
    .join("\n");

  return `<${doc.name}\n  className={\`\n    rounded-md px-3 py-2 text-zinc-700\n    focus-visible:outline-2 focus-visible:outline-sky-500\n${selectors || "    data-disabled:opacity-50"}\n    dark:text-zinc-200 dark:data-selected:bg-cyan-500/10\n  \`}\n/>`;
}

function exampleTabsFor(page: ComponentPage) {
  const primary = page.docs[0]!;
  return [
    {
      name: "Basic",
      code: groupExampleCode(page),
    },
    {
      name: "Controlled",
      code: primary.examples.controlled,
    },
    {
      name: "Tailwind",
      code: stylingExample(primary),
    },
  ];
}

function ExampleShowcase({ page, theme }: { page: ComponentPage; theme: Theme }) {
  const tabs = exampleTabsFor(page);
  const [selectedTab, setSelectedTab] = useState(tabs[0]!.name);
  const currentTab = tabs.find((tab) => tab.name === selectedTab) ?? tabs[0]!;

  return (
    <section
      className="grid min-w-0 gap-6 rounded-md bg-neutral-950 p-4 text-white ring-1 ring-zinc-950/10 dark:bg-neutral-900 dark:ring-white/10 sm:p-6"
      aria-labelledby="examples-heading"
      id="examples"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              className={cx(
                `
                  rounded-md px-3 py-1.5 text-base/7 text-zinc-400
                  hover:bg-white/10 hover:text-white
                  sm:text-sm/6
                `,
                selectedTab === tab.name && "bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-300/25",
              )}
              type="button"
              onClick={() => setSelectedTab(tab.name)}
              key={tab.name}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <p className="hidden text-sm/6 text-zinc-400 sm:block">Live preview</p>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
        <div className="grid min-h-64 place-items-start rounded-md bg-white p-5 text-zinc-950 ring-1 ring-white/10 dark:bg-neutral-950 dark:text-white">
          <GroupPlayground page={page} />
        </div>
        <CodeBlock
          code={currentTab.code}
          theme={theme === "light" ? "dark" : theme}
          surface="inverted"
        />
      </div>
    </section>
  );
}

function ValueSection({ page }: { page: ComponentPage }) {
  return (
    <div className="grid gap-8">
      {page.docs.map((doc) => (
        <article className="grid gap-4" key={doc.name}>
          <div className="grid gap-2">
            <Heading
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
              level={3}
            >
              {doc.name}
            </Heading>
            <Text className="max-w-[72ch] text-base/7 text-pretty text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
              {doc.summary}
            </Text>
          </div>
          <div className="grid gap-3 border-y border-zinc-950/10 py-4 dark:border-white/10">
            <p className="max-w-[72ch] text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
              {doc.nativeMarkup}
            </p>
            <div className="flex flex-wrap gap-2">
              {doc.data.slice(0, 6).map((attribute) => (
                <code
                  className="rounded-md border border-zinc-950/10 bg-white px-2.5 py-1 font-mono text-base/7 text-zinc-700 dark:border-white/10 dark:bg-neutral-900 dark:text-zinc-300 sm:text-sm/6"
                  key={attribute}
                >
                  {attribute}
                </code>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function PageIntro({ page }: { page: ComponentPage }) {
  return (
    <section className="grid min-w-0 gap-4 pb-2 pt-2">
      <p className="text-base/7 font-medium text-cyan-800 dark:text-cyan-300 sm:text-sm/6">
        {displayGroupTitle(page.group)}
      </p>
      <Heading
        className="max-w-[16ch] text-4xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white sm:text-5xl"
        level={1}
      >
        {page.title}
      </Heading>
      <Text className="max-w-[66ch] text-lg/8 text-pretty text-zinc-700 dark:text-zinc-300 sm:text-base/7">
        {page.summary}
      </Text>
      <Text className="max-w-[72ch] text-base/7 text-pretty text-zinc-500 dark:text-zinc-400 sm:text-sm/6">
        {page.nativeMarkup}
      </Text>
    </section>
  );
}

function RelatedPages({ page }: { page: ComponentPage }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2" role="list">
      {relatedPagesFor(page).map((relatedPage) => (
        <li key={relatedPage.slug}>
          <NavLink
            className="grid min-h-6 gap-1 border-t border-zinc-950/10 py-3 text-base/7 hover:border-cyan-700 dark:border-white/10 dark:hover:border-cyan-400 sm:text-sm/6"
            preventScrollReset
            to={pagePath(relatedPage.slug)}
          >
            <span className="font-medium text-zinc-950 dark:text-white">{relatedPage.title}</span>
            <span className="text-zinc-600 dark:text-zinc-400">{relatedPage.summary}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function GroupPlayground({ page }: { page: ComponentPage }) {
  const [choice, setChoice] = useState("basic");
  const [channels, setChannels] = useState(["email"]);
  const [density, setDensity] = useState("comfortable");
  const [volume, setVolume] = useState(42);

  if (page.title === "DisclosureGroup") {
    return (
      <DisclosureGroup className="grid max-w-md divide-y divide-zinc-950/10 rounded-md border border-zinc-950/10 dark:divide-white/10 dark:border-white/10">
        {[
          ["Installation", "Install the package and compose only the slots you need."],
          ["Styling", "Style the group, trigger, and panel from data attributes."],
          ["Accessibility", "Each section uses native details and summary behavior."],
        ].map(([title, body], index) => (
          <Disclosure className="p-4" defaultOpen={index === 0} key={title}>
            <DisclosureTrigger className="cursor-pointer text-base/7 font-medium text-zinc-950 marker:text-zinc-400 dark:text-white sm:text-sm/6">
              {title}
            </DisclosureTrigger>
            <DisclosurePanel className="pt-3 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
              {body}
            </DisclosurePanel>
          </Disclosure>
        ))}
      </DisclosureGroup>
    );
  }

  if (page.title === "CheckboxGroup") {
    return (
      <CheckboxGroup className="grid gap-2" value={channels} onChange={setChannels} name="channels">
        <Legend className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Channels
        </Legend>
        {["email", "sms"].map((value) => (
          <Checkbox
            className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
            value={value}
            key={value}
          >
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded border border-zinc-950/20 bg-white group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
            >
              <span className="size-2 rounded-sm bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
            </span>
            {value === "email" ? "Email" : "SMS"}
          </Checkbox>
        ))}
      </CheckboxGroup>
    );
  }

  if (page.title === "RadioGroup") {
    return (
      <RadioGroup className="grid gap-2" value={density} onChange={setDensity} name="density">
        <Legend className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Density
        </Legend>
        {["compact", "comfortable"].map((value) => (
          <Radio
            className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
            value={value}
            key={value}
          >
            <span
              aria-hidden="true"
              className="grid size-5 place-items-center rounded-full border border-zinc-950/20 bg-white group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
            >
              <span className="size-2 rounded-full bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
            </span>
            {value === "compact" ? "Compact" : "Comfortable"}
          </Radio>
        ))}
      </RadioGroup>
    );
  }

  if (page.title === "Switch") {
    return <Playground name="Switch" />;
  }

  if (page.title === "Select") {
    return (
      <Select className="grid max-w-xs gap-2" value={choice} onChange={setChoice}>
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Plan
        </Label>
        <Button className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 data-open:border-cyan-600 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6">
          <SelectValue placeholder="Choose a plan" />
        </Button>
        <Popover className="rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-950">
          <ListBox className="grid gap-1">
            <ListBoxItem
              className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 sm:text-sm/6"
              id="basic"
            >
              Basic
            </ListBoxItem>
            <ListBoxItem
              className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 sm:text-sm/6"
              id="pro"
            >
              Pro
            </ListBoxItem>
          </ListBox>
        </Popover>
      </Select>
    );
  }

  if (page.title === "Slider") {
    return (
      <div className="grid max-w-sm gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Volume
          </Label>
          <SliderOutput className="text-base/7 tabular-nums text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
            {volume}%
          </SliderOutput>
        </div>
        <SliderTrack className="relative grid h-6 items-center">
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-700 dark:bg-cyan-400"
              style={{ width: `${volume}%` }}
            />
          </div>
          <SliderThumb
            className="absolute size-5 rounded-full border border-zinc-950/10 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950"
            aria-label="Volume"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={volume}
            style={{ left: `calc(${volume}% - 10px)` }}
          />
        </SliderTrack>
        <Slider
          aria-label="Volume"
          className="w-full accent-cyan-700"
          value={volume}
          onChange={setVolume}
        />
      </div>
    );
  }

  const firstRenderable = page.docs.find((doc) => doc.name !== "DisclosurePanel") ?? page.docs[0];
  return firstRenderable ? <Playground name={firstRenderable.name} /> : null;
}

function Playground({ name }: { name: string }) {
  const [pressed, setPressed] = useState(false);
  const [choice, setChoice] = useState("react");
  const [checked, setChecked] = useState(false);
  const [channels, setChannels] = useState(["email"]);
  const [density, setDensity] = useState("comfortable");
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(42);
  const [searchValue, setSearchValue] = useState("");
  const [numberValue, setNumberValue] = useState(3);
  const [droppedFiles, setDroppedFiles] = useState<string[]>([]);
  const [tags, setTags] = useState(["Accessible", "Headless", "React 19"]);

  if (name === "Button") {
    return (
      <Button className="rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:text-sm/6">
        Save changes
      </Button>
    );
  }

  if (name === "ToggleButton") {
    return (
      <ToggleButton
        className="rounded-md border border-zinc-950/10 px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:border-white/10 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
        selected={pressed}
        onChange={setPressed}
      >
        {({ selected }: { selected: boolean }) => (selected ? "Pinned" : "Pin item")}
      </ToggleButton>
    );
  }

  if (name === "ToggleButtonGroup") {
    return (
      <ToggleButtonGroup
        className="inline-flex rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-900"
        aria-label="Text alignment"
      >
        {["Left", "Center", "Right"].map((alignment) => (
          <ToggleButton
            className="rounded-sm px-3 py-2 text-base/7 text-zinc-700 data-selected:bg-cyan-50 data-selected:text-cyan-950 focus-visible:outline-2 focus-visible:outline-sky-500 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
            selected={density === alignment.toLowerCase()}
            onChange={() => setDensity(alignment.toLowerCase())}
            key={alignment}
          >
            {alignment}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  if (name === "Link") {
    return (
      <CompLink
        className="text-base/7 font-medium text-cyan-800 underline decoration-cyan-700/30 underline-offset-4 dark:text-cyan-300 sm:text-sm/6"
        href="#api"
      >
        Jump to API
      </CompLink>
    );
  }

  if (name === "Text") {
    return (
      <Text className="max-w-[56ch] text-base/7 text-pretty text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
        A text primitive keeps copy semantic without adding wrapper DOM.
      </Text>
    );
  }

  if (name === "Heading") {
    return (
      <div className="grid gap-2">
        <Heading
          className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
          level={2}
        >
          Account settings
        </Heading>
        <Heading
          className="text-xl font-medium tracking-tight text-zinc-800 dark:text-zinc-200"
          level={3}
        >
          Notifications
        </Heading>
      </div>
    );
  }

  if (name === "Separator") {
    return (
      <div className="flex items-center gap-4 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
        <span>General</span>
        <Separator className="h-px flex-1 border-0 bg-zinc-950/10 dark:bg-white/10" />
        <span>Advanced</span>
      </div>
    );
  }

  if (name === "Group") {
    return (
      <Group
        className="inline-flex rounded-md border border-zinc-950/10 p-1 dark:border-white/10"
        aria-label="Text formatting"
      >
        {["B", "I", "U"].map((item) => (
          <Button
            className="rounded px-3 py-1.5 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
            key={item}
          >
            {item}
          </Button>
        ))}
      </Group>
    );
  }

  if (name === "Header") {
    return (
      <Header className="grid gap-1 border-b border-zinc-950/10 pb-4 dark:border-white/10">
        <Heading className="text-lg font-semibold text-zinc-950 dark:text-white" level={2}>
          Component reference
        </Heading>
        <Text className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
          A semantic header can frame a page, section, dialog, or card.
        </Text>
      </Header>
    );
  }

  if (name === "Keyboard") {
    return (
      <p className="text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
        Press{" "}
        <Keyboard className="rounded border border-zinc-950/10 bg-neutral-50 px-1.5 py-0.5 font-mono text-zinc-950 dark:border-white/10 dark:bg-white/10 dark:text-white">
          Enter
        </Keyboard>{" "}
        to activate the focused item.
      </p>
    );
  }

  if (name === "Toolbar") {
    return (
      <Toolbar
        className="inline-flex flex-wrap items-center gap-1 rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-900"
        aria-label="Editor formatting"
      >
        {["Bold", "Italic", "Code"].map((item) => (
          <ToggleButton
            className="rounded px-3 py-2 text-base/7 text-zinc-700 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
            key={item}
          >
            {item}
          </ToggleButton>
        ))}
        <Separator
          className="mx-1 h-6 w-px border-0 bg-zinc-950/10 dark:bg-white/10"
          orientation="vertical"
        />
        <Button className="rounded px-3 py-2 text-base/7 text-zinc-700 dark:text-zinc-200 sm:text-sm/6">
          Insert
        </Button>
      </Toolbar>
    );
  }

  if (name === "Pressable") {
    return (
      <Pressable
        className="inline-flex rounded-md border border-zinc-950/10 px-3 py-2 text-base/7 text-zinc-800 data-pressed:bg-cyan-50 data-pressed:text-cyan-950 dark:border-white/10 dark:text-zinc-200 sm:text-sm/6"
        tabIndex={0}
      >
        Press target
      </Pressable>
    );
  }

  if (name === "Focusable") {
    return (
      <Focusable
        className="rounded-md border border-zinc-950/10 px-3 py-2 text-base/7 text-zinc-800 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:border-white/10 dark:text-zinc-200 sm:text-sm/6"
        tabIndex={0}
      >
        Focusable region
      </Focusable>
    );
  }

  if (name === "VisuallyHidden") {
    return (
      <div className="grid gap-2">
        <Button className="rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6">
          <VisuallyHidden>Save notification settings</VisuallyHidden>
          <span aria-hidden="true">Save</span>
        </Button>
        <Text className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
          The accessible label is present while the extra text stays visually hidden.
        </Text>
      </div>
    );
  }

  if (name === "Label") {
    return (
      <TextField className="grid max-w-xs gap-2" id="label-demo">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Workspace
        </Label>
        <Input
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
          name="workspace"
          defaultValue="Design system"
        />
      </TextField>
    );
  }

  if (name === "Description") {
    return (
      <TextField className="grid max-w-sm gap-2" id="description-demo">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Release notes
        </Label>
        <Input
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
          name="release"
        />
        <Description className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
          Shown to everyone with access to this package.
        </Description>
      </TextField>
    );
  }

  if (name === "FieldError") {
    return (
      <TextField className="grid max-w-sm gap-2" id="error-demo" aria-invalid>
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Package name
        </Label>
        <Input
          className="rounded-md border border-red-500/40 bg-white px-3 py-2 text-base/7 dark:bg-neutral-950 sm:text-sm/6"
          name="package-name"
        />
        <FieldError className="text-base/7 text-red-700 dark:text-red-300 sm:text-sm/6">
          Use lowercase letters and hyphens.
        </FieldError>
      </TextField>
    );
  }

  if (name === "Fieldset" || name === "Legend") {
    return (
      <Fieldset className="grid max-w-sm gap-3 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <Legend className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Delivery
        </Legend>
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
      </Fieldset>
    );
  }

  if (name === "TextField" || name === "Input") {
    return (
      <form className="grid max-w-xs gap-2" action="/api/settings">
        <TextField className="grid gap-2" id="project">
          <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Project
          </Label>
          <Input
            className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 outline-cyan-600 -outline-offset-1 focus-visible:outline-2 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
            name="project"
            defaultValue="Headless docs"
          />
          <Description className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
            Native submission works when wrapped in `form` and supplied with `name`.
          </Description>
        </TextField>
        <Button
          type="submit"
          className="justify-self-start rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6"
        >
          Save
        </Button>
      </form>
    );
  }

  if (name === "TextArea") {
    return (
      <form className="grid max-w-sm gap-2" action="/api/notes">
        <TextField className="grid gap-2" id="notes">
          <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Notes
          </Label>
          <TextArea
            className="min-h-28 rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 outline-cyan-600 -outline-offset-1 focus-visible:outline-2 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
            name="notes"
            defaultValue="Keep wrapper DOM minimal."
          />
        </TextField>
        <Button
          type="submit"
          className="justify-self-start rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6"
        >
          Save notes
        </Button>
      </form>
    );
  }

  if (name === "SearchField") {
    return (
      <SearchField className="grid max-w-xs gap-2" id="search-demo">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Search components
        </Label>
        <Input
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
          name="query"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
        />
      </SearchField>
    );
  }

  if (name === "Checkbox") {
    return (
      <Checkbox
        className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
        selected={checked}
        onChange={setChecked}
      >
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded border border-zinc-950/20 bg-white group-data-focused:outline-2 group-data-focused:outline-cyan-600 group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
        >
          <span className="size-2 rounded-sm bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
        </span>
        Email updates
      </Checkbox>
    );
  }

  if (name === "CheckboxGroup") {
    return (
      <CheckboxGroup className="grid gap-2" value={channels} onChange={setChannels} name="channels">
        <Legend className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Channels
        </Legend>
        <Checkbox
          className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
          value="email"
        >
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded border border-zinc-950/20 bg-white group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
          >
            <span className="size-2 rounded-sm bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
          </span>
          Email
        </Checkbox>
        <Checkbox
          className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
          value="sms"
        >
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded border border-zinc-950/20 bg-white group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
          >
            <span className="size-2 rounded-sm bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
          </span>
          SMS
        </Checkbox>
      </CheckboxGroup>
    );
  }

  if (name === "RadioGroup" || name === "Radio") {
    return (
      <RadioGroup className="grid gap-2" value={density} onChange={setDensity} name="density">
        <Legend className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Density
        </Legend>
        <Radio
          className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
          value="compact"
        >
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full border border-zinc-950/20 bg-white group-data-focused:outline-2 group-data-focused:outline-cyan-600 group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
          >
            <span className="size-2 rounded-full bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
          </span>
          Compact
        </Radio>
        <Radio
          className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
          value="comfortable"
        >
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full border border-zinc-950/20 bg-white group-data-focused:outline-2 group-data-focused:outline-cyan-600 group-data-selected:border-cyan-700 group-data-selected:bg-cyan-700 dark:border-white/15 dark:bg-white/5 dark:group-data-selected:border-cyan-400 dark:group-data-selected:bg-cyan-400 sm:size-4"
          >
            <span className="size-2 rounded-full bg-white opacity-0 group-data-selected:opacity-100 dark:bg-neutral-950" />
          </span>
          Comfortable
        </Radio>
      </RadioGroup>
    );
  }

  if (name === "Switch") {
    return (
      <Switch
        className="group inline-flex items-center gap-3 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6"
        selected={checked}
        onChange={setChecked}
        inputProps={{ "aria-label": "Publish docs" }}
      >
        <span
          aria-hidden="true"
          className="relative inline-flex w-11 rounded-full bg-neutral-200 p-0.5 transition-colors group-data-focused:outline-2 group-data-focused:outline-cyan-600 group-data-selected:bg-cyan-700 dark:bg-white/10 dark:group-data-selected:bg-cyan-400 sm:w-9"
        >
          <span className="aspect-square w-1/2 rounded-full bg-white shadow-xs transition-transform group-data-selected:translate-x-full" />
        </span>
        Publish docs
      </Switch>
    );
  }

  if (name === "NumberField") {
    return (
      <NumberField
        className="grid max-w-xs gap-2"
        defaultValue={numberValue}
        max={10}
        min={0}
        onChange={setNumberValue}
      >
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Retries
        </Label>
        <Input
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6"
          type="number"
        />
      </NumberField>
    );
  }

  if (name === "Slider") {
    return (
      <Slider
        aria-label="Volume"
        className="w-full max-w-sm accent-cyan-700"
        value={volume}
        onChange={setVolume}
      />
    );
  }

  if (name === "ProgressBar") {
    return (
      <ProgressBar
        className="grid w-full max-w-sm gap-2"
        aria-label="Build progress"
        value={volume}
      >
        {({ percentage }: { percentage: number | undefined }) => (
          <>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-cyan-700 dark:bg-cyan-400"
                style={{ width: `${percentage ?? 0}%` }}
              />
            </div>
            <span className="text-base/7 tabular-nums text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
              {Math.round(percentage ?? 0)}%
            </span>
          </>
        )}
      </ProgressBar>
    );
  }

  if (name === "Meter") {
    return (
      <Meter className="w-full max-w-sm accent-cyan-700" value={0.72}>
        72%
      </Meter>
    );
  }

  if (name === "Calendar") {
    return (
      <Calendar className="grid max-w-sm gap-3 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <Header className="flex items-center justify-between">
          <Heading className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            April 2026
          </Heading>
          <Text className="text-base/7 text-zinc-500 dark:text-zinc-400 sm:text-sm/6">Today</Text>
        </Header>
        <CalendarGrid className="w-full border-separate border-spacing-1 text-center text-base/7 sm:text-sm/6">
          <CalendarGridHeader>
            <tr>
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                <CalendarHeaderCell
                  className="size-8 font-medium text-zinc-500 dark:text-zinc-400"
                  key={day}
                >
                  {day}
                </CalendarHeaderCell>
              ))}
            </tr>
          </CalendarGridHeader>
          <CalendarGridBody>
            <tr>
              {[20, 21, 22, 23, 24, 25, 26].map((day) => (
                <CalendarCell
                  className="size-8 rounded data-selected:bg-cyan-700 data-selected:text-white dark:text-zinc-200"
                  selected={day === 23}
                  key={day}
                >
                  {day}
                </CalendarCell>
              ))}
            </tr>
          </CalendarGridBody>
        </CalendarGrid>
      </Calendar>
    );
  }

  if (name === "RangeCalendar") {
    return (
      <RangeCalendar className="grid max-w-sm gap-3 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <Header className="flex items-center justify-between">
          <Heading className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Sprint range
          </Heading>
          <Text className="text-base/7 text-zinc-500 dark:text-zinc-400 sm:text-sm/6">
            Apr 20-26
          </Text>
        </Header>
        <CalendarGrid className="w-full border-separate border-spacing-1 text-center text-base/7 sm:text-sm/6">
          <CalendarGridBody>
            <tr>
              {[20, 21, 22, 23, 24, 25, 26].map((day) => (
                <CalendarCell
                  className="size-8 rounded data-selected:bg-cyan-700 data-selected:text-white dark:text-zinc-200"
                  selected={day >= 22 && day <= 25}
                  key={day}
                >
                  {day}
                </CalendarCell>
              ))}
            </tr>
          </CalendarGridBody>
        </CalendarGrid>
      </RangeCalendar>
    );
  }

  if (name === "DateField" || name === "TimeField") {
    const FieldComponent = name === "DateField" ? DateField : TimeField;
    return (
      <FieldComponent className="grid max-w-xs gap-2">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          {name === "DateField" ? "Release date" : "Release time"}
        </Label>
        <DateInput className="inline-flex rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-950">
          {(name === "DateField" ? ["04", "27", "2026"] : ["09", "30", "AM"]).map(
            (segment, index) => (
              <DateSegment
                className="rounded px-2 py-1 text-base/7 text-zinc-800 focus-visible:outline-2 focus-visible:outline-cyan-600 dark:text-zinc-200 sm:text-sm/6"
                aria-label={`Segment ${index + 1}`}
                tabIndex={0}
                key={`${segment}-${index}`}
              >
                {segment}
              </DateSegment>
            ),
          )}
        </DateInput>
      </FieldComponent>
    );
  }

  if (name === "DatePicker") {
    return (
      <DatePicker className="grid max-w-xs gap-2">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Release date
        </Label>
        <Button className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6">
          Apr 27, 2026
        </Button>
        <Popover className="rounded-md border border-zinc-950/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
          <Playground name="Calendar" />
        </Popover>
      </DatePicker>
    );
  }

  if (name === "DateRangePicker") {
    return (
      <DateRangePicker className="grid max-w-xs gap-2">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Sprint dates
        </Label>
        <Group className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Button className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6">
            Apr 22
          </Button>
          <span className="text-zinc-500 dark:text-zinc-400">to</span>
          <Button className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6">
            Apr 25
          </Button>
        </Group>
        <Popover className="rounded-md border border-zinc-950/10 bg-white p-3 dark:border-white/10 dark:bg-neutral-950">
          <Playground name="RangeCalendar" />
        </Popover>
      </DateRangePicker>
    );
  }

  if (name === "Disclosure") {
    return (
      <Disclosure
        className="max-w-md rounded-md border border-zinc-950/10 p-4 dark:border-white/10"
        defaultOpen
      >
        <DisclosureTrigger className="cursor-pointer text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Release details
        </DisclosureTrigger>
        <DisclosurePanel className="pt-3 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
          Built on details and summary.
        </DisclosurePanel>
      </Disclosure>
    );
  }

  if (name === "DisclosureGroup") {
    return (
      <DisclosureGroup className="grid max-w-md divide-y divide-zinc-950/10 rounded-md border border-zinc-950/10 dark:divide-white/10 dark:border-white/10">
        {[
          ["Installation", "Install the package and compose the slots you need."],
          ["Styling", "Use data attributes or :has() selectors for visual state."],
          ["Server rendering", "Disclosure markup serializes without DOM reads."],
        ].map(([title, body], index) => (
          <Disclosure className="p-4" defaultOpen={index === 0} key={title}>
            <DisclosureTrigger className="cursor-pointer text-base/7 font-medium text-zinc-950 marker:text-zinc-400 dark:text-white sm:text-sm/6">
              {title}
            </DisclosureTrigger>
            <DisclosurePanel className="pt-3 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
              {body}
            </DisclosurePanel>
          </Disclosure>
        ))}
      </DisclosureGroup>
    );
  }

  if (name === "DisclosurePanel") {
    return (
      <Disclosure
        className="max-w-md rounded-md border border-zinc-950/10 p-4 dark:border-white/10"
        defaultOpen
      >
        <DisclosureTrigger className="cursor-pointer text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Release details
        </DisclosureTrigger>
        <DisclosurePanel className="mt-3 rounded-md bg-neutral-50 p-3 text-base/7 text-zinc-700 data-open:border-zinc-950/10 dark:bg-white/5 dark:text-zinc-300 sm:text-sm/6">
          The panel is just a headless content region. Style it directly or from parent disclosure
          state.
        </DisclosurePanel>
      </Disclosure>
    );
  }

  if (name === "Tabs") {
    return (
      <Tabs defaultValue="api">
        <TabList
          className="flex gap-1 overflow-x-auto border-b border-zinc-950/10 dark:border-white/10"
          aria-label="Docs sections"
        >
          <Tab
            className="px-3 py-2 text-base/7 data-selected:border-b-2 data-selected:border-cyan-600 dark:text-zinc-200 dark:data-selected:border-cyan-400 sm:text-sm/6"
            tabKey="api"
          >
            API
          </Tab>
          <Tab
            className="px-3 py-2 text-base/7 data-selected:border-b-2 data-selected:border-cyan-600 dark:text-zinc-200 dark:data-selected:border-cyan-400 sm:text-sm/6"
            tabKey="a11y"
          >
            Accessibility
          </Tab>
        </TabList>
        <TabPanel
          className="pt-4 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6"
          tabKey="api"
        >
          Props and state attributes stay visible.
        </TabPanel>
        <TabPanel
          className="pt-4 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6"
          tabKey="a11y"
        >
          Arrow keys move across tabs.
        </TabPanel>
      </Tabs>
    );
  }

  if (name === "Breadcrumbs") {
    return (
      <Breadcrumbs className="text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
        <ol className="flex gap-2" role="list">
          <li>
            <BreadcrumbLink href="#">Docs</BreadcrumbLink>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <BreadcrumbLink href="#" current>
              Components
            </BreadcrumbLink>
          </li>
        </ol>
      </Breadcrumbs>
    );
  }

  if (name === "Collection") {
    const items = [
      { id: "alpha", label: "Alpha" },
      { id: "beta", label: "Beta" },
    ];
    return (
      <CollectionBuilder className="grid max-w-xs gap-2">
        <ListBox
          className="grid gap-1"
          aria-label="Collection examples"
          value={choice}
          onChange={setChoice}
        >
          <Collection items={items}>
            {(item) => (
              <ListBoxItem
                className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
                id={item.id}
                key={item.id}
              >
                {item.label}
              </ListBoxItem>
            )}
          </Collection>
        </ListBox>
      </CollectionBuilder>
    );
  }

  if (name === "ListBox" || name === "ListBoxItem") {
    return (
      <ListBox
        className="grid max-w-xs gap-1"
        aria-label="Libraries"
        value={choice}
        onChange={setChoice}
      >
        <ListBoxSection
          aria-label="Libraries"
          className="grid gap-1 border-b border-zinc-950/10 pb-1 dark:border-white/10"
        >
          <ListBoxItem
            className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
            id="react"
          >
            React
          </ListBoxItem>
          <ListBoxItem
            className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
            id="dom"
          >
            DOM
          </ListBoxItem>
        </ListBoxSection>
        <ListBoxItem
          className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 dark:data-selected:text-cyan-200 sm:text-sm/6"
          id="compiler"
        >
          Compiler
        </ListBoxItem>
        <ListBoxLoadMoreItem className="px-3 py-2 text-base/7 text-zinc-500 dark:text-zinc-400 sm:text-sm/6">
          More items load here
        </ListBoxLoadMoreItem>
      </ListBox>
    );
  }

  if (name === "Menu" || name === "MenuItem" || name === "MenuSection") {
    return (
      <div className="grid max-w-xs gap-3">
        <Button
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6"
          command="toggle-popover"
          commandfor="docs-actions-menu"
          id="docs-actions-button"
        >
          Actions
        </Button>
        <Popover
          anchor="docs-actions-button"
          className="rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-950"
          id="docs-actions-menu"
          popover="auto"
        >
          <MenuPrimitive className="grid gap-1" aria-label="Actions">
            <MenuSection aria-label="Actions">
              <MenuItem
                className="rounded px-3 py-2 text-base/7 dark:text-zinc-200 sm:text-sm/6"
                id="rename"
              >
                Rename
              </MenuItem>
              <MenuItem
                className="rounded px-3 py-2 text-base/7 dark:text-zinc-200 sm:text-sm/6"
                id="duplicate"
              >
                Duplicate
              </MenuItem>
            </MenuSection>
          </MenuPrimitive>
        </Popover>
      </div>
    );
  }

  if (name === "GridList") {
    return (
      <GridList
        className="grid max-w-sm gap-1 rounded-md border border-zinc-950/10 p-1 dark:border-white/10"
        aria-label="Packages"
      >
        <GridListSection aria-label="Published packages">
          <GridListItem className="grid grid-cols-[1fr_auto] items-center rounded px-3 py-2 text-base/7 data-selected:bg-cyan-50 dark:text-zinc-200 sm:text-sm/6">
            <GridListHeader className="font-medium text-zinc-950 dark:text-white">
              @comp0/react
            </GridListHeader>
            <span className="text-zinc-500 dark:text-zinc-400">Stable</span>
          </GridListItem>
          <GridListItem className="grid grid-cols-[1fr_auto] items-center rounded px-3 py-2 text-base/7 dark:text-zinc-200 sm:text-sm/6">
            <GridListHeader className="font-medium text-zinc-950 dark:text-white">
              @comp0/core
            </GridListHeader>
            <span className="text-zinc-500 dark:text-zinc-400">Stable</span>
          </GridListItem>
        </GridListSection>
      </GridList>
    );
  }

  if (name === "TagGroup") {
    return (
      <TagGroup className="grid max-w-sm gap-2" aria-label="Selected filters">
        <TagList
          className="flex flex-wrap gap-2"
          onRemove={(id) => setTags((current) => current.filter((tag) => tag !== id))}
        >
          {tags.map((tag) => (
            <Tag
              className="rounded-full border border-zinc-950/10 px-3 py-1.5 text-base/7 text-zinc-800 data-focused:border-cyan-700 data-focused:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 dark:border-white/10 dark:text-zinc-200 dark:data-focused:bg-cyan-500/10 sm:text-sm/6"
              id={tag}
              key={tag}
            >
              {tag}
            </Tag>
          ))}
        </TagList>
      </TagGroup>
    );
  }

  if (name === "Tree") {
    return (
      <Tree
        className="grid max-w-sm gap-1 rounded-md border border-zinc-950/10 p-2 dark:border-white/10"
        aria-label="Docs"
      >
        <TreeSection className="grid gap-1" aria-label="Docs">
          <TreeHeader className="px-2 py-1 text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Components
          </TreeHeader>
          <TreeItem className="rounded px-2 py-1 text-base/7 text-zinc-800 data-selected:bg-cyan-50 dark:text-zinc-200 sm:text-sm/6">
            <TreeItemContent>Button</TreeItemContent>
          </TreeItem>
          <TreeItem className="rounded px-2 py-1 text-base/7 text-zinc-800 dark:text-zinc-200 sm:text-sm/6">
            <TreeItemContent>Select</TreeItemContent>
          </TreeItem>
        </TreeSection>
      </Tree>
    );
  }

  if (name === "Select" || name === "SelectValue") {
    return (
      <div className="grid max-w-xs gap-3">
        <Select className="grid gap-2" value={choice} onChange={setChoice}>
          <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
            Package
          </Label>
          <Button className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-left text-base/7 data-open:border-cyan-600 dark:border-white/10 dark:bg-neutral-950 sm:text-sm/6">
            <SelectValue placeholder="Choose package" />
          </Button>
          <Popover className="rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-950">
            <ListBox className="grid gap-1">
              <ListBoxItem
                className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 sm:text-sm/6"
                id="react"
              >
                React
              </ListBoxItem>
              <ListBoxItem
                className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 sm:text-sm/6"
                id="dom"
              >
                DOM
              </ListBoxItem>
            </ListBox>
          </Popover>
        </Select>
        <select
          className="rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6"
          aria-label="Native plan"
        >
          <SelectOption value="native-basic">Native basic</SelectOption>
          <SelectOption value="native-pro">Native pro</SelectOption>
        </select>
      </div>
    );
  }

  if (name === "Combobox") {
    return (
      <Combobox className="grid max-w-xs gap-2" defaultValue="React" defaultSelectedValue="react">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Framework
        </Label>
        <Group className="flex overflow-hidden rounded-md border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-neutral-950">
          <Autocomplete className="contents">
            <Input
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base/7 outline-none data-focus-visible:ring-2 data-focus-visible:ring-cyan-600 dark:text-white sm:text-sm/6"
              aria-label="Framework"
              list="framework-options"
            />
            <datalist id="framework-options">
              <ComboboxOption value="React">React</ComboboxOption>
              <ComboboxOption value="Preact">Preact</ComboboxOption>
              <ComboboxOption value="Solid">Solid</ComboboxOption>
            </datalist>
          </Autocomplete>
          <Button className="border-l border-zinc-950/10 px-3 text-base/7 data-open:bg-cyan-50 dark:border-white/10 dark:text-zinc-200 dark:data-open:bg-cyan-500/10 sm:text-sm/6">
            Show
          </Button>
        </Group>
        <ComboBoxValue className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
          Selected value is mirrored into a hidden form field.
        </ComboBoxValue>
        <Description className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
          Type a value or choose from the list.
        </Description>
        <Popover className="rounded-md border border-zinc-950/10 bg-white p-1 dark:border-white/10 dark:bg-neutral-950">
          <ListBox className="grid gap-1">
            <ListBoxItem
              className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 sm:text-sm/6"
              id="react"
            >
              React
            </ListBoxItem>
            <ListBoxItem
              className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 sm:text-sm/6"
              id="preact"
            >
              Preact
            </ListBoxItem>
            <ListBoxItem
              className="rounded-md px-3 py-2 text-base/7 data-selected:bg-cyan-50 data-selected:text-cyan-950 dark:text-zinc-200 dark:data-selected:bg-cyan-500/10 sm:text-sm/6"
              id="solid"
            >
              Solid
            </ListBoxItem>
          </ListBox>
        </Popover>
      </Combobox>
    );
  }

  if (
    name === "ColorField" ||
    name === "ColorSlider" ||
    name === "ColorArea" ||
    name === "ColorWheel" ||
    name === "ColorSwatchPicker"
  ) {
    return (
      <ColorField className="grid max-w-sm gap-3" defaultValue="#0891b2" name="accent">
        <Label className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Accent color
        </Label>
        <div className="flex items-center gap-3">
          <ColorSwatch className="size-10 rounded-md border border-zinc-950/10 dark:border-white/10" />
          <Input
            className="min-w-0 rounded-md border border-zinc-950/10 bg-white px-3 py-2 text-base/7 dark:border-white/10 dark:bg-neutral-950 dark:text-white sm:text-sm/6"
            aria-label="Accent hex value"
            defaultValue="#0891b2"
          />
        </div>
        <ColorArea className="relative h-28 rounded-md bg-cyan-600" aria-label="Saturation">
          <ColorThumb className="absolute left-1/2 top-1/2 size-4 rounded-full border-2 border-white shadow" />
        </ColorArea>
        <ColorSlider
          className="h-3 rounded-full bg-[linear-gradient(to_right,red,yellow,lime,cyan,blue,magenta,red)]"
          aria-label="Hue"
          channel="hue"
        />
        <ColorWheel
          className="relative size-24 rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]"
          aria-label="Hue wheel"
        >
          <ColorWheelTrack />
          <ColorThumb className="absolute left-1/2 top-1 size-4 rounded-full border-2 border-white shadow" />
        </ColorWheel>
        <ColorSwatchPicker className="flex gap-2" aria-label="Saved colors">
          {[
            ["#0891b2", "Cyan"],
            ["#16a34a", "Green"],
            ["#dc2626", "Red"],
          ].map(([color, label]) => (
            <ColorSwatchPickerItem
              className="rounded-md border border-zinc-950/10 p-1 data-selected:ring-2 data-selected:ring-cyan-700 dark:border-white/10"
              aria-label={label}
              color={color}
              key={color}
            />
          ))}
        </ColorSwatchPicker>
      </ColorField>
    );
  }

  if (name === "DropZone" || name === "FileTrigger") {
    return (
      <div className="grid max-w-sm gap-3">
        <DropZone
          className="grid min-h-28 place-items-center rounded-md border border-dashed border-zinc-950/20 bg-neutral-50 p-6 text-center text-base/7 text-zinc-700 data-drop-target:border-cyan-700 data-drop-target:bg-cyan-50 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300 sm:text-sm/6"
          aria-label="Upload files"
          onDrop={(event) =>
            setDroppedFiles(Array.from(event.dataTransfer.files, (file) => file.name))
          }
        >
          {droppedFiles.length ? droppedFiles.join(", ") : "Drop files here"}
        </DropZone>
        <div className="flex flex-wrap items-center gap-2">
          <FileTrigger className="inline-flex cursor-pointer rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6">
            Choose file
          </FileTrigger>
          <DropIndicator className="rounded border border-zinc-950/10 px-2 py-1 text-base/7 text-zinc-600 dark:border-white/10 dark:text-zinc-400 sm:text-sm/6">
            Insert before row 2
          </DropIndicator>
        </div>
      </div>
    );
  }

  if (name === "SharedElementTransition") {
    return (
      <SharedElementTransition className="grid max-w-sm gap-3 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <SharedElement className="size-14 rounded-md bg-cyan-700 dark:bg-cyan-400" />
        <Text className="text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
          Shared elements expose stable slots for view-transition styling.
        </Text>
      </SharedElementTransition>
    );
  }

  if (name === "UNSTABLE_ToastRegion") {
    return (
      <UNSTABLE_ToastRegion className="grid max-w-sm gap-2" aria-label="Notifications">
        <UNSTABLE_ToastList className="grid gap-2">
          <UNSTABLE_Toast className="rounded-md border border-zinc-950/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-neutral-950">
            <UNSTABLE_ToastContent className="grid gap-1">
              <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
                Published
              </p>
              <p className="text-base/7 text-zinc-600 dark:text-zinc-400 sm:text-sm/6">
                The component docs were updated.
              </p>
            </UNSTABLE_ToastContent>
          </UNSTABLE_Toast>
        </UNSTABLE_ToastList>
      </UNSTABLE_ToastRegion>
    );
  }

  if (name === "Dialog") {
    return (
      <DialogTrigger className="grid max-w-sm gap-3">
        <Button className="justify-self-start rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6">
          Open dialog
        </Button>
        <Dialog
          className="rounded-md border border-zinc-950/10 p-4 text-base/7 dark:border-white/10 sm:text-sm/6"
          aria-label="Preferences"
        >
          Dialog content with an accessible name.
        </Dialog>
      </DialogTrigger>
    );
  }

  if (name === "Modal") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="rounded-md bg-cyan-700 px-3 py-2 text-base/7 text-white sm:text-sm/6"
          onClick={() => setOpen(true)}
        >
          Open modal
        </Button>
        <Modal open={open} onChange={setOpen}>
          <ModalOverlay className="rounded-md bg-zinc-950/5 p-2 dark:bg-white/5" />
          <Dialog
            className="grid gap-3 rounded-md border border-zinc-950/10 bg-white p-4 text-zinc-950 dark:border-white/10 dark:bg-neutral-950 dark:text-white"
            aria-label="Preferences"
          >
            <p>Preferences</p>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Dialog>
        </Modal>
      </div>
    );
  }

  if (name === "Popover") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="rounded-md border border-zinc-950/10 px-3 py-2 text-base/7 dark:border-white/10 sm:text-sm/6"
          onClick={() => setOpen((value) => !value)}
        >
          Toggle popover
        </Button>
        <Popover
          className="rounded-md border border-zinc-950/10 p-3 text-base/7 dark:border-white/10 sm:text-sm/6"
          open={open}
        >
          <OverlayArrow className="mb-2 size-3 rotate-45 border-l border-t border-zinc-950/10 bg-white dark:border-white/10 dark:bg-neutral-950" />
          Popover content
        </Popover>
      </div>
    );
  }

  if (name === "Tooltip") {
    return (
      <TooltipTrigger className="inline-flex items-center gap-2">
        <Button className="rounded-md border border-zinc-950/10 px-3 py-2 text-base/7 dark:border-white/10 sm:text-sm/6">
          Save
        </Button>
        <Tooltip className="rounded bg-zinc-950 px-2 py-1 text-base/7 text-white dark:bg-white dark:text-zinc-950 sm:text-sm/6">
          Saved
        </Tooltip>
      </TooltipTrigger>
    );
  }

  if (name === "TableHeader") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableHeader>
          <Row className="border-b border-zinc-950/10 dark:border-white/10">
            <Column className="whitespace-nowrap py-2 pr-4 font-medium">Component</Column>
          </Row>
        </TableHeader>
      </Table>
    );
  }

  if (name === "Column") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableHeader>
          <Row className="border-b border-zinc-950/10 dark:border-white/10">
            <Column className="whitespace-nowrap py-2 pr-4 font-medium">Name</Column>
            <Column className="whitespace-nowrap py-2 font-medium">Type</Column>
          </Row>
        </TableHeader>
      </Table>
    );
  }

  if (name === "TableBody") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableHeader>
          <Row className="border-b border-zinc-950/10 dark:border-white/10">
            <Column className="whitespace-nowrap py-2 pr-4 font-medium">Component</Column>
          </Row>
        </TableHeader>
        <TableBody>
          <Row className="border-b border-zinc-950/5 dark:border-white/10">
            <Cell className="py-2 pr-4">Button</Cell>
          </Row>
        </TableBody>
      </Table>
    );
  }

  if (name === "Row") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableBody>
          <Row className="border-b border-zinc-950/5 dark:border-white/10" selected>
            <Cell className="py-2 pr-4">Button</Cell>
          </Row>
        </TableBody>
      </Table>
    );
  }

  if (name === "Cell") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableBody>
          <Row className="border-b border-zinc-950/5 dark:border-white/10">
            <Cell className="py-2 pr-4">Button</Cell>
          </Row>
        </TableBody>
      </Table>
    );
  }

  if (name === "Table") {
    return (
      <Table className="w-full text-left text-base/7 sm:text-sm/6">
        <TableHeader>
          <Row className="border-b border-zinc-950/10 dark:border-white/10">
            <Column className="whitespace-nowrap py-2 pr-4 font-medium">Component</Column>
            <Column className="whitespace-nowrap py-2 font-medium">State</Column>
          </Row>
        </TableHeader>
        <TableBody>
          <Row className="border-b border-zinc-950/5 dark:border-white/10" selected>
            <Cell className="py-2 pr-4">Button</Cell>
            <Cell className="py-2">Stable</Cell>
          </Row>
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-base/7 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 sm:text-sm/6">
      Missing playground example for {name}.
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      className="scroll-mt-24 border-t border-zinc-950/10 pt-10 dark:border-white/10"
      id={id}
    >
      <div className="grid min-w-0 gap-5">
        <Heading
          className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
          level={2}
        >
          {title}
        </Heading>
        {children}
      </div>
    </section>
  );
}

function ComponentApiTable({ doc }: { doc: ComponentDoc }) {
  return (
    <article className="grid gap-4">
      <Heading
        className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
        level={3}
      >
        {doc.name}
      </Heading>
      <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
          <Table className="w-full text-left text-base/7 sm:text-sm/6">
            <TableHeader>
              <Row className="border-b border-zinc-950/10 dark:border-white/10">
                <Column className="whitespace-nowrap py-2 pr-4 font-medium">Prop</Column>
                <Column className="whitespace-nowrap px-4 py-2 font-medium">Type</Column>
                <Column className="whitespace-nowrap py-2 pl-4 font-medium">Purpose</Column>
              </Row>
            </TableHeader>
            <TableBody>
              {doc.props.map(([prop, type, purpose]) => (
                <Row className="border-b border-zinc-950/5 dark:border-white/10" key={prop}>
                  <Cell className="py-2 pr-4 font-mono">{prop}</Cell>
                  <Cell className="px-4 py-2 font-mono text-zinc-700 dark:text-zinc-300">
                    {type}
                  </Cell>
                  <Cell className="py-2 pl-4 text-zinc-700 dark:text-zinc-300">{purpose}</Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </article>
  );
}

function ComponentAccessibilityTable({ doc }: { doc: ComponentDoc }) {
  const auditEntry = accessibilityTraceabilityMatrix.find((entry) => entry.component === doc.name);

  return (
    <article className="grid gap-4">
      <Heading
        className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
        level={3}
      >
        {doc.name}
      </Heading>
      <div className="grid gap-2 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Accessibility Contract
        </p>
        <ul className="grid gap-2 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
          {doc.accessibility.map((item) => (
            <li className="grid grid-cols-[auto_1fr] gap-2" key={item}>
              <span aria-hidden="true">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
          <Table className="w-full text-left text-base/7 sm:text-sm/6">
            <TableHeader>
              <Row className="border-b border-zinc-950/10 dark:border-white/10">
                <Column className="whitespace-nowrap py-2 pr-4 font-medium">Key</Column>
                <Column className="whitespace-nowrap py-2 pl-4 font-medium">Behavior</Column>
              </Row>
            </TableHeader>
            <TableBody>
              {doc.keyboard.map(([key, behavior]) => (
                <Row className="border-b border-zinc-950/5 dark:border-white/10" key={key}>
                  <Cell className="py-2 pr-4 font-mono">{key}</Cell>
                  <Cell className="py-2 pl-4 text-zinc-700 dark:text-zinc-300">{behavior}</Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          References
        </p>
        <ul className="flex flex-wrap gap-2" role="list">
          {doc.references.map((reference) => (
            <li key={reference.href}>
              <a
                className="inline-flex min-h-6 items-center rounded-md border border-zinc-950/10 px-2.5 py-1 text-base/7 text-cyan-800 underline decoration-cyan-700/30 underline-offset-4 hover:bg-cyan-50 dark:border-white/10 dark:text-cyan-300 dark:hover:bg-cyan-500/10 sm:text-sm/6"
                href={reference.href}
              >
                {reference.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {auditEntry && (
        <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6 lg:px-8">
            <Table className="w-full text-left text-base/7 sm:text-sm/6">
              <TableHeader>
                <Row className="border-b border-zinc-950/10 dark:border-white/10">
                  <Column className="whitespace-nowrap py-2 pr-4 font-medium">
                    Audit dimension
                  </Column>
                  <Column className="whitespace-nowrap py-2 pl-4 font-medium">Status</Column>
                </Row>
              </TableHeader>
              <TableBody>
                {accessibilityAuditDimensions.map((dimension) => (
                  <Row className="border-b border-zinc-950/5 dark:border-white/10" key={dimension}>
                    <Cell className="py-2 pr-4">
                      {accessibilityAuditDimensionLabels[dimension]}
                    </Cell>
                    <Cell className="py-2 pl-4 text-zinc-700 dark:text-zinc-300">
                      {accessibilityAuditStatusLabels[auditEntry.statuses[dimension]]}
                    </Cell>
                  </Row>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </article>
  );
}

function AccessibilitySupportSection() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2 rounded-md border border-zinc-950/10 p-4 dark:border-white/10">
        <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          WCAG 2.2 AA support target
        </p>
        <ul className="grid gap-2 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
          {accessibilitySupportStatement.map((item) => (
            <li className="grid grid-cols-[auto_1fr] gap-2" key={item}>
              <span aria-hidden="true">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4">
        <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
          Manual audit scripts
        </p>
        {manualAuditScripts.map((script) => (
          <article
            className="grid gap-2 border-t border-zinc-950/10 pt-4 dark:border-white/10"
            key={script.title}
          >
            <Heading
              className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6"
              level={3}
            >
              {script.title}
            </Heading>
            <ul className="grid gap-2 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
              {script.items.map((item) => (
                <li className="grid grid-cols-[auto_1fr] gap-2" key={item}>
                  <span aria-hidden="true">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function AppNav({
  pagesToShow,
  onNavigate,
  query,
  setQuery,
  showSearch = true,
}: {
  pagesToShow: ComponentPage[];
  onNavigate?: () => void;
  query: string;
  setQuery: (query: string) => void;
  showSearch?: boolean;
}) {
  return (
    <nav
      className="flex h-full flex-col gap-5 border-r border-zinc-950/10 bg-white px-4 py-5 dark:border-white/10 dark:bg-neutral-950"
      aria-label="Components"
    >
      {showSearch && (
        <div className="grid gap-2">
          <label
            className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6"
            htmlFor="component-search"
          >
            Search
          </label>
          <SearchFieldShell
            id="component-search"
            query={query}
            setQuery={setQuery}
            name="component-search"
          />
        </div>
      )}
      <div className="-mx-1 min-h-0 overflow-y-auto px-1">
        {groups.map((group) => {
          const items = pagesToShow.filter((page) => page.group === group);
          if (!items.length) return null;

          return (
            <section className="py-3" key={group}>
              <h2 className="px-3 text-base/7 font-medium text-zinc-500 dark:text-zinc-400 sm:text-sm/6">
                {displayGroupTitle(group)}
              </h2>
              <ul className="mt-2 grid gap-1" role="list">
                {items.map((page) => (
                  <li key={page.slug}>
                    <NavLink
                      className={({ isActive }) =>
                        cx(
                          `
                            grid min-h-6 gap-1 rounded-md px-3 py-2 text-left
                            text-base/7 text-zinc-700
                            hover:bg-neutral-100
                            dark:text-zinc-300
                            dark:hover:bg-white/5
                            sm:text-sm/6
                          `,
                          isActive &&
                            `
                              bg-cyan-50/80 text-cyan-950 ring-1
                              ring-cyan-700/15
                              dark:bg-cyan-400/10 dark:text-cyan-200
                              dark:ring-cyan-300/15
                            `,
                        )
                      }
                      preventScrollReset
                      to={pagePath(page.slug)}
                      onClick={onNavigate}
                    >
                      <span>{page.title}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </nav>
  );
}

function SearchFieldShell({
  id,
  query,
  setQuery,
  name,
}: {
  id?: string;
  query: string;
  setQuery: (query: string) => void;
  name: string;
}) {
  return (
    <span className="grid grid-cols-[1fr_--spacing(10)]">
      <input
        id={id}
        className="col-span-full row-start-1 rounded-md border border-zinc-950/10 bg-white px-3 py-2 pr-10 text-base/7 outline-cyan-600 -outline-offset-1 placeholder:text-zinc-400 focus-visible:outline-2 dark:border-white/10 dark:bg-neutral-900 dark:text-white sm:text-sm/6"
        name={name}
        placeholder="Search components"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <Search
        className="pointer-events-none col-start-2 row-start-1 size-5 self-center justify-self-center text-zinc-500 sm:size-4"
        aria-hidden="true"
      />
    </span>
  );
}

function DocsHeader({
  current,
  query,
  setQuery,
  theme,
  toggleTheme,
  openMobileNav,
}: {
  current: ComponentPage;
  query: string;
  setQuery: (query: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  openMobileNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-950/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-neutral-950/95">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          className="relative rounded-md border border-zinc-950/10 p-2 text-zinc-950 dark:border-white/10 dark:text-white lg:hidden"
          type="button"
          onClick={openMobileNav}
          aria-label="Open navigation"
        >
          <span
            className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2"
            aria-hidden="true"
          />
          <MenuIcon className="size-5" aria-hidden="true" />
        </button>
        <Link
          className="inline-flex min-h-8 shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
          preventScrollReset
          to={pagePath(pages[0]!.slug)}
          aria-label="Homepage"
        >
          <span
            className="grid size-7 place-items-center rounded-md bg-cyan-600 text-sm/6 text-white"
            aria-hidden="true"
          >
            c
          </span>
          <span>comp0</span>
        </Link>
        <nav
          className="hidden items-center gap-5 text-sm/6 text-zinc-600 dark:text-zinc-400 lg:flex"
          aria-label="Docs"
        >
          <Link
            className="inline-flex min-h-6 items-center hover:text-zinc-950 dark:hover:text-white"
            preventScrollReset
            to={pagePath(pages[0]!.slug)}
          >
            Components
          </Link>
          <a
            className="inline-flex min-h-6 items-center hover:text-zinc-950 dark:hover:text-white"
            href="#api"
          >
            API
          </a>
          <a
            className="inline-flex min-h-6 items-center hover:text-zinc-950 dark:hover:text-white"
            href="#accessibility"
          >
            Accessibility
          </a>
        </nav>
        <div className="ml-auto hidden w-full max-w-sm lg:block">
          <SearchFieldShell query={query} setQuery={setQuery} name="header-component-search" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6 lg:hidden">
          {current.title}
        </p>
        <button
          className="relative rounded-md border border-zinc-950/10 p-2 text-zinc-950 dark:border-white/10 dark:text-white"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          <span
            className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2"
            aria-hidden="true"
          />
          {theme === "light" && <Moon className="size-5" aria-hidden="true" />}
          {theme !== "light" && <Sun className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}

function currentPageFromPath(pathname: string) {
  const slug = pathname.split("/").filter(Boolean).at(-1);
  return pages.find((page) => page.slug === slug) ?? pages[0]!;
}

export function DocsPageView({ current: currentOverride }: { current?: ComponentPage }) {
  const location = useLocation();
  const current = currentOverride ?? currentPageFromPath(location.pathname);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getSystemTheme);
  const [themeOverride, setThemeOverride] = useState(false);
  const pagesToShow = useMemo(() => {
    const normalized = query.toLocaleLowerCase();
    return pages.filter((page) =>
      `${page.title} ${page.docs.map((doc) => doc.name).join(" ")}`
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query]);
  const toggleTheme = () => {
    setThemeOverride(true);
    setTheme((value) => (value === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (themeOverride || typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setTheme(media.matches ? "dark" : "light");
    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themeOverride]);

  return (
    <div
      className={cx(
        `
          docs-shell isolate min-h-dvh bg-neutral-50 text-zinc-950 antialiased
          dark:bg-neutral-950 dark:text-zinc-100
        `,
        theme === "dark" && "dark",
      )}
    >
      <DocsHeader
        current={current}
        query={query}
        setQuery={setQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        openMobileNav={() => setMobileOpen(true)}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-neutral-50 dark:bg-neutral-950 lg:hidden">
          <div className="flex items-center justify-between border-b border-zinc-950/10 px-4 py-3 dark:border-white/10">
            <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
              Components
            </p>
            <button
              className="relative rounded-md border border-zinc-950/10 p-2 text-zinc-950 dark:border-white/10 dark:text-white"
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <span
                className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2"
                aria-hidden="true"
              />
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <AppNav
            pagesToShow={pagesToShow}
            onNavigate={() => setMobileOpen(false)}
            query={query}
            setQuery={setQuery}
          />
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden h-[calc(100dvh-4rem)] lg:sticky lg:top-16 lg:block">
          <AppNav pagesToShow={pagesToShow} query={query} setQuery={setQuery} showSearch={false} />
        </aside>

        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <main className="min-w-0 px-4 py-10 sm:px-6 lg:px-12">
            <div className="mx-auto grid min-w-0 max-w-4xl gap-12">
              <PageIntro page={current} />

              <div className="grid min-w-0 gap-4">
                <Heading
                  className="sr-only text-xl font-semibold tracking-tight text-zinc-950 dark:text-white"
                  level={2}
                  id="examples-heading"
                >
                  Examples
                </Heading>
                <ExampleShowcase page={current} theme={theme} />
              </div>

              <Section id="value" title="Value">
                <ValueSection page={current} />
              </Section>

              <Section id="api" title="API">
                <div className="grid gap-8">
                  {current.docs.map((doc) => (
                    <ComponentApiTable doc={doc} key={doc.name} />
                  ))}
                </div>
              </Section>

              <Section id="styling" title="Styling">
                <div className="grid gap-8">
                  {current.docs.map((doc) => (
                    <article className="grid gap-4" key={doc.name}>
                      <Heading
                        className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
                        level={3}
                      >
                        {doc.name}
                      </Heading>
                      <div className="grid gap-2 text-base/7 text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
                        {doc.data.map((attribute) => (
                          <code
                            className="rounded-md border border-zinc-950/10 bg-neutral-50 px-3 py-2 font-mono dark:border-white/10 dark:bg-neutral-900"
                            key={attribute}
                          >
                            {attribute}
                          </code>
                        ))}
                      </div>
                      <CodeBlock code={stylingExample(doc)} theme={theme} />
                    </article>
                  ))}
                </div>
              </Section>

              <Section id="accessibility" title="Accessibility">
                <div className="grid gap-8">
                  <AccessibilitySupportSection />
                  {current.docs.map((doc) => (
                    <ComponentAccessibilityTable doc={doc} key={doc.name} />
                  ))}
                </div>
              </Section>

              <Section id="ssr" title="SSR">
                <div className="grid gap-4">
                  {current.docs.map((doc) => (
                    <article className="grid gap-1" key={doc.name}>
                      <Heading
                        className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
                        level={3}
                      >
                        {doc.name}
                      </Heading>
                      <Text className="max-w-[72ch] text-base/7 text-pretty text-zinc-700 dark:text-zinc-300 sm:text-sm/6">
                        {doc.ssr}
                      </Text>
                    </article>
                  ))}
                </div>
              </Section>

              <Section id="related" title="Related">
                <RelatedPages page={current} />
              </Section>
            </div>
          </main>

          <aside className="hidden border-l border-zinc-950/10 px-4 py-10 dark:border-white/10 xl:block">
            <nav className="sticky top-24 grid gap-2" aria-label="On this page">
              <p className="text-base/7 font-medium text-zinc-950 dark:text-white sm:text-sm/6">
                On this page
              </p>
              {pageSections.map((section) => (
                <a
                  className="inline-flex min-h-6 items-center border-l border-transparent px-3 text-base/7 text-zinc-600 hover:border-cyan-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-cyan-400 dark:hover:text-white sm:text-sm/6"
                  href={`#${section.toLocaleLowerCase().replaceAll(" ", "-")}`}
                  key={section}
                >
                  {section}
                </a>
              ))}
            </nav>
          </aside>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

export default function ComponentsLayout() {
  return <DocsPageView />;
}
