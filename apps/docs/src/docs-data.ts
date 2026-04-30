export type Theme = "light" | "dark";

export type ComponentDoc = {
  name: string;
  group: string;
  summary: string;
  nativeMarkup: string;
  anatomy: [string, string][];
  anatomyCode: string;
  examples: {
    uncontrolled: string;
    controlled: string;
  };
  accessibility: string[];
  keyboard: [string, string][];
  data: string[];
  props: [string, string, string][];
  references: {
    label: string;
    href: string;
  }[];
  ssr: string;
};

export type AccessibilityAuditStatus =
  | "covered"
  | "consumer responsibility"
  | "not applicable"
  | "needs manual audit";

export type AccessibilityAuditDimension =
  | "nameRoleValue"
  | "keyboardAccess"
  | "focusOrder"
  | "focusVisible"
  | "labelsInstructions"
  | "errorIdentification"
  | "statusMessages"
  | "pointerAlternatives"
  | "contrastSensitiveStates"
  | "targetSize";

export type AccessibilityAuditEntry = {
  component: string;
  group: string;
  statuses: Record<AccessibilityAuditDimension, AccessibilityAuditStatus>;
  wcag: string[];
  apg: string[];
  notes: string;
};

type DocOverride = Partial<Omit<ComponentDoc, "name" | "group" | "examples">> & {
  examples?: Partial<ComponentDoc["examples"]>;
};

export type ComponentPage = {
  title: string;
  slug: string;
  group: string;
  summary: string;
  nativeMarkup: string;
  docs: ComponentDoc[];
};

export const componentGroups = [
  {
    title: "Primitives",
    names: [
      "Button",
      "ToggleButton",
      "ToggleButtonGroup",
      "Link",
      "Text",
      "Heading",
      "Header",
      "Keyboard",
      "Separator",
      "Group",
      "Toolbar",
      "Pressable",
      "Focusable",
      "VisuallyHidden",
    ],
  },
  {
    title: "Field anatomy",
    names: ["Label", "Description", "FieldError", "Fieldset", "Legend"],
  },
  {
    title: "Text inputs",
    names: ["TextField", "Input", "TextArea", "SearchField"],
  },
  {
    title: "Choice inputs",
    names: ["Checkbox", "CheckboxGroup", "RadioGroup", "Radio", "Switch"],
  },
  {
    title: "Range and status",
    names: [
      "NumberField",
      "Slider",
      "SliderOutput",
      "SliderTrack",
      "SliderThumb",
      "ProgressBar",
      "Meter",
    ],
  },
  {
    title: "Disclosure and navigation",
    names: [
      "Disclosure",
      "DisclosureGroup",
      "DisclosurePanel",
      "Tabs",
      "TabList",
      "Tab",
      "TabPanels",
      "TabPanel",
      "Breadcrumbs",
      "BreadcrumbLink",
    ],
  },
  {
    title: "Collections",
    names: [
      "Collection",
      "CollectionBuilder",
      "ListBox",
      "ListBoxItem",
      "ListBoxSection",
      "ListBoxLoadMoreItem",
      "Menu",
      "MenuItem",
      "MenuSection",
      "MenuTrigger",
      "SubmenuTrigger",
      "GridList",
      "GridListItem",
      "GridListHeader",
      "GridListSection",
      "GridListLoadMoreItem",
      "TagGroup",
      "TagList",
      "Tag",
      "Tree",
      "TreeItem",
      "TreeItemContent",
      "TreeHeader",
      "TreeSection",
      "TreeLoadMoreItem",
    ],
  },
  {
    title: "Pickers",
    names: [
      "Select",
      "SelectValue",
      "SelectOption",
      "Combobox",
      "ComboBoxValue",
      "ComboboxOption",
      "Autocomplete",
    ],
  },
  {
    title: "Date and time",
    names: [
      "Calendar",
      "CalendarGrid",
      "CalendarGridHeader",
      "CalendarGridBody",
      "CalendarHeaderCell",
      "CalendarCell",
      "RangeCalendar",
      "DateField",
      "DateInput",
      "DateSegment",
      "TimeField",
      "DatePicker",
      "DateRangePicker",
    ],
  },
  {
    title: "Color",
    names: [
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
  },
  {
    title: "Overlays",
    names: [
      "DialogTrigger",
      "Dialog",
      "Modal",
      "ModalOverlay",
      "Popover",
      "OverlayArrow",
      "TooltipTrigger",
      "Tooltip",
    ],
  },
  {
    title: "Drag and drop",
    names: ["DropZone", "DropIndicator", "FileTrigger"],
  },
  {
    title: "Table",
    names: [
      "Table",
      "ResizableTableContainer",
      "TableHeader",
      "Column",
      "ColumnResizer",
      "TableBody",
      "Row",
      "Cell",
      "TableLoadMoreItem",
    ],
  },
  {
    title: "Transitions and toast",
    names: [
      "SharedElementTransition",
      "SharedElement",
      "UNSTABLE_ToastRegion",
      "UNSTABLE_ToastList",
      "UNSTABLE_Toast",
      "UNSTABLE_ToastContent",
    ],
  },
] as const;

const groupDefaults: Record<
  string,
  Pick<
    ComponentDoc,
    "summary" | "nativeMarkup" | "anatomy" | "accessibility" | "keyboard" | "data" | "props" | "ssr"
  >
> = {
  Primitives: {
    summary:
      "Small native-first building blocks for actions, text, headings, separators, and grouped controls.",
    nativeMarkup:
      "Native element selected by the component: button, anchor, heading, text, hr, or div role=group.",
    anatomy: [
      [
        "Root",
        "The semantic element that receives forwarded refs, render props, and data attributes.",
      ],
    ],
    accessibility: [
      "Use the native element whenever it already supplies the correct role and activation behavior.",
      "Expose accessible names through visible text, aria-label, or aria-labelledby as appropriate.",
      "Stateful primitives reflect interaction state through data attributes without changing the semantic role.",
    ],
    keyboard: [["Native behavior", "The browser handles activation, focus, and text navigation."]],
    data: ["data-disabled", "data-focused", "data-focus-visible", "data-hovered", "data-pressed"],
    props: [
      ["children", "ReactNode | function", "Static children or state render prop."],
      ["className", "string | function", "Static or state-derived class name."],
      ["disabled", "boolean", "Disables interaction where supported."],
    ],
    ssr: "Primitive state is derived from props during render; focus, hover, and press state are browser-only events.",
  },
  "Field anatomy": {
    summary:
      "Composable labels, help text, validation text, and native fieldset anatomy for controls.",
    nativeMarkup: "label, div, fieldset, legend, and role=alert for validation messaging.",
    anatomy: [
      ["Field root", "Provides generated ids and disabled, invalid, and required context."],
      ["Label or Legend", "Names the control or related group."],
      ["Description", "Adds help text through aria-describedby."],
      ["FieldError", "Mounts role=alert when invalid."],
    ],
    accessibility: [
      "Labels, legends, descriptions, and errors are connected through generated ids that hydrate consistently.",
      "Validation text uses role=alert only when it represents an error state.",
      "Fieldset and legend should be used for related controls rather than visual grouping alone.",
    ],
    keyboard: [["Native behavior", "Labels and fieldsets preserve platform form navigation."]],
    data: ["data-disabled", "data-invalid", "data-required"],
    props: [
      ["id", "string", "Overrides generated control ids."],
      ["aria-invalid", "boolean", "Enables error wiring."],
      ["required", "boolean", "Marks the field as required."],
    ],
    ssr: "Ids are generated with React useId so labels and descriptions hydrate consistently.",
  },
  "Text inputs": {
    summary:
      "Text entry components that keep label, description, invalid, and required wiring in context and submit as native form fields.",
    nativeMarkup: "input, textarea, label, and div wrappers only where field context is needed.",
    anatomy: [
      ["TextField or SearchField", "Provides field context and data attributes."],
      ["Label", "Associates visible text with the control."],
      ["Input or TextArea", "Native form control."],
      ["Description and FieldError", "Optional aria-described content."],
    ],
    accessibility: [
      "Text controls keep native input or textarea behavior for editing, selection, autocomplete, and form submission.",
      "Set `name` and a parent `<form>` so native fields are included in submission payloads.",
      "Labels and descriptions are wired with for, aria-describedby, aria-invalid, required, and disabled attributes.",
      "SearchField keeps input type=search behavior instead of replacing it with custom keyboard handling.",
    ],
    keyboard: [
      ["Native behavior", "Text editing, selection, and form submission use platform behavior."],
    ],
    data: [
      "data-disabled",
      "data-focused",
      "data-focus-visible",
      "data-hovered",
      "data-invalid",
      "data-required",
    ],
    props: [
      ["name", "string", "Native form field name."],
      ["disabled", "boolean", "Maps to the native disabled state."],
      ["required", "boolean", "Maps to the native required state."],
    ],
    ssr: "The field description chain is string-built from ids and props; there are no DOM reads in render.",
  },
  "Choice inputs": {
    summary:
      "Stylable checkbox, radio, and switch controls backed by visually hidden native inputs.",
    nativeMarkup:
      "label, visually hidden input type=checkbox/radio, custom indicator, and fieldset.",
    anatomy: [
      ["Group", "Optional fieldset for related choices."],
      ["Label", "Clickable headless root with state data attributes."],
      ["Input", "Visually hidden native checkbox, radio, or switch control for form behavior."],
      ["Indicator", "User-owned visual element styled from data attributes or :has()."],
    ],
    accessibility: [
      "Choice controls keep native checkbox or radio inputs in the accessibility tree and form submission path.",
      "The visible indicator is user-owned and marked decorative when it does not add accessible information.",
      "CheckboxGroup and RadioGroup should be named with visible legends or equivalent labelling.",
    ],
    keyboard: [
      [
        "Native behavior",
        "Space, arrow keys for radios, and form behavior are handled by the browser.",
      ],
    ],
    data: [
      "data-selected",
      "data-disabled",
      "data-focused",
      "data-indeterminate",
      "data-invalid",
      "data-required",
    ],
    props: [
      ["value", "string", "Submitted value or group selection key."],
      ["selected", "boolean", "Controlled selected state."],
      ["onChange", "function", "Selection change callback."],
    ],
    ssr: "Checked state serializes normally; indeterminate is assigned after hydration because it is a DOM property.",
  },
  "Range and status": {
    summary:
      "Numeric entry, range input, and progress/status components built from native primitives.",
    nativeMarkup: "input type=number, input type=range, meter, or role=progressbar.",
    anatomy: [
      ["Label", "Names the numeric or status value."],
      ["Control", "Native number/range input or status element."],
      ["Output", "Optional render-prop value display."],
    ],
    accessibility: [
      "Number and slider inputs use native range/number behavior where possible.",
      "ProgressBar exposes aria-valuemin, aria-valuemax, and aria-valuenow when determinate.",
      "Meter uses native meter semantics for scalar measurements rather than progress updates.",
    ],
    keyboard: [
      [
        "Native behavior",
        "Arrow, page, home/end, and form behavior follow the underlying native control.",
      ],
    ],
    data: ["data-disabled", "data-indeterminate", "data-complete"],
    props: [
      ["value", "number", "Controlled numeric value."],
      ["defaultValue", "number", "Initial uncontrolled value."],
      ["onChange", "function", "Value change callback."],
    ],
    ssr: "Values are serialized as attributes and CSS variables; layout measurement is not required.",
  },
  "Disclosure and navigation": {
    summary:
      "Disclosure, tab, and breadcrumb patterns with native markup first and ARIA only where needed.",
    nativeMarkup: "details, summary, nav, ol, anchor, and tab roles for tab panels.",
    anatomy: [
      ["Root", "Owns open or selected state."],
      ["Trigger or item", "Receives keyboard and selection state."],
      ["Panel or trail", "Displays associated content."],
    ],
    accessibility: [
      "Disclosure uses native details and summary behavior; Tabs use ARIA tab, tablist, and tabpanel roles.",
      "Tabs keep one tab stop in the tablist and use arrow keys to move selection.",
      "Breadcrumbs render a named navigation landmark with ordered links and current-page state.",
    ],
    keyboard: [
      ["Arrow keys", "Tabs move focus and selection between tab items."],
      ["Home / End", "Tabs move to the first or last item."],
    ],
    data: ["data-open", "data-selected", "data-orientation", "data-current"],
    props: [
      ["defaultOpen", "boolean", "Initial uncontrolled open state."],
      ["value", "string", "Controlled selected value."],
      ["onChange", "function", "Selection callback."],
    ],
    ssr: "Open and selected state renders as attributes; focus changes happen only in keyboard handlers.",
  },
  Collections: {
    summary:
      "Selectable and actionable collections with roving focus, disabled items, and typeahead.",
    nativeMarkup:
      "div role=listbox, div role=option, div role=menu, div role=menuitem, role=group, and role=rowgroup.",
    anatomy: [
      ["Collection root", "Owns item registry and keyboard navigation."],
      ["Section", "Optional grouped items."],
      ["Item", "Registered by id and children text."],
    ],
    accessibility: [
      "Collection widgets use registered item ids, disabled state, and roving focus to keep keyboard navigation predictable.",
      "Listbox selection follows focus in this implementation; disabled items are skipped by keyboard movement.",
      "Menu items are action-oriented; listbox items are selection-oriented and should not be mixed semantically.",
    ],
    keyboard: [
      ["Arrow keys", "Move through enabled items."],
      ["Home / End", "Move to boundary items."],
      ["Typeahead", "Move by item label."],
    ],
    data: ["data-selected", "data-disabled", "data-orientation"],
    props: [
      ["id", "string", "Stable item key."],
      ["disabled", "boolean", "Skips item in keyboard navigation."],
    ],
    ssr: "Collection ordering is registered after mount, while static server markup stays meaningful.",
  },
  Pickers: {
    summary:
      "Composed select and combobox roots with stylable slots, hidden form values, and listbox selection.",
    nativeMarkup:
      "label, button, input role=combobox, span, popover, listbox, and option-like rows.",
    anatomy: [
      ["Select", "Field-aware root that owns open state, value, hidden form value, and item text."],
      [
        "Label and Button",
        "Label names the trigger; Button receives select trigger attributes from context.",
      ],
      ["SelectValue", "Reads the selected item text and exposes placeholder state."],
      ["Popover and ListBox", "Displays selectable ListBoxItem rows and closes on selection."],
      [
        "Combobox anatomy",
        "Label, Group, Input, Button, Popover, and ListBox compose the control.",
      ],
    ],
    accessibility: [
      "Select and Combobox compose labelled triggers or inputs with listbox popovers and hidden form values.",
      "Open state, selection, and placeholder state are reflected through ARIA attributes and data attributes.",
      "Use visible Label and Description slots whenever the picker is not self-evident from surrounding content.",
    ],
    keyboard: [
      ["Button", "Toggles the popover and exposes aria-expanded."],
      ["Input", "Updates the filter value and opens the suggestions list."],
      ["ListBox", "Arrow keys and typeahead move through options; selection closes the popover."],
    ],
    data: ["data-open", "data-disabled", "data-selected", "data-placeholder", "data-value"],
    props: [
      ["value", "string", "Controlled selected value for Select or input value for Combobox."],
      ["defaultValue", "string", "Initial uncontrolled value."],
      ["onChange", "function", "Value change callback."],
      ["selectedValue", "string", "Controlled committed Combobox option value."],
      ["defaultSelectedValue", "string", "Initial committed Combobox option value."],
      ["placeholder", "ReactNode", "Displayed fallback value."],
    ],
    ssr: "Picker ids use React useId, selected state serializes as data attributes, and browser-only focus movement happens in event handlers.",
  },
  "Date and time": {
    summary:
      "Gregorian ISO calendar, date, and time controls for segmented entry and calendar composition.",
    nativeMarkup:
      "grouped divs, table grid anatomy, grid cells, spinbutton-like segments, and popovers.",
    anatomy: [
      ["Field", "DateField or TimeField owns segmented input structure."],
      ["Calendar", "CalendarGrid, header cells, and CalendarCell build the visible date grid."],
      ["Picker", "DatePicker and DateRangePicker compose field, trigger, popover, and calendar."],
    ],
    accessibility: [
      "Calendar grids expose grid roles, selected/disabled cells, and arrow/Page/Home/End keyboard movement.",
      "Date and time segments use spinbutton semantics and ArrowUp/ArrowDown increment or decrement the segment.",
      "DatePicker and DateRangePicker compose fields, triggers, popovers, calendars, and hidden form values.",
    ],
    keyboard: [
      ["Calendar", "Arrow keys move by day or week; Page keys move by month; Enter selects."],
      ["Segments", "ArrowUp and ArrowDown adjust the focused segment within practical bounds."],
    ],
    data: ["data-slot", "data-selected", "data-disabled", "data-date", "data-value"],
    props: [
      ["value", "string", "Controlled ISO date or time value."],
      ["defaultValue", "string", "Initial ISO date or time value."],
      ["onChange", "function", "Value change callback."],
    ],
    ssr: "Date/time controls render deterministic ISO values; browser-only focus movement happens in event handlers.",
  },
  Color: {
    summary:
      "CSS color field, channel sliders, wheels, areas, and selectable swatches without runtime color dependencies.",
    nativeMarkup: "grouped divs, option/listbox roles for swatches, and slider roles for channels.",
    anatomy: [
      ["Color field", "Text entry or native color input wrapper."],
      ["Picker", "Composes area, slider, wheel, swatches, and thumb parts."],
      ["Swatches", "Listbox-style selectable color choices."],
    ],
    accessibility: [
      "ColorField accepts common CSS color strings and exposes invalid state for unsupported formats.",
      "ColorArea, ColorSlider, and ColorWheel expose slider semantics and keyboard channel updates.",
      "ColorSwatchPicker and ColorSwatchPickerItem expose listbox option selection semantics.",
    ],
    keyboard: [
      ["Slider controls", "Arrow keys adjust channels; Shift increases the step size."],
      ["Swatches", "Click selectable swatch options to update the owning color value."],
    ],
    data: ["data-slot", "data-selected", "data-disabled", "data-invalid", "data-value"],
    props: [
      ["value", "string", "Controlled CSS color string."],
      ["defaultValue", "string", "Initial CSS color string."],
      ["onChange", "function", "Color change callback."],
    ],
    ssr: "Color controls parse common CSS formats during render and serialize state as data attributes.",
  },
  Overlays: {
    summary:
      "Dialog, modal, popover, and tooltip primitives with browser-only behavior isolated to effects.",
    nativeMarkup: "dialog where possible, otherwise role=dialog or role=tooltip.",
    anatomy: [
      ["Trigger", "A separate control opens or references the overlay."],
      ["Overlay", "Dialog, popover, or tooltip surface."],
      ["Content", "Named body content and actions."],
    ],
    accessibility: [
      "Dialogs and modals must have accessible names through aria-label or aria-labelledby.",
      "Modal uses native dialog behavior and marks the dialog as modal for assistive technology.",
      "Tooltips describe their trigger and should remain available on hover and focus.",
    ],
    keyboard: [
      ["Escape", "Native dialog cancel closes Modal."],
      ["Tab", "Focus behavior follows browser dialog support."],
    ],
    data: ["data-open"],
    props: [
      ["open", "boolean", "Controlled open state."],
      ["defaultOpen", "boolean", "Initial open state."],
      ["onChange", "function", "Open state callback."],
    ],
    ssr: "Portals and showModal run after mount; server output remains valid dialog markup.",
  },
  "Drag and drop": {
    summary:
      "Native drag, drop, and file trigger shells that expose stable styling hooks without external state engines.",
    nativeMarkup: "drop regions, hidden file inputs, labels, and indicator elements.",
    anatomy: [
      ["DropZone", "Receives drag/drop attributes and data-slot styling."],
      ["FileTrigger", "Label plus hidden native file input."],
      ["DropIndicator", "Visual insertion target shell."],
    ],
    accessibility: [
      "Drag and drop must have keyboard-accessible alternatives such as FileTrigger or explicit move actions.",
      "Drop indicators are visual targets and should not be the only way to complete an operation.",
      "Native file input behavior is preserved through the hidden input inside FileTrigger.",
    ],
    keyboard: [
      ["Drag file over zone", "Prevents browser navigation and exposes data-drop-target."],
      ["Drop", "Calls the native onDrop handler with event.dataTransfer.files."],
      ["Choose file", "FileTrigger opens the native file picker through input type=file."],
    ],
    data: ["data-slot", "data-disabled", "data-drop-target"],
    props: [
      ["disabled", "boolean", "Stops accepting drag/drop events and exposes aria-disabled."],
      [
        "onDrop",
        "DragEventHandler",
        "Native drop handler; read files from event.dataTransfer.files.",
      ],
      ["inputProps", "object", "Props forwarded to the hidden file input."],
      ["multiple", "boolean", "Native file input option via inputProps."],
    ],
    ssr: "No drag/drop DOM reads happen during render.",
  },
  Table: {
    summary: "Native table anatomy with selection and disabled state exposed on rows.",
    nativeMarkup: "table, thead, tbody, tr, th, and td.",
    anatomy: [
      ["Table", "Native table root."],
      ["TableHeader and Column", "Header section and scoped header cells."],
      ["TableBody, Row, and Cell", "Data section, rows, and cells."],
    ],
    accessibility: [
      "Table components render native table elements, preserving header and cell relationships.",
      "Column headers use scope=col by default; row headers should use rowHeader when appropriate.",
      "Use interactive grid semantics only when cells need keyboard interaction beyond table reading.",
    ],
    keyboard: [["Native behavior", "Table reading and navigation use semantic HTML."]],
    data: ["data-selected", "data-disabled"],
    props: [
      ["selected", "boolean", "Marks selected row state."],
      ["disabled", "boolean", "Marks disabled row state."],
      ["scope", "col | row", "Header cell scope."],
    ],
    ssr: "Only native table markup renders, so hydration does not require layout reads.",
  },
  "Transitions and toast": {
    summary:
      "Transition and toast component shells for parity with React Aria Components' public component selection.",
    nativeMarkup: "status regions, list regions, and generic grouped elements.",
    anatomy: [
      ["Toast region", "Announces queued status messages."],
      ["Toast list", "Groups toast items."],
      ["Shared element", "Marks transition participants for styling or future animation."],
    ],
    accessibility: [
      "Toast regions use status semantics for non-interruptive announcements.",
      "Toast content should stay concise and avoid moving keyboard focus unless the user explicitly opens it.",
      "Shared transition markers are styling hooks and do not add accessibility semantics by themselves.",
    ],
    keyboard: [
      ["Native behavior", "Toast regions use status/region semantics for assistive tech."],
    ],
    data: ["data-slot", "data-open"],
    props: [
      ["children", "ReactNode", "Toast or transition content."],
      ["className", "string", "Styling hook."],
    ],
    ssr: "Shells render deterministic static markup and leave animation orchestration to CSS or future logic.",
  },
};

const overrides: Record<string, DocOverride> = {
  Button: {
    summary: "A native button with press, hover, focus, disabled, pending, and render-prop state.",
    anatomyCode: `<Button type="button">\n  Save changes\n</Button>`,
    examples: {
      uncontrolled: `<Button onClick={() => save()}>\n  Save changes\n</Button>`,
      controlled: `<Button disabled={isSaving} pending={isSaving}>\n  {({ pending }) => pending ? "Saving..." : "Save changes"}\n</Button>`,
    },
  },
  ToggleButton: {
    summary: "A button that exposes selected state through aria-pressed and data-selected.",
    anatomyCode: `<ToggleButton>\n  Pin item\n</ToggleButton>`,
    examples: {
      uncontrolled: `<ToggleButton defaultSelected>\n  Pin item\n</ToggleButton>`,
      controlled: `<ToggleButton selected={pinned} onChange={setPinned}>\n  {({ selected }) => selected ? "Pinned" : "Pin"}\n</ToggleButton>`,
    },
  },
  ToggleButtonGroup: {
    summary:
      "A grouped toggle control surface that lets related ToggleButton children share a visual boundary.",
    nativeMarkup: "div with role group and native button children.",
    anatomyCode: `<ToggleButtonGroup aria-label="Text alignment">\n  <ToggleButton>Left</ToggleButton>\n  <ToggleButton>Center</ToggleButton>\n  <ToggleButton>Right</ToggleButton>\n</ToggleButtonGroup>`,
    anatomy: [
      ["ToggleButtonGroup", "Provides group semantics and a shared styling boundary."],
      ["ToggleButton", "Uses native button behavior and exposes aria-pressed state."],
      ["State", "Each button owns its selected state and exposes data-selected for styling."],
    ],
    examples: {
      uncontrolled: `<ToggleButtonGroup aria-label="Text alignment">\n  <ToggleButton defaultSelected>Left</ToggleButton>\n  <ToggleButton>Center</ToggleButton>\n</ToggleButtonGroup>`,
      controlled: `<ToggleButtonGroup aria-label="Text alignment">\n  <ToggleButton selected={alignment === "left"}>Left</ToggleButton>\n  <ToggleButton selected={alignment === "center"}>Center</ToggleButton>\n</ToggleButtonGroup>`,
    },
    keyboard: [
      ["Tab", "Moves focus to the first focusable button in the group."],
      ["Space / Enter", "Toggles the focused button using native button activation."],
    ],
    data: ["data-slot", "data-selected", "data-disabled", "data-pressed", "data-hovered"],
    props: [
      [
        "aria-label",
        "string",
        "Names the grouped toggle control when no visible label is present.",
      ],
      ["children", "ReactNode", "Usually ToggleButton children."],
      ["className", "string", "Styling hook for the group wrapper."],
    ],
    ssr: "The group and its buttons render deterministic native markup.",
  },
  Link: {
    summary:
      "An anchor-first link component with disabled, hover, and focus-visible state attributes.",
    anatomyCode: `<Link href="/docs">\n  Read the docs\n</Link>`,
    examples: {
      uncontrolled: `<Link href="/docs">Read the docs</Link>`,
      controlled: `<Link disabled href="/docs">\n  Unavailable\n</Link>`,
    },
  },
  Text: {
    summary: "A polymorphic text primitive for paragraphs, spans, small print, and emphasis.",
    anatomyCode: `<Text as="p">\n  Text content\n</Text>`,
    examples: {
      uncontrolled: `<Text>Use native text elements for copy.</Text>`,
      controlled: `<Text as="strong">\n  Important status\n</Text>`,
    },
  },
  Heading: {
    summary: "A heading primitive that renders h1 through h6 with a level prop.",
    anatomyCode: `<Heading level={2}>\n  Section title\n</Heading>`,
    examples: {
      uncontrolled: `<Heading level={2}>Settings</Heading>`,
      controlled: `<Heading level={level}>Dynamic heading</Heading>`,
    },
  },
  Separator: {
    summary:
      "A semantic separator rendered as hr with horizontal or vertical orientation metadata.",
    anatomyCode: `<Separator orientation="horizontal" />`,
    examples: {
      uncontrolled: `<Separator />`,
      controlled: `<Separator orientation={orientation} />`,
    },
  },
  Group: {
    summary: "A grouping primitive that defaults to role=group for related controls.",
    anatomyCode: `<Group aria-label="Text formatting">\n  <Button>B</Button>\n  <Button>I</Button>\n</Group>`,
    examples: {
      uncontrolled: `<Group aria-label="Formatting">\n  <Button>Bold</Button>\n  <Button>Italic</Button>\n</Group>`,
      controlled: `<Group role={role} aria-label="Selection tools">\n  {tools}\n</Group>`,
    },
  },
  Toolbar: {
    summary:
      "A toolbar container that groups three or more controls into one tab stop with roving focus.",
    nativeMarkup: "div role=toolbar with native button, input, link, or checkbox controls.",
    anatomy: [
      ["Toolbar", "Owns roving tab index and arrow-key focus movement for child controls."],
      ["Control", "A native focusable element such as Button, ToggleButton, Link, or input."],
      ["Separator", "Optional visual separator that is not part of the roving focus order."],
    ],
    anatomyCode: `<Toolbar aria-label="Editor formatting">\n  <ToggleButton>Bold</ToggleButton>\n  <ToggleButton>Italic</ToggleButton>\n  <ToggleButton>Code</ToggleButton>\n</Toolbar>`,
    examples: {
      uncontrolled: `<Toolbar aria-label="Editor formatting">\n  <ToggleButton>Bold</ToggleButton>\n  <ToggleButton>Italic</ToggleButton>\n  <ToggleButton>Code</ToggleButton>\n</Toolbar>`,
      controlled: `<Toolbar aria-label="Editor formatting" orientation="horizontal">\n  {tools.map((tool) => (\n    <ToggleButton key={tool.id}>{tool.label}</ToggleButton>\n  ))}\n</Toolbar>`,
    },
    keyboard: [
      [
        "Tab",
        "Moves focus into the toolbar to the active child control; only one child is tabbable.",
      ],
      ["Shift + Tab", "Moves focus out of the toolbar to the previous page tab stop."],
      ["Left / Right Arrow", "Moves focus between controls in a horizontal toolbar."],
      ["Up / Down Arrow", "Moves focus between controls in a vertical toolbar."],
      ["Home / End", "Moves focus to the first or last enabled control."],
    ],
    data: ["data-orientation", "data-slot"],
    props: [
      [
        "orientation",
        '"horizontal" | "vertical"',
        "Sets arrow-key direction and aria-orientation.",
      ],
      ["loop", "boolean", "Wraps arrow-key focus from end to start. Defaults to true."],
      ["aria-label", "string", "Names the toolbar when no visible label is present."],
    ],
    ssr: "Toolbar renders static role markup on the server; roving tabIndex is applied after mount.",
  },
  TextField: {
    anatomyCode: `<form action="/api/profile">\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" defaultValue="headless" />\n    <Description>Used for account notifications.</Description>\n    <FieldError>Enter a valid email.</FieldError>\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    examples: {
      uncontrolled: `<form action="/api/profile">\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" />\n    <Description>Used for account notifications.</Description>\n    <FieldError>Enter a valid email.</FieldError>\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
      controlled: `<form action="/api/profile">\n  <TextField aria-invalid>\n    <Label>Email</Label>\n    <Input name="email" defaultValue="bad" />\n    <FieldError>Enter a valid email.</FieldError>\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    },
  },
  Label: {
    anatomyCode: `<TextField>\n  <Label>Project</Label>\n  <Input name="project" />\n</TextField>`,
    examples: {
      uncontrolled: `<TextField>\n  <Label>Project</Label>\n  <Input name="project" />\n</TextField>`,
      controlled: `<TextField>\n  <Label>Project</Label>\n  <Input name="project" defaultValue="Design" />\n</TextField>`,
    },
  },
  Description: {
    anatomyCode: `<TextField>\n  <Label>Project</Label>\n  <Input name="project" />\n  <Description>Used for helper copy.</Description>\n</TextField>`,
    examples: {
      uncontrolled: `<TextField>\n  <Label>Project</Label>\n  <Input name="project" />\n  <Description>Used for helper copy.</Description>\n</TextField>`,
      controlled: `<TextField aria-invalid>\n  <Label>Project</Label>\n  <Input name="project" />\n  <Description>Shown with field state.</Description>\n</TextField>`,
    },
  },
  FieldError: {
    anatomyCode: `<TextField aria-invalid>\n  <Label>Project</Label>\n  <Input name="project" />\n  <FieldError>Project is required.</FieldError>\n</TextField>`,
    examples: {
      uncontrolled: `<TextField aria-invalid>\n  <Label>Project</Label>\n  <Input name="project" />\n  <FieldError>Project is required.</FieldError>\n</TextField>`,
      controlled: `<TextField aria-invalid>\n  <Label>Project</Label>\n  <Input name="project" />\n  <FieldError>Project is required.</FieldError>\n</TextField>`,
    },
  },
  Fieldset: {
    anatomyCode: `<Fieldset>\n  <Legend>Delivery</Legend>\n  <Checkbox value="email">Email</Checkbox>\n</Fieldset>`,
    examples: {
      uncontrolled: `<Fieldset>\n  <Legend>Delivery</Legend>\n  <Checkbox value="email">Email</Checkbox>\n  <Checkbox value="sms">SMS</Checkbox>\n</Fieldset>`,
      controlled: `<Fieldset>\n  <Legend>Delivery</Legend>\n  <Checkbox value="email">Email</Checkbox>\n  <Checkbox value="sms">SMS</Checkbox>\n</Fieldset>`,
    },
  },
  Legend: {
    anatomyCode: `<Fieldset>\n  <Legend>Visibility</Legend>\n  <Checkbox value="public">Public</Checkbox>\n</Fieldset>`,
    examples: {
      uncontrolled: `<Fieldset>\n  <Legend>Visibility</Legend>\n  <Checkbox value="public">Public</Checkbox>\n</Fieldset>`,
      controlled: `<Fieldset>\n  <Legend>Visibility</Legend>\n  <Checkbox value="public">Public</Checkbox>\n</Fieldset>`,
    },
  },
  Input: {
    anatomyCode: `<form action="/api/profile">\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    examples: {
      uncontrolled: `<form action="/api/profile">\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
      controlled: `<form action="/api/profile">\n  <TextField>\n    <Label>Email</Label>\n    <Input name="email" defaultValue="headless" />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    },
  },
  TextArea: {
    anatomyCode: `<form action="/api/notes">\n  <TextField>\n    <Label>Notes</Label>\n    <TextArea name="notes" />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    examples: {
      uncontrolled: `<form action="/api/notes">\n  <TextField>\n    <Label>Notes</Label>\n    <TextArea name="notes" rows={4} defaultValue="Write notes" />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
      controlled: `<form action="/api/notes">\n  <TextField>\n    <Label>Notes</Label>\n    <TextArea name="notes" rows={4} />\n  </TextField>\n  <Button type="submit">Save</Button>\n</form>`,
    },
  },
  SearchField: {
    anatomyCode: `<SearchField onSubmit={setQuery} onClear={() => setQuery("")}>\n  <Label>Search</Label>\n  <Input name="query" />\n  <Button aria-label="Clear search">Clear</Button>\n</SearchField>`,
    examples: {
      uncontrolled: `<SearchField defaultValue="tickets" onSubmit={runSearch}>\n  <Label>Search</Label>\n  <Input name="query" />\n  <Button aria-label="Clear search">Clear</Button>\n</SearchField>`,
      controlled: `<SearchField value={query} onChange={setQuery} onSubmit={runSearch}>\n  <Label>Search</Label>\n  <Input name="query" />\n  <Button aria-label="Clear search">Clear</Button>\n</SearchField>`,
    },
  },
  Checkbox: {
    anatomyCode: `<Checkbox value="updates">\n  <span aria-hidden className="indicator" />\n  Receive updates\n</Checkbox>`,
    examples: {
      uncontrolled: `<Checkbox value="updates">\n  <span aria-hidden className="indicator" />\n  Receive updates\n</Checkbox>`,
      controlled: `<Checkbox selected={checked} onChange={setChecked}>\n  {({ selected }) => (\n    <>\n      <span aria-hidden data-selected={selected || undefined} />\n      Receive updates\n    </>\n  )}\n</Checkbox>`,
    },
  },
  CheckboxGroup: {
    anatomyCode: `<CheckboxGroup>\n  <Legend>Channels</Legend>\n  <Checkbox value="email">Email</Checkbox>\n  <Checkbox value="sms">SMS</Checkbox>\n</CheckboxGroup>`,
    examples: {
      uncontrolled: `<CheckboxGroup>\n  <Legend>Channels</Legend>\n  <Checkbox value="email"><span aria-hidden />Email</Checkbox>\n  <Checkbox value="sms"><span aria-hidden />SMS</Checkbox>\n</CheckboxGroup>`,
      controlled: `<CheckboxGroup value={channels} onChange={setChannels}>\n  <Legend>Channels</Legend>\n  <Checkbox value="email"><span aria-hidden />Email</Checkbox>\n  <Checkbox value="sms"><span aria-hidden />SMS</Checkbox>\n</CheckboxGroup>`,
    },
  },
  Radio: {
    anatomyCode: `<Radio value="compact">\n  <span aria-hidden className="indicator" />\n  Compact\n</Radio>`,
    examples: {
      uncontrolled: `<RadioGroup>\n  <Legend>Density</Legend>\n  <Radio value="compact"><span aria-hidden />Compact</Radio>\n  <Radio value="comfortable"><span aria-hidden />Comfortable</Radio>\n</RadioGroup>`,
      controlled: `<RadioGroup value={density} onChange={setDensity}>\n  <Legend>Density</Legend>\n  <Radio value="compact"><span aria-hidden />Compact</Radio>\n  <Radio value="comfortable"><span aria-hidden />Comfortable</Radio>\n</RadioGroup>`,
    },
  },
  RadioGroup: {
    anatomyCode: `<RadioGroup>\n  <Legend>Density</Legend>\n  <Radio value="compact"><span aria-hidden />Compact</Radio>\n  <Radio value="comfortable"><span aria-hidden />Comfortable</Radio>\n</RadioGroup>`,
  },
  Switch: {
    anatomyCode: `<Switch inputProps={{ "aria-label": "Publish" }}>\n  <span aria-hidden className="track"><span className="thumb" /></span>\n  Publish\n</Switch>`,
    examples: {
      uncontrolled: `<Switch inputProps={{ "aria-label": "Publish" }}>Publish</Switch>`,
      controlled: `<Switch selected={checked} onChange={setChecked} inputProps={{ "aria-label": "Publish" }}>Publish</Switch>`,
    },
  },
  NumberField: {
    anatomyCode: `<NumberField aria-label="Retries" defaultValue={3} min={0} max={10} />`,
    examples: {
      uncontrolled: `<NumberField aria-label="Retries" defaultValue={3} min={0} max={10} />`,
      controlled: `<NumberField aria-label="Retries" value={numberValue} onChange={setNumberValue} min={0} max={10} />`,
    },
  },
  Slider: {
    anatomyCode: `<Slider aria-label="Volume" value={volume} onChange={setVolume} />`,
    examples: {
      uncontrolled: `<Slider aria-label="Volume" defaultValue={42} />`,
      controlled: `<Slider aria-label="Volume" value={volume} onChange={setVolume} />`,
    },
  },
  ProgressBar: {
    anatomyCode: `<ProgressBar value={24}>\n  {({ percentage }) => <span>{Math.round(percentage ?? 0)}%</span>}\n</ProgressBar>`,
    examples: {
      uncontrolled: `<ProgressBar value={24}>\n  {({ percentage }) => <span>{Math.round(percentage ?? 0)}%</span>}\n</ProgressBar>`,
      controlled: `<ProgressBar value={volume}>\n  {({ percentage }) => <span>{Math.round(percentage ?? 0)}%</span>}\n</ProgressBar>`,
    },
  },
  Meter: {
    anatomyCode: `<Meter value={0.72}>72%</Meter>`,
    examples: {
      uncontrolled: `<Meter value={0.72}>72%</Meter>`,
      controlled: `<Meter value={0.89}>89%</Meter>`,
    },
  },
  Disclosure: {
    anatomyCode: `<Disclosure>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Built on details and summary.</DisclosurePanel>\n</Disclosure>`,
    examples: {
      uncontrolled: `<Disclosure defaultOpen>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Built on details and summary.</DisclosurePanel>\n</Disclosure>`,
      controlled: `<Disclosure>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Release notes loaded.</DisclosurePanel>\n</Disclosure>`,
    },
  },
  DisclosureGroup: {
    summary: "Groups related disclosure sections without imposing a visual accordion style.",
    nativeMarkup: "div role=group containing native details and summary disclosure controls.",
    anatomy: [
      ["DisclosureGroup", "Groups related Disclosure roots and exposes a styling boundary."],
      ["Disclosure", "Native details element that owns open state."],
      ["DisclosureTrigger", "Native summary element for the clickable row."],
      ["DisclosurePanel", "Content region associated with the trigger."],
    ],
    anatomyCode: `<DisclosureGroup>\n  <Disclosure>\n    <DisclosureTrigger>Installation</DisclosureTrigger>\n    <DisclosurePanel>Install with pnpm.</DisclosurePanel>\n  </Disclosure>\n  <Disclosure>\n    <DisclosureTrigger>Styling</DisclosureTrigger>\n    <DisclosurePanel>Style with data attributes.</DisclosurePanel>\n  </Disclosure>\n</DisclosureGroup>`,
    examples: {
      uncontrolled: `<DisclosureGroup>\n  <Disclosure defaultOpen>\n    <DisclosureTrigger>Installation</DisclosureTrigger>\n    <DisclosurePanel>Install with pnpm.</DisclosurePanel>\n  </Disclosure>\n  <Disclosure>\n    <DisclosureTrigger>Styling</DisclosureTrigger>\n    <DisclosurePanel>Style with data attributes.</DisclosurePanel>\n  </Disclosure>\n</DisclosureGroup>`,
      controlled: `<DisclosureGroup>\n  {sections.map((section) => (\n    <Disclosure key={section.id}>\n      <DisclosureTrigger>{section.title}</DisclosureTrigger>\n      <DisclosurePanel>{section.content}</DisclosurePanel>\n    </Disclosure>\n  ))}\n</DisclosureGroup>`,
    },
    keyboard: [
      ["Native behavior", "Each summary toggles its own details panel with Enter or Space."],
    ],
    data: ["data-slot", "data-open"],
    props: [
      ["children", "ReactNode", "Related disclosure sections."],
      ["className", "string", "Styling hook for the group wrapper."],
    ],
    ssr: "The group is static wrapper markup; each Disclosure serializes its own open attribute.",
  },
  DisclosurePanel: {
    summary: "The content region for a Disclosure, wired to the parent summary and open state.",
    nativeMarkup: "div content region inside native details.",
    anatomyCode: `<Disclosure>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Built on details and summary.</DisclosurePanel>\n</Disclosure>`,
    examples: {
      uncontrolled: `<Disclosure defaultOpen>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Built on details and summary.</DisclosurePanel>\n</Disclosure>`,
      controlled: `<Disclosure open={open} onChange={setOpen}>\n  <DisclosureTrigger>Release details</DisclosureTrigger>\n  <DisclosurePanel>Release notes loaded.</DisclosurePanel>\n</Disclosure>`,
    },
  },
  Tabs: {
    anatomyCode: `<Tabs>\n  <TabList>\n    <Tab tabKey="overview">Overview</Tab>\n    <Tab tabKey="api">API</Tab>\n  </TabList>\n  <TabPanel tabKey="overview">Overview content</TabPanel>\n  <TabPanel tabKey="api">API content</TabPanel>\n</Tabs>`,
  },
  Breadcrumbs: {
    anatomyCode: `<Breadcrumbs>\n  <BreadcrumbLink href="/">Home</BreadcrumbLink>\n  <BreadcrumbLink current>Components</BreadcrumbLink>\n</Breadcrumbs>`,
    examples: {
      uncontrolled: `<Breadcrumbs>\n  <BreadcrumbLink href="/">Home</BreadcrumbLink>\n  <BreadcrumbLink href="/components">Components</BreadcrumbLink>\n  <BreadcrumbLink current>Button</BreadcrumbLink>\n</Breadcrumbs>`,
      controlled: `<Breadcrumbs>\n  <BreadcrumbLink href="/">Home</BreadcrumbLink>\n  <BreadcrumbLink current>Components</BreadcrumbLink>\n</Breadcrumbs>`,
    },
  },
  ListBox: {
    anatomyCode: `<ListBox>\n  <ListBoxItem id="alpha">Alpha</ListBoxItem>\n  <ListBoxItem id="beta">Beta</ListBoxItem>\n</ListBox>`,
    examples: {
      uncontrolled: `<ListBox defaultValue="react">\n  <ListBoxItem id="react">React</ListBoxItem>\n  <ListBoxItem id="dom">DOM</ListBoxItem>\n</ListBox>`,
      controlled: `<ListBox value={choice} onChange={setChoice}>\n  <ListBoxItem id="react">React</ListBoxItem>\n  <ListBoxItem id="dom">DOM</ListBoxItem>\n</ListBox>`,
    },
  },
  ListBoxItem: {
    anatomyCode: `<ListBox>\n  <ListBoxItem id="react">React</ListBoxItem>\n</ListBox>`,
    examples: {
      uncontrolled: `<ListBox defaultValue="react">\n  <ListBoxItem id="react">React</ListBoxItem>\n  <ListBoxItem id="dom">DOM</ListBoxItem>\n</ListBox>`,
      controlled: `<ListBox value={choice} onChange={setChoice}>\n  <ListBoxItem id="react">React</ListBoxItem>\n  <ListBoxItem id="dom">DOM</ListBoxItem>\n</ListBox>`,
    },
  },
  Menu: {
    anatomyCode: `<Button command="toggle-popover" commandfor="actions-menu">\n  Actions\n</Button>\n<Popover id="actions-menu" popover="auto" anchor="actions-button">\n  <Menu>\n    <MenuSection aria-label="Actions">\n      <MenuItem id="rename">Rename</MenuItem>\n    </MenuSection>\n  </Menu>\n</Popover>`,
    examples: {
      uncontrolled: `<Button command="toggle-popover" commandfor="actions-menu">\n  Actions\n</Button>\n<Popover id="actions-menu" popover="auto">\n  <Menu>\n    <MenuSection aria-label="Actions">\n      <MenuItem id="rename">Rename</MenuItem>\n    </MenuSection>\n  </Menu>\n</Popover>`,
      controlled: `<Button onClick={() => setOpen((value) => !value)}>\n  Actions\n</Button>\n<Popover open={open}>\n  <Menu aria-label="Actions">\n    <MenuSection aria-label="Actions">\n      <MenuItem id="rename">Rename</MenuItem>\n    </MenuSection>\n  </Menu>\n</Popover>`,
    },
  },
  MenuItem: {
    anatomyCode: `<Menu>\n  <MenuSection aria-label="Actions">\n    <MenuItem id="rename">Rename</MenuItem>\n  </MenuSection>\n</Menu>`,
    examples: {
      uncontrolled: `<Popover defaultOpen>\n  <Menu>\n    <MenuSection aria-label="Actions">\n      <MenuItem id="rename">Rename</MenuItem>\n    </MenuSection>\n  </Menu>\n</Popover>`,
      controlled: `<Menu aria-label="Actions">\n  <MenuSection aria-label="Actions">\n    <MenuItem id="rename">Rename</MenuItem>\n  </MenuSection>\n</Menu>`,
    },
  },
  MenuSection: {
    anatomyCode: `<Menu>\n  <MenuSection aria-label="Actions">\n    <MenuItem id="rename">Rename</MenuItem>\n  </MenuSection>\n</Menu>`,
    examples: {
      uncontrolled: `<Popover defaultOpen>\n  <Menu>\n    <MenuSection aria-label="Actions">\n      <MenuItem id="rename">Rename</MenuItem>\n    </MenuSection>\n  </Menu>\n</Popover>`,
      controlled: `<Menu aria-label="Actions">\n  <MenuSection aria-label="Actions">\n    <MenuItem id="rename">Rename</MenuItem>\n  </MenuSection>\n</Menu>`,
    },
  },
  Select: {
    anatomyCode: `<Select>\n  <Label>Plan</Label>\n  <Button>\n    <SelectValue placeholder="Choose a plan" />\n  </Button>\n  <Description>Billing level for this workspace.</Description>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n      <ListBoxItem id="pro">Pro</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`,
    examples: {
      uncontrolled: `<Select defaultValue="basic">\n  <Label>Plan</Label>\n  <Button>\n    <SelectValue placeholder="Choose a plan" />\n  </Button>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n      <ListBoxItem id="pro">Pro</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`,
      controlled: `<Select value={choice} onChange={setChoice}>\n  <Label>Plan</Label>\n  <Button>\n    <SelectValue placeholder="Choose a plan" />\n  </Button>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n      <ListBoxItem id="pro">Pro</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`,
    },
  },
  SelectValue: {
    anatomyCode: `<Button>\n  <SelectValue placeholder="Choose a plan" />\n</Button>`,
    examples: {
      uncontrolled: `<Select>\n  <Label>Plan</Label>\n  <Button>\n    <SelectValue placeholder="Choose a plan" />\n  </Button>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`,
      controlled: `<Select value={choice} onChange={setChoice}>\n  <Label>Plan</Label>\n  <Button>\n    <SelectValue placeholder="Choose a plan" />\n  </Button>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="basic">Basic</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Select>`,
    },
  },
  Combobox: {
    anatomyCode: `<Combobox>\n  <Label>Framework</Label>\n  <Group>\n    <Input />\n    <Button>Show suggestions</Button>\n  </Group>\n  <Description>Choose or type a framework.</Description>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="react">React</ListBoxItem>\n      <ListBoxItem id="preact">Preact</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Combobox>`,
    examples: {
      uncontrolled: `<Combobox defaultValue="React" defaultSelectedValue="react">\n  <Label>Framework</Label>\n  <Group>\n    <Input />\n    <Button>Show suggestions</Button>\n  </Group>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="react">React</ListBoxItem>\n      <ListBoxItem id="preact">Preact</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Combobox>`,
      controlled: `<Combobox value={inputValue} onChange={setInputValue}>\n  <Label>Framework</Label>\n  <Group>\n    <Input />\n    <Button>Show suggestions</Button>\n  </Group>\n  <Popover>\n    <ListBox>\n      <ListBoxItem id="react">React</ListBoxItem>\n      <ListBoxItem id="preact">Preact</ListBoxItem>\n    </ListBox>\n  </Popover>\n</Combobox>`,
    },
  },
  SelectOption: {
    summary: "Native option row for actual select and datalist elements.",
    nativeMarkup: "option element with `value`, optional `label`, and disabled state.",
    anatomy: [
      ["SelectOption", "The selectable option element for a select-style picker."],
      ["Option value", "Uses `value` and optional text label for display."],
      ["State attributes", "data-value, data-label, and data-disabled expose styling hooks."],
    ],
    anatomyCode: `<select>\n  <SelectOption value="basic">Basic</SelectOption>\n  <SelectOption value="pro">Pro</SelectOption>\n</select>`,
    examples: {
      uncontrolled: `<select defaultValue="basic">\n  <SelectOption value="basic">Basic</SelectOption>\n  <SelectOption value="pro">Pro</SelectOption>\n</select>`,
      controlled: `<select value={choice} onChange={(event) => setChoice(event.currentTarget.value)}>\n  <SelectOption value="basic">Basic</SelectOption>\n  <SelectOption value="pro">Pro</SelectOption>\n</select>`,
    },
    keyboard: [
      ["Native behavior", "Uses browser option behavior in native select or datalist hosts."],
    ],
    data: ["data-disabled", "data-label", "data-value"],
    props: [
      ["value", "string", "Submitted option value."],
      ["label", "string", "Optional visible label string."],
      ["disabled", "boolean", "Marks option disabled."],
    ],
    ssr: "Option elements are ordinary HTML `<option>` semantics and serialize cleanly in server markup.",
  },
  ComboboxOption: {
    summary: "Native option row for actual combobox datalist elements.",
    nativeMarkup: "option element used by combobox text filtering and typeahead.",
    anatomy: [
      ["ComboboxOption", "The native option used by datalist suggestions."],
      ["Option value", "Tracks committed key and display text."],
      ["State attributes", "data-value, data-label, and data-disabled expose styling hooks."],
    ],
    anatomyCode: `<Combobox>\n  <Label>Framework</Label>\n  <Group>\n    <Input list="framework-options" />\n  </Group>\n  <datalist id="framework-options">\n    <ComboboxOption value="react">React</ComboboxOption>\n    <ComboboxOption value="preact">Preact</ComboboxOption>\n  </datalist>\n</Combobox>`,
    examples: {
      uncontrolled: `<Combobox defaultValue="React">\n  <Label>Framework</Label>\n  <Input list="framework-options" />\n  <datalist id="framework-options">\n    <ComboboxOption value="react">React</ComboboxOption>\n    <ComboboxOption value="preact">Preact</ComboboxOption>\n  </datalist>\n</Combobox>`,
      controlled: `<Combobox value={inputValue} onChange={setInputValue}>\n  <Label>Framework</Label>\n  <Input list="framework-options" />\n  <datalist id="framework-options">\n    <ComboboxOption value="react">React</ComboboxOption>\n    <ComboboxOption value="preact">Preact</ComboboxOption>\n  </datalist>\n</Combobox>`,
    },
    keyboard: [["Root", "Use input text entry, listbox open/close, and arrow-key navigation."]],
    data: ["data-value", "data-selected-key", "data-disabled", "data-placeholder"],
    props: [
      ["value", "string", "Option value used by hidden input or selection state."],
      ["label", "string", "Optional explicit option label."],
      ["disabled", "boolean", "Disables selection for this option."],
    ],
    ssr: "Options render as standard option tags, so SSR output is fully serializable.",
  },
  Autocomplete: {
    anatomyCode: `<Autocomplete defaultValue="">\n  <SearchField>\n    <Label>Framework</Label>\n    <Input />\n  </SearchField>\n  <ListBox>\n    <ListBoxItem id="react">React</ListBoxItem>\n    <ListBoxItem id="preact">Preact</ListBoxItem>\n  </ListBox>\n</Autocomplete>`,
    examples: {
      uncontrolled: `<Autocomplete defaultValue="">\n  <SearchField>\n    <Label>Framework</Label>\n    <Input />\n  </SearchField>\n  <Menu>\n    <MenuItem id="react">React</MenuItem>\n    <MenuItem id="preact">Preact</MenuItem>\n  </Menu>\n</Autocomplete>`,
      controlled: `<Autocomplete value={query} onChange={setQuery}>\n  <TextField>\n    <Label>Framework</Label>\n    <Input />\n  </TextField>\n  <ListBox>\n    <ListBoxItem id="react">React</ListBoxItem>\n    <ListBoxItem id="preact">Preact</ListBoxItem>\n  </ListBox>\n</Autocomplete>`,
    },
  },
  Calendar: {
    anatomyCode: `<Calendar defaultValue="2026-04-29" />`,
    examples: {
      uncontrolled: `<Calendar defaultValue="2026-04-29" />`,
      controlled: `<Calendar value={date} onChange={setDate} isDateDisabled={(day) => day < "2026-04-01"} />`,
    },
  },
  DateField: {
    anatomyCode: `<DateField defaultValue="2026-04-29" name="release">\n  <DateInput>\n    <DateSegment part="month" />\n    <DateSegment part="literal">/</DateSegment>\n    <DateSegment part="day" />\n    <DateSegment part="literal">/</DateSegment>\n    <DateSegment part="year" />\n  </DateInput>\n</DateField>`,
    examples: {
      uncontrolled: `<DateField defaultValue="2026-04-29" name="release">\n  <DateInput>\n    <DateSegment part="month" />\n    <DateSegment part="literal">/</DateSegment>\n    <DateSegment part="day" />\n    <DateSegment part="literal">/</DateSegment>\n    <DateSegment part="year" />\n  </DateInput>\n</DateField>`,
      controlled: `<DateField value={date} onChange={setDate}>\n  <DateInput>\n    <DateSegment part="year" />\n    <DateSegment part="literal">-</DateSegment>\n    <DateSegment part="month" />\n    <DateSegment part="literal">-</DateSegment>\n    <DateSegment part="day" />\n  </DateInput>\n</DateField>`,
    },
  },
  TimeField: {
    anatomyCode: `<TimeField defaultValue="09:30:00">\n  <DateInput>\n    <DateSegment part="hour" />\n    <DateSegment part="literal">:</DateSegment>\n    <DateSegment part="minute" />\n  </DateInput>\n</TimeField>`,
    examples: {
      uncontrolled: `<TimeField defaultValue="09:30:00">\n  <DateInput>\n    <DateSegment part="hour" />\n    <DateSegment part="literal">:</DateSegment>\n    <DateSegment part="minute" />\n  </DateInput>\n</TimeField>`,
      controlled: `<TimeField value={time} onChange={setTime}>\n  <DateInput>\n    <DateSegment part="hour" />\n    <DateSegment part="literal">:</DateSegment>\n    <DateSegment part="minute" />\n    <DateSegment part="literal">:</DateSegment>\n    <DateSegment part="second" />\n  </DateInput>\n</TimeField>`,
    },
  },
  DatePicker: {
    anatomyCode: `<DatePicker defaultValue="2026-04-29" name="release">\n  <DateField defaultValue="2026-04-29">\n    <DateInput><DateSegment part="month" /><DateSegment part="day" /><DateSegment part="year" /></DateInput>\n  </DateField>\n  <Button>Open calendar</Button>\n  <Popover><Calendar /></Popover>\n</DatePicker>`,
    examples: {
      uncontrolled: `<DatePicker defaultValue="2026-04-29" name="release">\n  <Button>Open calendar</Button>\n  <Popover><Calendar /></Popover>\n</DatePicker>`,
      controlled: `<DatePicker value={date} onChange={setDate}>\n  <Button>Open calendar</Button>\n  <Popover><Calendar value={date} onChange={setDate} /></Popover>\n</DatePicker>`,
    },
  },
  DateRangePicker: {
    anatomyCode: `<DateRangePicker defaultValue={{ start: "2026-04-22", end: "2026-04-25" }}>\n  <Button>Open range calendar</Button>\n  <Popover><RangeCalendar /></Popover>\n</DateRangePicker>`,
    examples: {
      uncontrolled: `<DateRangePicker defaultValue={{ start: "2026-04-22", end: "2026-04-25" }}>\n  <Button>Open range calendar</Button>\n  <Popover><RangeCalendar /></Popover>\n</DateRangePicker>`,
      controlled: `<DateRangePicker value={range} onChange={setRange}>\n  <Button>Open range calendar</Button>\n  <Popover><RangeCalendar value={range} onChange={setRange} /></Popover>\n</DateRangePicker>`,
    },
  },
  ColorField: {
    anatomyCode: `<ColorField defaultValue="#ff0000" name="accent">\n  <Input name="accentText" defaultValue="#ff0000" />\n</ColorField>`,
    examples: {
      uncontrolled: `<ColorField defaultValue="rgb(255, 0, 0)" name="accent" />`,
      controlled: `<ColorField value={color} onChange={setColor} />`,
    },
  },
  ColorSlider: {
    anatomyCode: `<ColorField defaultValue="#ff0000">\n  <ColorSlider channel="hue" />\n</ColorField>`,
    examples: {
      uncontrolled: `<ColorField defaultValue="#ff0000">\n  <ColorSlider channel="hue" />\n</ColorField>`,
      controlled: `<ColorField value={color} onChange={setColor}>\n  <ColorSlider channel="alpha" />\n</ColorField>`,
    },
  },
  ColorArea: {
    anatomyCode: `<ColorField defaultValue="#ff0000">\n  <ColorArea><ColorThumb /></ColorArea>\n</ColorField>`,
    examples: {
      uncontrolled: `<ColorField defaultValue="#ff0000">\n  <ColorArea><ColorThumb /></ColorArea>\n</ColorField>`,
      controlled: `<ColorField value={color} onChange={setColor}>\n  <ColorArea><ColorThumb /></ColorArea>\n</ColorField>`,
    },
  },
  ColorWheel: {
    anatomyCode: `<ColorField defaultValue="#ff0000">\n  <ColorWheel><ColorWheelTrack /><ColorThumb /></ColorWheel>\n</ColorField>`,
    examples: {
      uncontrolled: `<ColorField defaultValue="#ff0000">\n  <ColorWheel><ColorWheelTrack /><ColorThumb /></ColorWheel>\n</ColorField>`,
      controlled: `<ColorField value={color} onChange={setColor}>\n  <ColorWheel><ColorWheelTrack /><ColorThumb /></ColorWheel>\n</ColorField>`,
    },
  },
  ColorSwatchPicker: {
    anatomyCode: `<ColorField defaultValue="#ff0000">\n  <ColorSwatchPicker>\n    <ColorSwatchPickerItem color="#ff0000" />\n    <ColorSwatchPickerItem color="#00ff00" />\n  </ColorSwatchPicker>\n</ColorField>`,
    examples: {
      uncontrolled: `<ColorField defaultValue="#ff0000">\n  <ColorSwatchPicker>\n    <ColorSwatchPickerItem color="#ff0000" />\n    <ColorSwatchPickerItem color="#00ff00" />\n  </ColorSwatchPicker>\n</ColorField>`,
      controlled: `<ColorField value={color} onChange={setColor}>\n  <ColorSwatchPicker>\n    <ColorSwatchPickerItem color="#ff0000" />\n    <ColorSwatchPickerItem color="#00ff00" />\n  </ColorSwatchPicker>\n</ColorField>`,
    },
  },
  Dialog: {
    anatomyCode: `<Dialog aria-label="Preferences">Dialog content</Dialog>`,
    examples: {
      uncontrolled: `<Dialog aria-label="Preferences">Dialog content</Dialog>`,
      controlled: `<Dialog aria-label="Preferences">Dialog content</Dialog>`,
    },
  },
  Modal: {
    anatomyCode: `<Modal open={open} onChange={setOpen}>\n  <Dialog aria-label="Preferences">\n    Preferences\n  </Dialog>\n</Modal>`,
    examples: {
      uncontrolled: `<Button onClick={() => setOpen(true)}>Open modal</Button>\n<Modal open={open} onChange={setOpen}>\n  <Dialog aria-label="Preferences">\n    Preferences\n  </Dialog>\n</Modal>`,
      controlled: `<Button onClick={() => setOpen((value) => !value)}>Toggle modal</Button>\n<Modal open={open} onChange={setOpen}>\n  <Dialog aria-label="Preferences">\n    Preferences\n  </Dialog>\n</Modal>`,
    },
  },
  Popover: {
    anatomyCode: `<Popover>Popover content</Popover>`,
    examples: {
      uncontrolled: `<Button>Help</Button>\n<Popover>Popover content</Popover>`,
      controlled: `<Button onClick={() => setOpen((value) => !value)}>Toggle</Button>\n<Popover open={open}>Popover content</Popover>`,
    },
  },
  Tooltip: {
    anatomyCode: `<Tooltip>Saved</Tooltip>`,
    examples: {
      uncontrolled: `<Tooltip>Saved</Tooltip>`,
      controlled: `<Tooltip>Saved</Tooltip>`,
    },
  },
  Table: {
    anatomyCode: `<Table>\n  <TableHeader>\n    <Row><Column>Name</Column></Row>\n  </TableHeader>\n  <TableBody>\n    <Row><Cell>Ada</Cell></Row>\n  </TableBody>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableHeader><Row><Column>Name</Column></Row></TableHeader>\n  <TableBody><Row><Cell>Ada</Cell></Row></TableBody>\n</Table>`,
      controlled: `<Table>\n  <TableHeader><Row><Column>Name</Column><Column>Status</Column></Row></TableHeader>\n  <TableBody><Row selected><Cell>Ada</Cell><Cell>Active</Cell></Row></TableBody>\n</Table>`,
    },
  },
  TableHeader: {
    anatomyCode: `<Table>\n  <TableHeader>\n    <Row><Column>Feature</Column></Row>\n  </TableHeader>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableHeader>\n    <Row><Column>Feature</Column></Row>\n  </TableHeader>\n</Table>`,
      controlled: `<Table>\n  <TableHeader>\n    <Row><Column>Feature</Column><Column>Status</Column></Row>\n  </TableHeader>\n</Table>`,
    },
  },
  Column: {
    anatomyCode: `<Table>\n  <TableHeader>\n    <Row><Column>Name</Column><Column>Type</Column></Row>\n  </TableHeader>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableHeader>\n    <Row><Column>Name</Column></Row>\n  </TableHeader>\n</Table>`,
      controlled: `<Table>\n  <TableHeader>\n    <Row><Column>Name</Column><Column>Type</Column></Row>\n  </TableHeader>\n</Table>`,
    },
  },
  TableBody: {
    anatomyCode: `<Table>\n  <TableBody>\n    <Row><Cell>Button</Cell></Row>\n  </TableBody>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableBody>\n    <Row><Cell>Button</Cell></Row>\n  </TableBody>\n</Table>`,
      controlled: `<Table>\n  <TableBody>\n    <Row selected><Cell>Button</Cell></Row>\n  </TableBody>\n</Table>`,
    },
  },
  Row: {
    anatomyCode: `<Table>\n  <TableBody>\n    <Row><Cell>Feature</Cell></Row>\n  </TableBody>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableBody>\n    <Row><Cell>Feature</Cell></Row>\n  </TableBody>\n</Table>`,
      controlled: `<Table>\n  <TableBody>\n    <Row selected><Cell>Feature</Cell></Row>\n    <Row><Cell>Feature</Cell></Row>\n  </TableBody>\n</Table>`,
    },
  },
  Cell: {
    anatomyCode: `<Table>\n  <TableBody>\n    <Row><Cell>Cell</Cell></Row>\n  </TableBody>\n</Table>`,
    examples: {
      uncontrolled: `<Table>\n  <TableBody>\n    <Row><Cell>Cell</Cell></Row>\n  </TableBody>\n</Table>`,
      controlled: `<Table>\n  <TableBody>\n    <Row><Cell className="font-medium">Cell</Cell></Row>\n  </TableBody>\n</Table>`,
    },
  },
};

const fallbackExamples = (name: string, group: string): ComponentDoc["examples"] => {
  if (group === "Field anatomy") {
    return {
      uncontrolled: `<TextField id="profile">\n  <Label>Profile</Label>\n  <Input name="profile" />\n  <${name}>Content</${name}>\n</TextField>`,
      controlled: `<TextField aria-invalid={invalid}>\n  <${name}>Content</${name}>\n</TextField>`,
    };
  }

  if (group === "Table") {
    return {
      uncontrolled: `<${name}>Content</${name}>`,
      controlled: `<${name} className={className}>\n  Content\n</${name}>`,
    };
  }

  return {
    uncontrolled: `<${name} />`,
    controlled: `<${name} />`,
  };
};

const fallbackAnatomyCode = (name: string, group: string) => {
  if (group === "Field anatomy") return `<TextField>\n  <${name}>Content</${name}>\n</TextField>`;
  if (group === "Table") return `<Table>\n  <${name}>Content</${name}>\n</Table>`;
  return `<${name}>Content</${name}>`;
};

const componentNativeMarkup: Record<string, string> = {
  BreadcrumbLink: "a element rendered inside Breadcrumbs navigation.",
  Breadcrumbs: "nav with aria-label=Breadcrumbs and ordered list links supplied by the user.",
  Button: "button element by default, or slotted child when asChild is used.",
  CalendarCell: "td role=gridcell with selected and disabled state attributes.",
  CalendarGrid: "table role=grid with table header and body sections.",
  Checkbox: "label containing a visually hidden input type=checkbox and user-owned indicator.",
  CheckboxGroup: "fieldset root with legend and native checkbox inputs.",
  Column: "th element with scope=col unless overridden.",
  Combobox: "div root with label, input role=combobox, button, popover, and listbox.",
  ComboboxOption: "option element for native datalist-compatible suggestions.",
  DateSegment: "div role=spinbutton for an editable date or time segment.",
  Dialog: "div role=dialog or role=alertdialog with a required accessible name.",
  DropZone: "div role=group that accepts native file drag/drop events.",
  Disclosure: "details element with summary trigger and content panel.",
  DisclosurePanel: "div content region associated with the parent summary.",
  DisclosureTrigger: "summary element inside details.",
  FieldError: "div role=alert when field validation is invalid.",
  Fieldset: "fieldset element for related form controls.",
  FileTrigger: "label containing hidden input type=file.",
  GridList:
    "div role=grid with row-like GridListItem children, optionally grouped by GridListSection role=rowgroup.",
  Group: "div role=group.",
  Header: "header element.",
  Heading: "h1 through h6, controlled by the level prop.",
  Input: "input element; becomes role=combobox when used inside Combobox.",
  Keyboard: "kbd element.",
  Label: "label element wired to the field control.",
  Legend: "legend element inside fieldset.",
  Link: "a element.",
  ListBox: "div role=listbox with option children.",
  ListBoxItem: "div role=option with selected and disabled state.",
  Menu: "div role=menu with menuitem descendants.",
  MenuItem: "div role=menuitem.",
  Meter: "meter element.",
  Modal: "dialog element with aria-modal=true.",
  NumberField: "div field root with native input type=number by default.",
  Popover: "div popover shell, role=dialog outside picker context.",
  ProgressBar: "div role=progressbar with value attributes.",
  Radio: "label containing visually hidden input type=radio and user-owned indicator.",
  RadioGroup: "fieldset root with native radio inputs.",
  SearchField: "field root around input type=search.",
  Select: "div field root with hidden input, labelled button, popover, and listbox.",
  SelectOption: "option element for native select-compatible styling hooks.",
  SelectValue: "span that renders selected text or placeholder state.",
  Separator: "hr role=separator.",
  Slider: "input type=range.",
  SliderOutput: "output element.",
  Switch: "label containing input role=switch and user-owned track/thumb.",
  Tab: "button role=tab.",
  Table: "table element.",
  TableBody: "tbody element.",
  TableHeader: "thead element.",
  TabList: "div role=tablist.",
  TabPanel: "div role=tabpanel.",
  Tabs: "div root coordinating tablist, tabs, and panels.",
  Text: "p, span, div, small, or strong element.",
  TextArea: "textarea element.",
  TextField: "div field context around label, input, descriptions, and errors.",
  ToggleButton: "button with aria-pressed and data-selected state.",
  Toolbar: "div role=toolbar with roving-focus child controls.",
  Tooltip: "div role=tooltip.",
  Tree: "div role=tree with treeitem descendants.",
  TreeItem: "div role=treeitem.",
  VisuallyHidden: "div visually hidden with CSS while remaining in the accessibility tree.",
};

function componentAnatomyFor(
  name: string,
  group: string,
  fallback: ComponentDoc["anatomy"],
): ComponentDoc["anatomy"] {
  const specific: Record<string, ComponentDoc["anatomy"]> = {
    Button: [
      [
        "Button",
        "Native button root that receives disabled, pending, press, hover, and focus state.",
      ],
      [
        "Children",
        "Visible label or render prop content. This should provide the accessible name.",
      ],
      [
        "State attributes",
        "data-pressed, data-hovered, data-focused, and data-disabled support styling.",
      ],
    ],
    Checkbox: [
      ["Checkbox", "Label root that owns the visible layout and state data attributes."],
      [
        "Input",
        "Visually hidden native checkbox that keeps form, validation, and assistive tech behavior.",
      ],
      [
        "Indicator",
        "User-owned decorative or stateful mark styled from data-selected and data-indeterminate.",
      ],
    ],
    Combobox: [
      [
        "Combobox",
        "Field root that owns input value, selected value, hidden form value, and open state.",
      ],
      ["Label", "Names the text input."],
      ["Group", "Usually wraps Input and Button into one visual control."],
      ["Input", "Receives combobox role, value, expanded state, and listbox relationship."],
      ["Popover and ListBox", "Contain selectable suggestions; ListBoxItem commits selection."],
    ],
    Dialog: [
      ["Dialog", "Named dialog surface with role=dialog or role=alertdialog."],
      ["Heading or label", "Provides aria-labelledby or aria-label for the accessible name."],
      ["Content and actions", "Focusable controls and descriptive text owned by the dialog."],
    ],
    ListBox: [
      [
        "ListBox",
        "Roving-focus listbox root that owns selected item state and keyboard navigation.",
      ],
      ["ListBoxItem", "Option row registered by id and item label."],
      [
        "Section or load more item",
        "Optional structural parts for grouping or async loading states.",
      ],
    ],
    Menu: [
      ["Trigger", "Usually a Button or commandfor button that opens the menu popover."],
      ["Menu", "Action list with role=menu and arrow-key item movement."],
      ["MenuSection", "Optional group with a label."],
      ["MenuItem", "Action row with role=menuitem."],
    ],
    Modal: [
      ["Modal", "Native dialog element that opens with showModal after mount."],
      ["Dialog", "Named content surface rendered inside the modal."],
      ["Actions", "Buttons or links that complete or dismiss the modal task."],
    ],
    RadioGroup: [
      ["RadioGroup", "Fieldset root that names the mutually exclusive choices."],
      ["Legend", "Visible group label."],
      ["Radio", "Label root with hidden native radio input and custom indicator."],
    ],
    Select: [
      ["Select", "Field-aware root that owns selected value, open state, and hidden form input."],
      ["Label", "Names the trigger."],
      [
        "Button",
        "Receives aria-haspopup, aria-expanded, aria-controls, and trigger id from context.",
      ],
      ["SelectValue", "Displays selected item text or placeholder state."],
      ["Popover and ListBox", "Contain ListBoxItem rows and close on committed selection."],
    ],
    Switch: [
      ["Switch", "Label root that exposes selected, disabled, and focused state for styling."],
      ["Input", "Visually hidden native checkbox with role=switch."],
      ["Track and thumb", "User-owned visual elements styled from data-selected."],
    ],
    Tabs: [
      ["Tabs", "Root that owns selected tab value."],
      ["TabList", "Roving-focus tablist that handles arrow, Home, and End keys."],
      ["Tab", "Native button with role=tab, aria-selected, and panel relationship."],
      ["TabPanel", "Associated panel with role=tabpanel and hidden state."],
    ],
    TextField: [
      ["TextField", "Field context root that generates stable ids and state."],
      ["Label", "Names the input with htmlFor."],
      ["Input or TextArea", "Native editable control."],
      ["Description and FieldError", "Optional describedby and validation content."],
    ],
    Toolbar: [
      [
        "Toolbar",
        "Named role=toolbar container that reduces related controls to one page tab stop.",
      ],
      ["Controls", "Focusable child buttons, links, or inputs managed with roving tabIndex."],
      ["Separators", "Optional visual dividers that are skipped by keyboard movement."],
    ],
  };

  if (specific[name]) return specific[name]!;

  if (name.endsWith("Item")) {
    return [
      [name, "Registered item part with a stable id or value."],
      ["Text value", "Provides accessible text for announcements and typeahead where supported."],
      ["State attributes", "Selected, disabled, current, or value state is exposed for styling."],
    ];
  }

  if (name.endsWith("Section")) {
    return [
      [name, "Structural section that groups related items."],
      ["Label", "Visible or ARIA label names the grouped items when the pattern requires it."],
      ["Children", "Item components that inherit the parent collection or menu semantics."],
    ];
  }

  if (name.endsWith("Trigger")) {
    return [
      [name, "Trigger part that opens, toggles, or labels an associated popup or region."],
      ["Target", "Associated dialog, menu, tooltip, popover, or disclosure content."],
      [
        "State",
        "Open, expanded, or disabled state is reflected with ARIA/data attributes where implemented.",
      ],
    ];
  }

  if (group === "Date and time") {
    return [
      [name, "Date/time part with ISO value state, stable slots, and accessible roles."],
      ["Label or header", "Names the field, calendar, or date range context."],
      [
        "Grid or segments",
        "Calendar cells or date segments expose the intended semantic structure.",
      ],
    ];
  }

  if (name === "DropZone") {
    return [
      ["DropZone", "Role=group target that accepts file drags from the operating system."],
      ["Drag state", "data-drop-target is set while a file drag is over the zone."],
      ["Drop handler", "Use the native onDrop event and read event.dataTransfer.files."],
      ["Fallback action", "Pair with FileTrigger so keyboard and touch users can choose files."],
    ];
  }

  if (name === "FileTrigger") {
    return [
      ["FileTrigger", "Label root that activates a hidden native file input."],
      ["Input", "input type=file receives inputProps such as multiple, accept, and name."],
      ["Visible trigger", "User-owned content styled like a button or menu item."],
    ];
  }

  if (name === "DropIndicator") {
    return [
      ["DropIndicator", "Visual insertion target for sortable or drag/drop lists."],
      ["Position", "Communicates where dropped content will be inserted."],
      ["State hook", "Style with data attributes supplied by the owning drag/drop workflow."],
    ];
  }

  if (group === "Color") {
    return [
      [name, "Color picker part with CSS color state and user-owned styling."],
      ["Channel or swatch", "Represents a color value, channel, thumb, wheel, or swatch option."],
      [
        "State hook",
        "Slot and state attributes are available for styling without assuming a visual design.",
      ],
    ];
  }

  if (group === "Table") {
    return [
      [name, "Native table anatomy part."],
      [
        "Rows and cells",
        "Preserve table relationships through table, section, row, th, and td markup.",
      ],
      ["State attributes", "Selected and disabled state are exposed where the part supports them."],
    ];
  }

  if (group === "Transitions and toast") {
    return [
      [name, "Shell part for a transition participant or status notification."],
      [
        "Region or content",
        "Groups messages or marks the content that should be announced/styled.",
      ],
      ["State hook", "Slot and open state attributes are available for animation and styling."],
    ];
  }

  return [
    [name, `The ${name} root element or slot.`],
    ["Children", "User-owned content; keep the accessible name visible or explicitly labelled."],
    ["State attributes", "Data attributes expose state for styling without coupling to a theme."],
    ...fallback.slice(0, 1),
  ];
}

const wcagReferences = {
  reflow: {
    label: "WCAG 2.2: Reflow",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/reflow",
  },
  nonTextContrast: {
    label: "WCAG 2.2: Non-text Contrast",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast",
  },
  focusVisible: {
    label: "WCAG 2.2: Focus Visible",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible",
  },
  focusNotObscured: {
    label: "WCAG 2.2: Focus Not Obscured",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum",
  },
  keyboard: {
    label: "WCAG 2.2: Keyboard",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard",
  },
  focusOrder: {
    label: "WCAG 2.2: Focus Order",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order",
  },
  infoRelationships: {
    label: "WCAG 2.2: Info and Relationships",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships",
  },
  labelsInstructions: {
    label: "WCAG 2.2: Labels or Instructions",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions",
  },
  errorIdentification: {
    label: "WCAG 2.2: Error Identification",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification",
  },
  nameRoleValue: {
    label: "WCAG 2.2: Name, Role, Value",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value",
  },
  statusMessages: {
    label: "WCAG 2.2: Status Messages",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/status-messages",
  },
  hoverFocus: {
    label: "WCAG 2.2: Content on Hover or Focus",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus",
  },
  draggingMovements: {
    label: "WCAG 2.2: Dragging Movements",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements",
  },
  targetSize: {
    label: "WCAG 2.2: Target Size",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum",
  },
  pointerCancellation: {
    label: "WCAG 2.2: Pointer Cancellation",
    href: "https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation",
  },
};

const apgReferences = {
  breadcrumb: {
    label: "ARIA APG: Breadcrumb Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",
  },
  button: {
    label: "ARIA APG: Button Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
  },
  checkbox: {
    label: "ARIA APG: Checkbox Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
  },
  combobox: {
    label: "ARIA APG: Combobox Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
  },
  disclosure: {
    label: "ARIA APG: Disclosure Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  },
  link: {
    label: "ARIA APG: Link Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/link/",
  },
  dialog: {
    label: "ARIA APG: Dialog Modal Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
  },
  grid: {
    label: "ARIA APG: Grid Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
  },
  listbox: {
    label: "ARIA APG: Listbox Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/listbox/",
  },
  menuButton: {
    label: "ARIA APG: Menu Button Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/",
  },
  radio: {
    label: "ARIA APG: Radio Group Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
  },
  slider: {
    label: "ARIA APG: Slider Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/slider/",
  },
  spinbutton: {
    label: "ARIA APG: Spinbutton Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
  },
  switch: {
    label: "ARIA APG: Switch Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/",
  },
  tabs: {
    label: "ARIA APG: Tabs Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  },
  toolbar: {
    label: "ARIA APG: Toolbar Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/",
  },
  tooltip: {
    label: "ARIA APG: Tooltip Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/",
  },
  treeview: {
    label: "ARIA APG: Tree View Pattern",
    href: "https://www.w3.org/WAI/ARIA/apg/patterns/treeview/",
  },
};

const ariaReferences = {
  group: {
    label: "WAI-ARIA: group role",
    href: "https://w3c.github.io/aria/#group",
  },
  meter: {
    label: "WAI-ARIA: meter role",
    href: "https://w3c.github.io/aria/#meter",
  },
  progressbar: {
    label: "WAI-ARIA: progressbar role",
    href: "https://w3c.github.io/aria/#progressbar",
  },
  separator: {
    label: "WAI-ARIA: separator role",
    href: "https://w3c.github.io/aria/#separator",
  },
  status: {
    label: "WAI-ARIA: status role",
    href: "https://w3c.github.io/aria/#status",
  },
  table: {
    label: "WAI-ARIA: table role",
    href: "https://w3c.github.io/aria/#table",
  },
};

const componentReferences: Record<string, ComponentDoc["references"]> = {
  Autocomplete: [apgReferences.combobox],
  BreadcrumbLink: [apgReferences.breadcrumb],
  Breadcrumbs: [apgReferences.breadcrumb],
  Button: [apgReferences.button],
  Calendar: [apgReferences.grid],
  CalendarCell: [apgReferences.grid],
  CalendarGrid: [apgReferences.grid],
  CalendarGridBody: [apgReferences.grid],
  CalendarGridHeader: [apgReferences.grid],
  CalendarHeaderCell: [apgReferences.grid],
  Checkbox: [apgReferences.checkbox],
  CheckboxGroup: [apgReferences.checkbox],
  Cell: [ariaReferences.table],
  Collection: [apgReferences.listbox],
  CollectionBuilder: [apgReferences.listbox],
  ColorArea: [apgReferences.slider, wcagReferences.nameRoleValue],
  ColorField: [wcagReferences.labelsInstructions, wcagReferences.nameRoleValue],
  ColorPicker: [apgReferences.dialog, wcagReferences.nameRoleValue],
  ColorSlider: [apgReferences.slider],
  ColorSwatch: [wcagReferences.nameRoleValue],
  ColorSwatchPicker: [apgReferences.listbox],
  ColorSwatchPickerItem: [apgReferences.listbox],
  ColorThumb: [apgReferences.slider],
  ColorWheel: [apgReferences.slider],
  ColorWheelTrack: [apgReferences.slider],
  Column: [ariaReferences.table],
  ColumnResizer: [ariaReferences.separator],
  Combobox: [apgReferences.combobox],
  ComboboxOption: [apgReferences.combobox],
  ComboBoxValue: [apgReferences.combobox],
  DateField: [apgReferences.spinbutton],
  DateInput: [apgReferences.spinbutton],
  DatePicker: [apgReferences.dialog, apgReferences.grid],
  DateRangePicker: [apgReferences.dialog, apgReferences.grid],
  DateSegment: [apgReferences.spinbutton],
  Description: [wcagReferences.labelsInstructions],
  Dialog: [apgReferences.dialog],
  DialogTrigger: [apgReferences.dialog, apgReferences.button],
  Disclosure: [apgReferences.disclosure],
  DisclosureGroup: [apgReferences.disclosure],
  DisclosurePanel: [apgReferences.disclosure],
  DisclosureTrigger: [apgReferences.disclosure],
  DropIndicator: [wcagReferences.draggingMovements],
  DropZone: [wcagReferences.draggingMovements],
  FieldError: [wcagReferences.errorIdentification],
  Fieldset: [wcagReferences.infoRelationships, wcagReferences.labelsInstructions],
  FileTrigger: [wcagReferences.draggingMovements, apgReferences.button],
  Focusable: [wcagReferences.keyboard, wcagReferences.focusOrder],
  GridList: [apgReferences.grid],
  GridListHeader: [apgReferences.grid],
  GridListItem: [apgReferences.grid],
  GridListLoadMoreItem: [apgReferences.grid],
  GridListSection: [apgReferences.grid],
  Group: [ariaReferences.group],
  Header: [wcagReferences.infoRelationships],
  Heading: [wcagReferences.infoRelationships],
  Input: [wcagReferences.labelsInstructions],
  Keyboard: [wcagReferences.keyboard],
  Label: [wcagReferences.labelsInstructions],
  Legend: [wcagReferences.labelsInstructions],
  Link: [apgReferences.link],
  ListBox: [apgReferences.listbox],
  ListBoxItem: [apgReferences.listbox],
  ListBoxLoadMoreItem: [apgReferences.listbox],
  ListBoxSection: [apgReferences.listbox],
  Menu: [apgReferences.menuButton],
  MenuItem: [apgReferences.menuButton],
  MenuSection: [apgReferences.menuButton],
  MenuTrigger: [apgReferences.menuButton],
  Meter: [ariaReferences.meter],
  Modal: [apgReferences.dialog],
  ModalOverlay: [apgReferences.dialog],
  NumberField: [apgReferences.spinbutton],
  OverlayArrow: [wcagReferences.nameRoleValue],
  Popover: [wcagReferences.nameRoleValue],
  Pressable: [apgReferences.button],
  ProgressBar: [ariaReferences.progressbar],
  Radio: [apgReferences.radio],
  RadioGroup: [apgReferences.radio],
  RangeCalendar: [apgReferences.grid],
  ResizableTableContainer: [ariaReferences.table],
  Row: [ariaReferences.table],
  SearchField: [wcagReferences.labelsInstructions],
  Select: [apgReferences.listbox, apgReferences.button],
  SelectOption: [apgReferences.listbox],
  SelectValue: [apgReferences.listbox],
  Separator: [ariaReferences.separator],
  SharedElement: [wcagReferences.nameRoleValue],
  SharedElementTransition: [wcagReferences.nameRoleValue],
  Slider: [apgReferences.slider],
  SliderOutput: [apgReferences.slider],
  SliderThumb: [apgReferences.slider],
  SliderTrack: [apgReferences.slider],
  SubmenuTrigger: [apgReferences.menuButton],
  Switch: [apgReferences.switch],
  Tab: [apgReferences.tabs],
  Table: [ariaReferences.table, wcagReferences.infoRelationships],
  TableBody: [ariaReferences.table],
  TableHeader: [ariaReferences.table],
  TableLoadMoreItem: [ariaReferences.table],
  TabList: [apgReferences.tabs],
  TabPanel: [apgReferences.tabs],
  TabPanels: [apgReferences.tabs],
  Tabs: [apgReferences.tabs],
  Tag: [apgReferences.listbox],
  TagGroup: [apgReferences.listbox],
  TagList: [apgReferences.listbox],
  Text: [wcagReferences.infoRelationships],
  TextArea: [wcagReferences.labelsInstructions],
  TextField: [wcagReferences.labelsInstructions, wcagReferences.errorIdentification],
  TimeField: [apgReferences.spinbutton],
  ToggleButton: [apgReferences.button],
  ToggleButtonGroup: [ariaReferences.group, apgReferences.button],
  Toolbar: [apgReferences.toolbar],
  Tooltip: [apgReferences.tooltip, wcagReferences.hoverFocus],
  TooltipTrigger: [apgReferences.tooltip],
  Tree: [apgReferences.treeview],
  TreeHeader: [apgReferences.treeview],
  TreeItem: [apgReferences.treeview],
  TreeItemContent: [apgReferences.treeview],
  TreeLoadMoreItem: [apgReferences.treeview],
  TreeSection: [apgReferences.treeview],
  UNSTABLE_Toast: [ariaReferences.status, wcagReferences.statusMessages],
  UNSTABLE_ToastContent: [ariaReferences.status],
  UNSTABLE_ToastList: [ariaReferences.status],
  UNSTABLE_ToastRegion: [ariaReferences.status, wcagReferences.statusMessages],
  VisuallyHidden: [wcagReferences.nameRoleValue],
};

const groupReferences: Record<string, ComponentDoc["references"]> = {
  Collections: [apgReferences.listbox, wcagReferences.keyboard, wcagReferences.nameRoleValue],
  Color: [
    apgReferences.slider,
    apgReferences.listbox,
    wcagReferences.nameRoleValue,
    wcagReferences.nonTextContrast,
  ],
  "Choice inputs": [wcagReferences.keyboard, wcagReferences.nameRoleValue],
  "Date and time": [apgReferences.grid, apgReferences.spinbutton, wcagReferences.keyboard],
  "Disclosure and navigation": [wcagReferences.keyboard, wcagReferences.focusOrder],
  "Drag and drop": [
    wcagReferences.draggingMovements,
    wcagReferences.pointerCancellation,
    wcagReferences.keyboard,
  ],
  "Field anatomy": [wcagReferences.labelsInstructions, wcagReferences.errorIdentification],
  Overlays: [
    apgReferences.dialog,
    wcagReferences.focusOrder,
    wcagReferences.focusNotObscured,
    wcagReferences.nameRoleValue,
  ],
  Pickers: [apgReferences.combobox, apgReferences.listbox, wcagReferences.keyboard],
  Primitives: [
    wcagReferences.keyboard,
    wcagReferences.focusVisible,
    wcagReferences.reflow,
    wcagReferences.targetSize,
    wcagReferences.nameRoleValue,
  ],
  "Range and status": [apgReferences.slider, wcagReferences.nameRoleValue],
  Table: [wcagReferences.infoRelationships, ariaReferences.table],
  "Text inputs": [wcagReferences.labelsInstructions, wcagReferences.keyboard],
  "Transitions and toast": [wcagReferences.statusMessages, ariaReferences.status],
};

export const accessibilityReferenceCatalog = [
  ...Object.values(wcagReferences),
  ...Object.values(apgReferences),
  ...Object.values(ariaReferences),
] satisfies ComponentDoc["references"];

function referencesFor(name: string, group: string) {
  const deduped = new Map<string, ComponentDoc["references"][number]>();

  for (const reference of [
    ...(componentReferences[name] ?? []),
    ...(groupReferences[group] ?? []),
    wcagReferences.nameRoleValue,
  ]) {
    deduped.set(reference.href, reference);
  }

  return [...deduped.values()];
}

const componentAccessibility: Record<string, string[]> = {
  Combobox: [
    "Input receives combobox role, expanded state, active-descendant, popup relationship, and list autocomplete metadata.",
    "Listbox options are selected through the composed ListBox; committed value is mirrored to hidden form input when name is supplied.",
    "Use Label and Description slots so the editable picker has an accessible name and instructions.",
  ],
  Dialog: [
    "Provide either aria-label or aria-labelledby; unnamed dialogs are not accessible.",
    "Use Dialog inside Modal when the content blocks interaction with the page.",
    "Keep initial focus and close controls inside the dialog task.",
  ],
  DropZone: [
    "File drags from the operating system are accepted by preventing default dragover/drop behavior.",
    "data-drop-target is present while a file drag is over the zone, so users can style an active target state.",
    "Keyboard users need an equivalent FileTrigger or explicit move action near the drop zone.",
  ],
  ListBox: [
    "Exactly one enabled option is tabbable when no value is selected; arrow keys move through enabled options.",
    "Each option uses role=option, aria-selected, aria-disabled, and a stable id.",
    "Use aria-label when visual content is not plain text so typeahead and announcements have a useful label.",
  ],
  Modal: [
    "Modal renders a native dialog, opens with showModal, and sets aria-modal=true.",
    "Focus is restored to the previously focused element when the dialog closes.",
    "The dialog content still needs an accessible name through nested Dialog, aria-label, or aria-labelledby.",
  ],
  Select: [
    "Button receives labelled trigger semantics and aria-expanded/aria-controls for the listbox popup.",
    "ListBoxItem text is registered for SelectValue display and committed selection.",
    "Hidden input preserves native form participation when name is supplied.",
  ],
  Tabs: [
    "Only the selected tab is in the tab sequence; arrow keys move selection and focus inside the tablist.",
    "Each tab controls a matching tabpanel via aria-controls and aria-labelledby.",
    "Disabled tabs are skipped by roving focus.",
  ],
  Toolbar: [
    "Only one enabled child control is tabbable from the page tab sequence.",
    "Left/Right arrows move through horizontal toolbars; Up/Down arrows move through vertical toolbars.",
    "Home and End move to the first and last enabled controls.",
  ],
};

function accessibilityFor(name: string, group: string, fallback: string[]) {
  if (componentAccessibility[name]) return componentAccessibility[name]!;
  return fallback;
}

function propsWithClassName(props: ComponentDoc["props"]) {
  if (props.some(([prop]) => prop === "className")) return props;

  return [
    ["className", "string | function", "Static or state-derived class name."],
    ...props,
  ] satisfies ComponentDoc["props"];
}

const docs: ComponentDoc[] = componentGroups.flatMap((group) =>
  group.names.map((name) => {
    const defaults = groupDefaults[group.title];
    const override = overrides[name] ?? {};
    const examples = fallbackExamples(name, group.title);

    return {
      name,
      group: group.title,
      summary: override.summary ?? defaults!.summary,
      nativeMarkup: override.nativeMarkup ?? componentNativeMarkup[name] ?? defaults!.nativeMarkup,
      anatomy: override.anatomy ?? componentAnatomyFor(name, group.title, defaults!.anatomy),
      accessibility:
        override.accessibility ?? accessibilityFor(name, group.title, defaults!.accessibility),
      keyboard: override.keyboard ?? defaults!.keyboard,
      data: override.data ?? defaults!.data,
      references: override.references ?? referencesFor(name, group.title),
      ssr: override.ssr ?? defaults!.ssr,
      anatomyCode: fallbackAnatomyCode(name, group.title),
      ...override,
      props: propsWithClassName(override.props ?? defaults!.props),
      examples: {
        uncontrolled: override.examples?.uncontrolled ?? examples.uncontrolled,
        controlled: override.examples?.controlled ?? examples.controlled,
      },
    };
  }),
);

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const pageDefinitions: [string, string, string[]][] = [
  ["Primitives", "Button", ["Button"]],
  ["Primitives", "ToggleButton", ["ToggleButton"]],
  ["Primitives", "ToggleButtonGroup", ["ToggleButtonGroup", "ToggleButton"]],
  ["Primitives", "Link", ["Link"]],
  ["Primitives", "Text", ["Text"]],
  ["Primitives", "Heading", ["Heading"]],
  ["Primitives", "Separator", ["Separator"]],
  ["Primitives", "Group", ["Group"]],
  ["Primitives", "Toolbar", ["Toolbar"]],
  ["Primitives", "Pressable", ["Pressable"]],
  ["Primitives", "Focusable", ["Focusable"]],
  ["Primitives", "VisuallyHidden", ["VisuallyHidden"]],
  ["Field anatomy", "TextField", ["TextField", "Label", "Input", "Description", "FieldError"]],
  ["Field anatomy", "Fieldset", ["Fieldset", "Legend"]],
  ["Text inputs", "Input", ["Input", "Label", "Description", "FieldError"]],
  ["Text inputs", "TextArea", ["TextArea", "Label", "Description", "FieldError"]],
  ["Text inputs", "SearchField", ["SearchField", "Input", "Label"]],
  ["Choice inputs", "Checkbox", ["Checkbox"]],
  ["Choice inputs", "CheckboxGroup", ["CheckboxGroup", "Checkbox"]],
  ["Choice inputs", "RadioGroup", ["RadioGroup", "Radio"]],
  ["Choice inputs", "Switch", ["Switch"]],
  ["Range and status", "NumberField", ["NumberField", "Label", "Input"]],
  ["Range and status", "Slider", ["Slider", "SliderOutput", "SliderTrack", "SliderThumb"]],
  ["Range and status", "ProgressBar", ["ProgressBar"]],
  ["Range and status", "Meter", ["Meter"]],
  [
    "Disclosure and navigation",
    "Disclosure",
    ["Disclosure", "DisclosureTrigger", "DisclosurePanel"],
  ],
  ["Disclosure and navigation", "DisclosureGroup", ["DisclosureGroup", "Disclosure"]],
  ["Disclosure and navigation", "Tabs", ["Tabs", "TabList", "Tab", "TabPanels", "TabPanel"]],
  ["Disclosure and navigation", "Breadcrumbs", ["Breadcrumbs", "BreadcrumbLink"]],
  ["Collections", "Collection", ["Collection", "CollectionBuilder"]],
  ["Collections", "ListBox", ["ListBox", "ListBoxItem", "ListBoxSection", "ListBoxLoadMoreItem"]],
  ["Collections", "Menu", ["Menu", "MenuItem", "MenuSection", "MenuTrigger", "SubmenuTrigger"]],
  [
    "Collections",
    "GridList",
    ["GridList", "GridListItem", "GridListHeader", "GridListSection", "GridListLoadMoreItem"],
  ],
  ["Collections", "TagGroup", ["TagGroup", "TagList", "Tag"]],
  [
    "Collections",
    "Tree",
    ["Tree", "TreeItem", "TreeItemContent", "TreeHeader", "TreeSection", "TreeLoadMoreItem"],
  ],
  [
    "Pickers",
    "Select",
    ["Select", "SelectValue", "SelectOption", "Popover", "ListBox", "ListBoxItem"],
  ],
  ["Pickers", "Combobox", ["Combobox", "ComboBoxValue", "ComboboxOption", "Autocomplete"]],
  [
    "Date and time",
    "Calendar",
    [
      "Calendar",
      "CalendarGrid",
      "CalendarGridHeader",
      "CalendarGridBody",
      "CalendarHeaderCell",
      "CalendarCell",
    ],
  ],
  ["Date and time", "RangeCalendar", ["RangeCalendar", "CalendarGrid", "CalendarCell"]],
  ["Date and time", "DateField", ["DateField", "DateInput", "DateSegment"]],
  ["Date and time", "TimeField", ["TimeField", "DateInput", "DateSegment"]],
  ["Date and time", "DatePicker", ["DatePicker", "DateField", "Popover", "Calendar"]],
  ["Date and time", "DateRangePicker", ["DateRangePicker", "DateField", "RangeCalendar"]],
  [
    "Color",
    "Color",
    [
      "ColorField",
      "ColorPicker",
      "ColorSwatch",
      "ColorArea",
      "ColorSlider",
      "ColorWheel",
      "ColorWheelTrack",
      "ColorSwatchPicker",
      "ColorSwatchPickerItem",
      "ColorThumb",
    ],
  ],
  ["Drag and drop", "Drag and drop", ["DropZone", "FileTrigger", "DropIndicator"]],
  ["Overlays", "Dialog", ["Dialog"]],
  ["Overlays", "Modal", ["Modal", "ModalOverlay", "Dialog"]],
  ["Overlays", "Popover", ["Popover", "OverlayArrow"]],
  ["Overlays", "Tooltip", ["Tooltip", "TooltipTrigger"]],
  ["Table", "Table", ["Table", "TableHeader", "Column", "TableBody", "Row", "Cell"]],
  ["Table", "TableHeader", ["TableHeader", "Column"]],
  ["Table", "TableBody", ["TableBody", "Row", "Cell"]],
  ["Table", "Row", ["Row", "Cell"]],
  ["Transitions and toast", "Transitions", ["SharedElementTransition", "SharedElement"]],
  [
    "Transitions and toast",
    "Toast",
    ["UNSTABLE_ToastRegion", "UNSTABLE_ToastList", "UNSTABLE_Toast", "UNSTABLE_ToastContent"],
  ],
];

export const pages: ComponentPage[] = pageDefinitions
  .map(([group, title, names]) => {
    const defaults = groupDefaults[group]!;
    const pageDocs = names
      .map((name) => docs.find((doc) => doc.name === name))
      .filter((doc): doc is ComponentDoc => Boolean(doc));
    const primary = pageDocs[0];

    if (!primary) return undefined;

    return {
      title,
      slug: slugify(title),
      group,
      summary: primary.summary,
      nativeMarkup: primary.nativeMarkup ?? defaults.nativeMarkup,
      docs: pageDocs,
    };
  })
  .filter((page): page is ComponentPage => Boolean(page));

export const accessibilitySupportStatement = [
  "Components are designed to support WCAG 2.2 AA implementations when used correctly.",
  "Full WCAG conformance applies to complete pages, flows, and processes, so this library does not claim standalone WCAG conformance.",
  "WCAG 3 is not targeted because it is still a draft, not a W3C Recommendation.",
];

export const accessibilityAuditDimensions = [
  "nameRoleValue",
  "keyboardAccess",
  "focusOrder",
  "focusVisible",
  "labelsInstructions",
  "errorIdentification",
  "statusMessages",
  "pointerAlternatives",
  "contrastSensitiveStates",
  "targetSize",
] satisfies AccessibilityAuditDimension[];

export const accessibilityAuditStatusLabels = {
  covered: "Covered",
  "consumer responsibility": "Consumer responsibility",
  "not applicable": "Not applicable",
  "needs manual audit": "Needs manual audit",
} satisfies Record<AccessibilityAuditStatus, string>;

export const accessibilityAuditDimensionLabels = {
  nameRoleValue: "Name, role, value",
  keyboardAccess: "Keyboard access",
  focusOrder: "Focus order",
  focusVisible: "Focus visible",
  labelsInstructions: "Labels and instructions",
  errorIdentification: "Error identification",
  statusMessages: "Status messages",
  pointerAlternatives: "Pointer alternatives",
  contrastSensitiveStates: "Contrast-sensitive states",
  targetSize: "Target size",
} satisfies Record<AccessibilityAuditDimension, string>;

const formLabelGroups = new Set([
  "Field anatomy",
  "Text inputs",
  "Choice inputs",
  "Range and status",
  "Pickers",
  "Date and time",
  "Color",
  "Drag and drop",
]);

const errorComponents = new Set(["FieldError", "TextField", "Input", "TextArea", "SearchField"]);
const statusComponents = new Set([
  "ProgressBar",
  "Meter",
  "UNSTABLE_Toast",
  "UNSTABLE_ToastContent",
  "UNSTABLE_ToastList",
  "UNSTABLE_ToastRegion",
]);
const pointerOnlyRiskGroups = new Set(["Color", "Drag and drop"]);
const structuralGroups = new Set(["Primitives", "Field anatomy", "Table", "Transitions and toast"]);

function auditStatusesFor(doc: ComponentDoc): AccessibilityAuditEntry["statuses"] {
  const interactive = doc.keyboard.some(([key]) => key !== "Native behavior");
  let statusMessages: AccessibilityAuditStatus = "not applicable";
  let pointerAlternatives: AccessibilityAuditStatus = "covered";
  let keyboardAccess: AccessibilityAuditStatus = "not applicable";
  let focusOrder: AccessibilityAuditStatus = "not applicable";
  let labelsInstructions: AccessibilityAuditStatus = "consumer responsibility";
  let errorIdentification: AccessibilityAuditStatus = "consumer responsibility";
  let targetSize: AccessibilityAuditStatus = "not applicable";

  if (statusComponents.has(doc.name)) {
    statusMessages = "covered";
  }

  if (pointerOnlyRiskGroups.has(doc.group)) {
    pointerAlternatives = "needs manual audit";
  }

  if (interactive || !structuralGroups.has(doc.group)) {
    keyboardAccess = "covered";
    focusOrder = "covered";
    targetSize = "consumer responsibility";
  }

  if (
    formLabelGroups.has(doc.group) ||
    doc.references.some((reference) => reference.href === wcagReferences.labelsInstructions.href)
  ) {
    labelsInstructions = "covered";
  }

  if (errorComponents.has(doc.name)) {
    errorIdentification = "covered";
  }

  return {
    nameRoleValue: "covered",
    keyboardAccess,
    focusOrder,
    focusVisible: "needs manual audit",
    labelsInstructions,
    errorIdentification,
    statusMessages,
    pointerAlternatives,
    contrastSensitiveStates: "needs manual audit",
    targetSize,
  };
}

function hrefsFor(doc: ComponentDoc, predicate: (href: string) => boolean) {
  return doc.references.map((reference) => reference.href).filter(predicate);
}

export const accessibilityTraceabilityMatrix = docs.map((doc) => ({
  component: doc.name,
  group: doc.group,
  statuses: auditStatusesFor(doc),
  wcag: [
    ...new Set([
      ...hrefsFor(doc, (href) => href.includes("/WCAG22/Understanding/")),
      wcagReferences.focusVisible.href,
      wcagReferences.nonTextContrast.href,
      wcagReferences.targetSize.href,
    ]),
  ],
  apg: hrefsFor(
    doc,
    (href) => href.includes("/WAI/ARIA/apg/patterns/") || href.includes("w3c.github.io/aria/"),
  ),
  notes:
    "Component-owned roles, states, properties, keyboard behavior, and form semantics are covered by component tests and docs examples; page composition, labels, visual contrast, target size, zoom/reflow, and content-specific validation require implementation audit.",
})) satisfies AccessibilityAuditEntry[];

export const manualAuditScripts = [
  {
    title: "Keyboard-only component scripts",
    items: [
      "Button and Link: Tab to each control, activate with Enter, and activate buttons with Space.",
      "Toolbar: Tab into the toolbar, move with arrow keys, use Home and End, then Shift+Tab out.",
      "Tabs: Tab to the tablist, move tabs with arrows, verify the active tab controls the visible panel.",
      "ListBox, Menu, Select, Combobox, and Autocomplete: open, move through enabled options, skip disabled options, select, dismiss with Escape, and verify focus returns predictably.",
      "Dialog and Modal: open from the trigger, keep tab focus inside the dialog task, close with Escape or an explicit close control, and verify focus restoration.",
      "DatePicker and date fields: move among date segments or grid cells with keyboard controls and commit a date without pointer input.",
      "Color controls: move sliders, wheels, areas, and swatches with keyboard alternatives and verify the submitted value changes.",
      "Table: navigate cells, headers, sortable or resizable controls, and selected rows without losing table relationships.",
      "DropZone and FileTrigger: verify file selection has a keyboard path equivalent to drag and drop.",
      "Toast: trigger a notification and verify focus is not stolen while the status is announced.",
    ],
  },
  {
    title: "Screen reader smoke scripts",
    items: [
      "NVDA with Firefox: navigate each playground by landmarks and headings, then inspect focus announcements for name, role, value, state, and position.",
      "VoiceOver with Safari: use Tab and rotor navigation on each playground, then verify dialogs, popovers, list options, date grids, and status messages are announced with useful labels.",
    ],
  },
  {
    title: "Visual and responsive checks",
    items: [
      "Check 200% zoom and narrow viewport reflow without horizontal page scrolling for ordinary text content.",
      "Verify focus indicators are visible, have sufficient contrast, and are not obscured by sticky headers, overlays, or popovers.",
      "Check text contrast, Shiki syntax token contrast, and non-text contrast for borders, selected states, disabled states, focus rings, charts, swatches, and drag/drop targets in light and dark themes.",
      "Verify pointer targets meet WCAG 2.2 AA target-size exceptions or have spacing that prevents accidental activation.",
      "Enable reduced motion and verify transitions, popovers, toasts, and shared-element effects remain usable.",
    ],
  },
];
