import type { ComponentDoc, ComponentGroup, PartProp } from "./types.js";

const imp = (names: string[]) => `import { ${names.join(", ")} } from "@comp0/react";`;
const p = (
  name: string,
  kind: ComponentDoc["parts"][number]["kind"],
  description: string,
  ownsDom = true,
  optional = false,
  props?: PartProp[],
) => ({ name, kind, description, ownsDom, optional: optional || undefined, props });
const prop = (name: string, type: string, description: string): PartProp => ({
  name,
  type,
  description,
});
type LessonCopy = Pick<ComponentDoc, "summary" | "analogy" | "whenToUse" | "steps">;
const lesson = (
  summary: string,
  analogy: string,
  whenToUse: string,
  first: string,
  second: string,
  third: string,
  code: string,
): LessonCopy => ({
  summary,
  analogy,
  whenToUse,
  steps: [
    { title: "Add the main part", explanation: first },
    { title: "Add the supporting parts", explanation: second },
    { title: "Make the behavior clear", explanation: third, code },
  ],
});
const lessons: Record<string, LessonCopy> = {
  button: lesson(
    "A familiar native button for one immediate action.",
    "Like a doorbell: one press sends one clear request.",
    "Use it to save, delete, open, or submit—not to change pages.",
    "Put Button where the action happens.",
    "Write a short verb such as Save.",
    'Connect onClick, or use type="submit" in a form.',
    "<Button onClick={save}>Save</Button>",
  ),
  "toggle-button": lesson(
    "A button that stays on or off after a press.",
    "Like a light switch that shows its own position.",
    "Use one for an independent setting or a group for small formatting choices.",
    "Start with one ToggleButton.",
    "Wrap related toggles in ToggleButtonGroup; give each button a value when the group should manage the selection.",
    'Pass type="single" or type="multiple" with value/defaultValue and onChange on the group, or keep defaultSelected per button when the group only organizes them.',
    '<ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton></ToggleButtonGroup>',
  ),
  link: lesson(
    "A real anchor for travelling to another URL.",
    "Like a signpost that points somewhere else.",
    "Use it when the result is navigation, not a local action.",
    "Add Link at the place people need to leave from.",
    "Set href to the real destination.",
    "Use words that say where the destination is.",
    '<Link href="/settings">Settings</Link>',
  ),
  "file-trigger": lesson(
    "A visible label that asks the browser for files.",
    "Like asking a receptionist to open the filing cabinet.",
    "Use it when a person must choose local files.",
    "Style FileTrigger itself and give it clear words such as Upload photo.",
    "Put accept, multiple, name, and onChange in inputProps.",
    "The native input stays visually hidden but focusable by default, so keyboard users can reach it.",
    '<FileTrigger inputProps={{ name: "photo" }}>Upload photo</FileTrigger>',
  ),
  "visually-hidden": lesson(
    "Extra words that screen readers can hear but sighted people do not see.",
    "Like a quiet backstage narrator.",
    "Use it for helpful context that would make the visible screen noisy.",
    "Write the missing context first.",
    "Wrap only that extra text.",
    "Keep the visible control and its normal label visible.",
    "<VisuallyHidden>Loading messages</VisuallyHidden>",
  ),
  "text-field": lesson(
    "A shared field brain that connects a label, one text input, help, and errors.",
    "Like a name tag kit: every piece knows which input it belongs to.",
    "Use it for a one-line text value such as an email or name.",
    "Start TextField with Label and Input.",
    "Add Description for a useful hint and FieldError for validation feedback.",
    "Give Input a native name so a form can send its value.",
    '<TextField><Label>Email</Label><Input name="email" /></TextField>',
  ),
  "text-area": lesson(
    "A multi-line native text box with the same label and feedback pieces.",
    "Like a bigger notebook instead of a single-line sticky note.",
    "Use it when people need to write a note, message, or longer answer.",
    "Start a TextField with Label.",
    "Put TextArea inside it instead of Input.",
    "Give TextArea a name so the full text submits.",
    '<TextField><Label>Notes</Label><TextArea name="notes" /></TextField>',
  ),
  fieldset: lesson(
    "A native border and name for a related set of controls.",
    "Like a folder tab that names everything inside the folder.",
    "Use it for a group of choices such as contact methods.",
    "Wrap related controls in Fieldset.",
    "Put one short Legend first to name the group.",
    "Use disabled, invalid, or required on the group when that rule applies to all children.",
    "<Fieldset><Legend>Contact choices</Legend></Fieldset>",
  ),
  "search-field": lesson(
    "A labelled search box with an optional erase button.",
    "Like a library search desk with an eraser beside the query.",
    "Use it for a query that filters or finds things.",
    "Start with SearchField, Label, and SearchFieldInput.",
    "Add SearchFieldClear if clearing a query is useful.",
    "Name the input when the query should be submitted.",
    '<SearchField><Label>Search</Label><SearchFieldInput name="q" /></SearchField>',
  ),
  checkbox: lesson(
    "One tick box or a collection that can have several ticks.",
    "Like a sheet of stickers: you can keep more than one.",
    "Use it for independent yes/no choices or multiple selections.",
    "Start with a labelled Checkbox.",
    "Wrap related boxes in CheckboxGroup and give each value.",
    "Give the group a name when selected values should submit.",
    '<CheckboxGroup name="topics"><Checkbox value="news">News</Checkbox></CheckboxGroup>',
  ),
  radio: lesson(
    "A set of choices where one choice wins.",
    "Like choosing one seat in a row of single-seat chairs.",
    "Use it for one choice from a short visible list.",
    "Start RadioGroup with a name.",
    "Add one Radio per choice, each with a different value.",
    "Use defaultValue to show the starting choice.",
    '<RadioGroup name="plan" defaultValue="pro"><Radio value="pro">Pro</Radio></RadioGroup>',
  ),
  switch: lesson(
    "An on/off setting backed by a native checkbox.",
    "Like a wall switch with an honest wire behind it.",
    "Use it for a setting that plainly means on or off.",
    "Add Switch beside its setting words.",
    "Choose defaultSelected when it needs a starting state.",
    "Give it a name if a form must send the setting.",
    '<Switch name="alerts">Email alerts</Switch>',
  ),
  "number-field": lesson(
    "A native number box for values people may type.",
    "Like a small counter with guardrails.",
    "Use it for quantities such as guests, price, or count.",
    "Add NumberField with a clear label nearby.",
    "Set min, max, and step when the range matters.",
    "Name it so the numeric value submits.",
    '<NumberField name="guests" defaultValue={2} min={1} />',
  ),
  slider: lesson(
    "A native range control for a value along a track.",
    "Like a dimmer rail from quiet to loud.",
    "Use it when a range is easy to understand by position.",
    "Add Slider with a visible label.",
    "Set min, max, and step to make the range honest.",
    "Name it if the chosen value belongs in a form.",
    '<Slider name="volume" defaultValue={30} min={0} max={100} />',
  ),
  accordion: lesson(
    "A stack of expandable answers.",
    "Like a row of envelopes: open the one you want to read.",
    "Use it to hide optional detail while keeping headings visible.",
    "Start Accordion with one AccordionItem and value.",
    "Put Header and Trigger before the matching Panel.",
    "Use defaultValue for the item that should begin open.",
    '<Accordion defaultValue="one"><AccordionItem value="one"><AccordionHeader><AccordionTrigger>Details</AccordionTrigger></AccordionHeader><AccordionPanel>More information.</AccordionPanel></AccordionItem></Accordion>',
  ),
  disclosure: lesson(
    "One button that shows or hides its own extra content.",
    "Like lifting one flap on a greeting card.",
    "Use it for one small optional detail.",
    "Start Disclosure with DisclosureTrigger.",
    "Put DisclosurePanel immediately after the trigger.",
    "Use defaultOpen when the detail should start visible.",
    "<Disclosure><DisclosureTrigger>Details</DisclosureTrigger><DisclosurePanel>More information.</DisclosurePanel></Disclosure>",
  ),
  tabs: lesson(
    "A set of headings that swaps one panel at a time.",
    "Like tabs in a paper binder.",
    "Use it for peer sections where only one needs to be visible.",
    "Start Tabs with a starting value.",
    "Give each Tab and its TabPanel the same tab id.",
    "Put the Tab elements together inside TabList.",
    '<Tabs defaultValue="one"><TabList><Tab tab="one">One</Tab></TabList><TabPanel tab="one">Panel one</TabPanel></Tabs>',
  ),
  breadcrumbs: lesson(
    "A trail of links showing where this page sits.",
    "Like crumbs showing the path back through a forest.",
    "Use it when pages live inside a clear hierarchy.",
    "Start Breadcrumbs around the trail.",
    "Add BreadcrumbLink for each place people can return to.",
    "Mark the current page as current instead of making it a misleading link.",
    '<Breadcrumbs><BreadcrumbLink href="/">Home</BreadcrumbLink></Breadcrumbs>',
  ),
  "tag-group": lesson(
    "A row of removable, selectable little labels.",
    "Like luggage tags: keep the ones that apply, pull off the rest.",
    "Use it for filters, keywords, and picked options.",
    "Start TagGroup with an aria-label.",
    "Add a Tag with a value for each label.",
    "Wire onRemove for removal with Delete, and value/onChange for selection.",
    '<TagGroup aria-label="Filters" onRemove={remove}><Tag value="news">News</Tag></TagGroup>',
  ),
  resizer: lesson(
    "A separator you drag or arrow to resize the thing beside it.",
    "Like the divider bar between two window panes.",
    "Use it for adjustable panes and composable column resizing.",
    "Place Resizer inside the element it should resize.",
    "Keep the size in your state: pass size and apply it back as a style.",
    "Set min and max so dragging and End or Home stay inside sane bounds.",
    "<Resizer size={width} min={120} max={320} onResize={setWidth} />",
  ),
  "grid-list": lesson(
    "A list of rows where each row can hold its own controls.",
    "Like a file manager: pick a row, or use the tools sitting on it.",
    "Use it when rows need buttons or fields inside them; use ListBox for plain options.",
    "Start GridList with an aria-label.",
    "Add a GridListItem with a value for each row.",
    "Put row actions inside the row; ArrowRight reaches them without adding tab stops.",
    '<GridList aria-label="Files"><GridListItem value="report">report.pdf<Button>Share</Button></GridListItem></GridList>',
  ),
  table: lesson(
    "A native table you can walk cell by cell from the keyboard.",
    "Like a spreadsheet: one focus that moves in two directions.",
    "Use it for records where rows and columns both carry meaning.",
    "Start Table with TableHeader and one TableColumn per column.",
    "Add a TableRow of TableCell parts to TableBody for each record.",
    "Arrow keys move one cell; Home and End travel the row; Ctrl jumps to the corners.",
    '<Table aria-label="People"><TableHeader><TableRow><TableColumn>Name</TableColumn></TableRow></TableHeader><TableBody><TableRow><TableCell>Ada</TableCell></TableRow></TableBody></Table>',
  ),
  "list-box": lesson(
    "A keyboard-friendly list for selecting an item.",
    "Like a tray of labelled choices with one highlighted card.",
    "Use it for choice lists that are not necessarily a form select.",
    "Start ListBox with an aria-label.",
    "Add ListBoxItem for each selectable item.",
    "Use ListBoxSection when a long list needs labelled groups.",
    '<ListBox aria-label="Color"><ListBoxItem value="red">Red</ListBoxItem></ListBox>',
  ),
  menu: lesson(
    "A compact list of actions opened by a button.",
    "Like a restaurant menu: choose an action, then the menu goes away.",
    "Use it for actions, not choosing a persistent form value.",
    "Start Menu with MenuTrigger.",
    "Place MenuPopover and MenuItem after the trigger.",
    "Give MenuPopover an aria-label when its purpose is not obvious.",
    '<Menu><MenuTrigger>Actions</MenuTrigger><MenuPopover aria-label="Actions"><MenuItem>Archive</MenuItem></MenuPopover></Menu>',
  ),
  select: lesson(
    "A button that opens a list and keeps one chosen value.",
    "Like a closed box that shows the label of the thing inside.",
    "Use it for one form choice from a known list.",
    "Start Select with a value or defaultValue.",
    "Put SelectValue inside SelectTrigger, then wrap the trigger and SelectPopover in Popover.",
    "Select owns the value, field, and form serialization; Popover owns open state, top-layer popup lifecycle, Escape, and light dismissal.",
    '<Select name="size" defaultValue="small"><Label>Size</Label><Popover><SelectTrigger><SelectValue /></SelectTrigger><SelectPopover><SelectOption value="small">Small</SelectOption></SelectPopover></Popover></Select>',
  ),
  combobox: lesson(
    "A text box that can also offer matching choices.",
    "Like a librarian who listens while you type and suggests books.",
    "Use it when people may type to narrow a long set of choices.",
    "Start Combobox with a labelled ComboboxInput.",
    "Wrap ComboboxInput and ComboboxPopover in Popover; ComboboxPopover remains the listbox of results.",
    "Combobox owns the selected value, field, and form serialization; Popover owns open state, top-layer popup lifecycle, Escape, and light dismissal.",
    '<Combobox name="city"><Label>City</Label><Popover><ComboboxInput /><ComboboxPopover><ComboboxOption value="Paris">Paris</ComboboxOption></ComboboxPopover></Popover></Combobox>',
  ),
  dialog: lesson(
    "A modal layer that asks people to finish or dismiss a focused task.",
    "Like stepping into a small room before returning to the hallway.",
    "Use it for work that should temporarily block the page behind it.",
    "Start Dialog with DialogTrigger.",
    "Put a labelled DialogContent after the trigger.",
    "Keep a clear close or finish action inside the content.",
    '<Dialog><DialogTrigger>Open details</DialogTrigger><DialogContent aria-label="Details">Details</DialogContent></Dialog>',
  ),
  "alert-dialog": lesson(
    "A modal layer for a serious decision that needs attention.",
    "Like a stop sign before a dangerous turn.",
    "Use it before destructive or hard-to-undo actions.",
    "Start AlertDialog with the button that begins the decision.",
    "Put plain consequences and clear choices in AlertDialogContent.",
    "Make the safe or cancel choice easy to find.",
    '<AlertDialog><DialogTrigger>Delete</DialogTrigger><AlertDialogContent aria-label="Delete item">This cannot be undone.</AlertDialogContent></AlertDialog>',
  ),
  popover: lesson(
    "A small non-modal layer attached to a trigger.",
    "Like a note that pops out beside the thing it explains.",
    "Use it for extra controls or detail that should not block the page.",
    "Start Popover with PopoverTrigger.",
    "Put PopoverContent after it and pick a placement such as bottom start.",
    "Use a visible label for the trigger.",
    '<Popover><PopoverTrigger>More</PopoverTrigger><PopoverContent placement="bottom start" offset={8}><PopoverArrow />Extra choices</PopoverContent></Popover>',
  ),
  tooltip: lesson(
    "A short description revealed from an existing control.",
    "Like a tiny sticky note that appears when you pause over an icon.",
    "Use it for brief help, never for essential instructions.",
    "Start Tooltip with the control people already use.",
    "Add TooltipPopover with one short explanation, placed on the side you want, and a TooltipArrow caret styled to point back at the trigger.",
    "Give an icon-only trigger its own aria-label too.",
    '<Tooltip><TooltipTrigger aria-label="More information">i</TooltipTrigger><TooltipPopover placement="top" offset={6}>Helpful detail<TooltipArrow /></TooltipPopover></Tooltip>',
  ),
  meter: lesson(
    "A native gauge for a measurement within a known range.",
    "Like a fuel gauge: a level, not a task getting done.",
    "Use it for usage levels such as storage, battery, or password strength.",
    "Add Meter where the measurement belongs and pass value with min and max.",
    "Name it with a wired Label or an aria-label.",
    "Set low, high, and optimum when parts of the range are good or bad; style via the --comp0-meter-value variable.",
    '<Meter aria-label="Storage used" value={64} min={0} max={100} low={50} high={85} />',
  ),
  "progress-bar": lesson(
    "A native progress element for how much of a task is done.",
    "Like a moving truck's loading gauge filling toward full.",
    "Use it while work completes over time, such as an upload.",
    "Add ProgressBar where the task's status belongs.",
    "Name it with a wired Label or an aria-label.",
    "Pass value as the completed fraction of max, or omit value while the total is unknown; style the fill via the --comp0-progress-value variable.",
    '<ProgressBar aria-label="Uploading photos" value={0.4} />',
  ),
  separator: lesson(
    "A native rule that divides content into visually distinct groups.",
    "Like the printed line between sections on a paper form.",
    "Use it between groups of content or controls that should read as distinct.",
    "Place Separator between the groups it divides.",
    'Set orientation="vertical" between items in a horizontal row and give it a width and height.',
    'Pass role="presentation" when the line is purely decorative so nothing extra is announced.',
    '<Separator orientation="vertical" />',
  ),
  "skip-link": lesson(
    "A hidden link that lets keyboard users jump past repeated content.",
    "Like an express elevator straight past the lobby floors.",
    "Use it as the first focusable element so keyboard users can bypass navigation (WCAG 2.4.1).",
    "Put SkipLink first inside body, before the repeated navigation.",
    'Point href at the main content, such as "#main".',
    "Give the target element the matching id and tabIndex={-1} so focus lands there.",
    '<SkipLink href="#main">Skip to main content</SkipLink>',
  ),
  toast: lesson(
    "A short status message that appears, announces itself, and leaves on its own.",
    "Like a waiter briefly telling you the kitchen got your order.",
    "Use it to confirm background results such as saves; keep anything needing a decision in a dialog.",
    "Wrap the app in ToastProvider and call notify from useToast where results happen.",
    "Add one ToastRegion whose render prop returns a Toast with a ToastDismiss inside.",
    'Use kind "alert" plus timeout null for urgent messages people must not miss.',
    "<ToastRegion>{(toast) => <Toast toast={toast}>{toast.content}<ToastDismiss /></Toast>}</ToastRegion>",
  ),
  toolbar: lesson(
    "A labelled strip of controls that share one tab stop.",
    "Like the tool tray beside a workbench: everything at hand, one reach away.",
    "Use it when several related controls would otherwise each cost a Tab press.",
    "Wrap the controls in Toolbar and give it an aria-label.",
    "Group related toggles in ToggleButtonGroup so their relationship is announced.",
    "Pick orientation to match the layout; arrow keys follow it automatically.",
    '<Toolbar aria-label="Text formatting"><ToggleButtonGroup type="multiple" aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton></ToggleButtonGroup></Toolbar>',
  ),
};
const accessibility: Record<string, string[]> = {
  button: [
    "Use a visible verb that describes the action.",
    "Keep a visible focus ring.",
    "Use Link instead when the action changes the URL.",
  ],
  "toggle-button": [
    "Give icon-only toggles an aria-label.",
    "Make the selected state visible, not only color.",
    "Explain what on and off mean when it is not obvious.",
  ],
  link: [
    "Make link text say where it goes.",
    "Do not use a Link for an in-page action.",
    "Keep the current page identifiable in a breadcrumb trail.",
  ],
  "file-trigger": [
    "Name the visible trigger after the file task.",
    "Show accepted file types in visible help when needed.",
    "The input ships visually hidden but focusable; do not re-hide it with the hidden attribute.",
  ],
  "visually-hidden": [
    "Use it for extra context, not to hide essential visible instructions.",
    "Do not accidentally hide the only focusable control.",
    "Keep hidden text short and useful.",
  ],
  "text-field": [
    "Use Label so the input has a clear name.",
    "Put Description and FieldError near their field.",
    "Do not rely on placeholder text as the only label.",
  ],
  "text-area": [
    "Give the multi-line box a visible Label.",
    "Explain character limits in Description when they matter.",
    "Use FieldError to state what needs fixing.",
  ],
  fieldset: [
    "Put Legend first so the group has a name.",
    "Use it for related controls, not for decorative borders.",
    "Keep individual choices labelled too.",
  ],
  "search-field": [
    "Label the search purpose, even when the placeholder says Search.",
    "Give the clear button understandable text or an aria-label.",
    "Announce result counts outside the input when results update.",
    'Pass as="search" when this is the page\'s search landmark; the native element announces it.',
  ],
  checkbox: [
    "Each checkbox needs visible choice text.",
    "Use Fieldset and Legend to name a collection.",
    "Show indeterminate state with more than color.",
  ],
  radio: [
    "Name the group with a Legend or aria-label.",
    "Use radio only when one choice is allowed.",
    "Keep every option label easy to click and read.",
  ],
  switch: [
    "Label the setting, not merely the current state.",
    "Make on and off understandable without color.",
    "Use a checkbox instead when the choice belongs in a multi-select list.",
  ],
  "number-field": [
    "Label the number and its unit.",
    "Set min, max, and step when they convey a real limit.",
    "Show validation feedback in text, not only color.",
  ],
  slider: [
    "Give the range a visible name.",
    "Make minimum, maximum, and current meaning understandable.",
    "Prefer NumberField when exact typing matters more than quick adjustment.",
  ],
  accordion: [
    "Write trigger headings that describe the hidden content.",
    "Keep the expanded state visually clear.",
    "Do not hide important error messages inside a collapsed item.",
  ],
  disclosure: [
    "Use trigger text that says what will appear.",
    "Keep open and closed state visible.",
    "Do not put a nested interactive control inside the trigger.",
  ],
  tabs: [
    "Keep tab names short and distinct.",
    "Ensure each Tab has a matching TabPanel key.",
    "Do not use tabs to hide unrelated page navigation.",
  ],
  breadcrumbs: [
    "Use a navigation label when your page needs one.",
    "Make the current page clear without a misleading link.",
    "Keep trail labels concise.",
  ],
  "tag-group": [
    "Give the group an aria-label when it has no visible heading.",
    "Keep remove controls reachable by pointer; Delete removes from the keyboard.",
    "Show selection with more than color.",
  ],
  resizer: [
    "Keep the handle large enough to grab; style the drag state via data-dragging.",
    "Pass size so assistive technology hears the separator position.",
    "Inside a resizable TableColumn the handle hides itself; keyboard resizing stays on the header.",
  ],
  "grid-list": [
    "Give the grid an aria-label when it has no visible heading.",
    "Keep row focus and row selection visibly distinct.",
    "Reach row controls with ArrowRight; do not add extra tab stops.",
    "Reordering never requires a pointer: Alt+Arrow moves the focused row and a live region announces its new position.",
  ],
  table: [
    "Give the table an aria-label or a visible caption.",
    "Keep column headers in TableColumn so cells inherit their names.",
    "Keep the focused cell visible while arrowing through the grid.",
  ],
  "list-box": [
    "Give the list an aria-label when it has no visible heading.",
    "Keep the focused option visibly distinct from selected state.",
    "Do not put buttons or links inside an option.",
  ],
  menu: [
    "Give MenuPopover an aria-label when trigger text is vague.",
    "Use MenuItem for actions, not a form selection.",
    "Return focus to the trigger when the menu closes.",
  ],
  select: [
    "Use a visible Label so the trigger and its listbox share a clear name; without one, name both parts explicitly.",
    "Make the chosen value readable in SelectValue.",
    "Use native required feedback or FieldError to explain a missing choice.",
  ],
  combobox: [
    "Use a visible Label so the input and results list share a clear name; without one, name both parts explicitly.",
    "Keep option text specific enough to distinguish matches.",
    "Do not hide required instructions only in the result list.",
  ],
  dialog: [
    "Give DialogContent an accessible name.",
    "Keep focus inside the modal until it closes.",
    "Include a clear way to finish or dismiss the task.",
  ],
  "alert-dialog": [
    "Name the consequence, not just the button.",
    "Put the safer choice where it is easy to find.",
    "Do not use an alert dialog for ordinary, reversible actions.",
  ],
  popover: [
    "Name the trigger so people know what opens.",
    "Do not put essential instructions only in a popover.",
    "PopoverArrow is decorative and should not carry meaning.",
  ],
  tooltip: [
    "Give the trigger its own accessible name.",
    "Keep tooltip text brief and descriptive.",
    "Do not put required interactive content inside a tooltip.",
  ],
  meter: ["meter"],
  "progress-bar": ["progress-bar"],
  separator: ["separator"],
  "skip-link": ["skip-link"],
  toast: ["toast"],
  toolbar: ["toolbar"],
};

const formatExample = (source: string) => {
  const lines = source.replaceAll("><", ">\n<").split("\n");
  let depth = 0;
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("</")) depth -= 1;
      const formatted = `${"  ".repeat(depth + 2)}${trimmed}`;
      const opensNestedContent =
        trimmed.startsWith("<") &&
        !trimmed.startsWith("</") &&
        !trimmed.endsWith("/>") &&
        !trimmed.includes("</");
      if (opensNestedContent) depth += 1;
      return formatted;
    })
    .join("\n");
};

const common = (
  slug: string,
  title: string,
  group: ComponentDoc["group"],
  names: string[],
  source: string,
  parts: ComponentDoc["parts"],
  keyboard: ComponentDoc["keyboard"],
  hooks: ComponentDoc["stateHooks"],
  form: string,
  related: string[],
  moreExamples?: ComponentDoc["moreExamples"],
): ComponentDoc => {
  const copy = lessons[slug];
  const notes = accessibility[slug];
  if (!copy) throw new Error(`Missing lesson copy for ${slug}`);
  if (!notes) throw new Error(`Missing accessibility notes for ${slug}`);
  return {
    slug,
    title,
    group,
    ...copy,
    imports: names,
    parts,
    exampleSource: `${imp(names)}\n\nexport function Example() {\n  return (\n${formatExample(source)}\n  );\n}`,
    moreExamples,
    keyboard,
    stateHooks: hooks,
    form,
    accessibility: notes,
    related,
  };
};

const action = [
  common(
    "button",
    "Button",
    "actions",
    ["Button"],
    "<Button onClick={save}>Save</Button>",
    [
      p("Button", "root", "Native button and press target.", true, false, [
        prop("onClick", "(event: MouseEvent) => void", "Runs the action on press."),
        prop("type", '"button" | "submit" | "reset"', 'Native button type; defaults to "button".'),
        prop("disabled", "boolean", "Disables the button; pending also disables it."),
        prop("pending", "boolean", "Marks a busy action: disables the button and sets aria-busy."),
        prop("as", "ElementType", "Renders another element with button semantics restored."),
      ]),
    ],
    [
      { keys: ["Enter"], action: "Presses the focused button." },
      { keys: ["Space"], action: "Presses the focused button." },
    ],
    [{ attribute: "[data-disabled]", on: "Button", meaning: "The button is disabled." }],
    'A native Button submits a form when type="submit".',
    ["toggle-button", "link", "file-trigger"],
  ),
  common(
    "toggle-button",
    "Toggle Button",
    "actions",
    ["ToggleButton", "ToggleButtonGroup"],
    '<ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton><ToggleButton value="italic">Italic</ToggleButton></ToggleButtonGroup>',
    [
      p(
        "ToggleButtonGroup",
        "root",
        "Optional group; it announces the relationship and manages selection once type, value, defaultValue, or onChange is set.",
        true,
        true,
        [
          prop("aria-label", "string", "Names the group for assistive technology."),
          prop("orientation", '"horizontal" | "vertical"', "Announced and styleable direction."),
          prop("type", '"single" | "multiple"', "Whether the group keeps one value or many."),
          prop(
            "value / defaultValue",
            "string | string[]",
            "Controlled or initial selection: a string for single, a string[] for multiple.",
          ),
          prop(
            "onChange",
            "(value: string | string[]) => void",
            'Receives the next selection; "" when a single group empties.',
          ),
        ],
      ),
      p("ToggleButton", "root", "Native button that owns the press target.", true, false, [
        prop("value", "string", "Identifies the button inside a selection-managing group."),
        prop(
          "selected / defaultSelected",
          "boolean",
          "Controlled or initial on state when standalone.",
        ),
        prop("onChange", "(selected: boolean) => void", "Receives the next on state."),
        prop("disabled", "boolean", "Disables the toggle."),
      ]),
    ],
    [
      { keys: ["Enter"], action: "Toggles the button." },
      { keys: ["Space"], action: "Toggles the button." },
    ],
    [
      { attribute: "[data-selected]", on: "ToggleButton", meaning: "The button is on." },
      { attribute: "[data-disabled]", on: "ToggleButton", meaning: "It cannot change." },
    ],
    "Toggle buttons do not create native form values.",
    ["button", "checkbox", "toolbar"],
  ),
  common(
    "link",
    "Link",
    "actions",
    ["Link"],
    '<Link href="/settings">Settings</Link>',
    [
      p("Link", "root", "Native anchor element.", true, false, [
        prop("href", "string", "Destination URL; removed while disabled."),
        prop("target / rel", "string", "Native anchor behavior for new tabs and referrers."),
        prop("disabled", "boolean", "Removes the link from the tab order and blocks clicks."),
        prop("as", "ElementType", "Renders another element with link semantics restored."),
      ]),
    ],
    [{ keys: ["Enter"], action: "Follows the link." }],
    [
      { attribute: "[data-disabled]", on: "Link", meaning: "The link is unavailable." },
      { attribute: "[data-focused]", on: "Link", meaning: "The link has focus." },
    ],
    "Links do not submit forms.",
    ["button", "breadcrumbs"],
  ),
  common(
    "file-trigger",
    "File Trigger",
    "actions",
    ["FileTrigger"],
    '<FileTrigger inputProps={{ name: "photo" }}>Upload photo</FileTrigger>',
    [
      p("FileTrigger", "root", "Native label that owns the visible trigger words.", true, false, [
        prop(
          "inputProps",
          "InputHTMLAttributes",
          "Props for the native file input, including name, accept, multiple, and onChange.",
        ),
      ]),
      p("file input", "input", "Native file input supplied through inputProps."),
    ],
    [
      { keys: ["Enter"], action: "Opens the browser file picker." },
      { keys: ["Space"], action: "Opens the browser file picker." },
    ],
    [],
    "The hidden input submits selected files using inputProps.name.",
    ["button", "text-field"],
  ),
  common(
    "visually-hidden",
    "Visually Hidden",
    "actions",
    ["VisuallyHidden"],
    "<VisuallyHidden>Loading messages</VisuallyHidden>",
    [
      p(
        "VisuallyHidden",
        "root",
        "Wrapper that hides children visually but keeps them available to assistive technology.",
        true,
        false,
        [
          prop(
            "focusable",
            "boolean",
            "Reveals the content while it or a descendant has focus, as a skip link does.",
          ),
        ],
      ),
    ],
    [],
    [],
    "No form behavior.",
    ["tooltip", "button"],
  ),
  common(
    "meter",
    "Meter",
    "actions",
    ["Meter"],
    '<Meter aria-label="Storage used" value={64} min={0} max={100} />',
    [
      p("Meter", "root", "Native meter element.", true, false, [
        prop("value", "number", "Current measurement between min and max."),
        prop("min / max", "number", "Range bounds; native defaults are 0 and 1."),
        prop(
          "low / high / optimum",
          "number",
          "Native thresholds the browser uses to color the gauge.",
        ),
        prop(
          "aria-label",
          "string",
          "Names the gauge when no Label is wired; or pair Label htmlFor with the id.",
        ),
        prop("id", "string", "Defaults to the surrounding field's control id for Label wiring."),
      ]),
    ],
    [],
    [],
    "No form behavior; a meter reports a measurement and submits nothing.",
    ["progress-bar"],
  ),
  common(
    "progress-bar",
    "Progress Bar",
    "actions",
    ["ProgressBar"],
    '<ProgressBar aria-label="Uploading photos" value={0.4} />',
    [
      p("ProgressBar", "root", "Native progress element.", true, false, [
        prop(
          "value",
          "number",
          "Completed amount between 0 and max; omit it for an indeterminate bar.",
        ),
        prop("max", "number", "Upper bound of the range; the native default is 1."),
        prop(
          "aria-label",
          "string",
          "Names the bar when no Label is wired; or pair Label htmlFor with the id.",
        ),
        prop("id", "string", "Defaults to the surrounding field's control id for Label wiring."),
      ]),
    ],
    [],
    [
      {
        attribute: "[data-indeterminate]",
        on: "ProgressBar",
        meaning: "No value was given; the bar shows unknown progress.",
      },
      {
        attribute: ":indeterminate",
        on: "ProgressBar",
        meaning: "Native pseudo-class for the same unknown-progress state.",
      },
    ],
    "No form behavior; progress reports status and submits nothing.",
    ["meter"],
  ),
  common(
    "separator",
    "Separator",
    "actions",
    ["Separator"],
    "<Separator />",
    [
      p(
        "Separator",
        "root",
        "Native hr, or a div with the separator role when vertical.",
        true,
        false,
        [
          prop(
            "orientation",
            '"horizontal" | "vertical"',
            'Rendering direction; vertical renders a div with aria-orientation="vertical".',
          ),
          prop("role", "string", 'Pass "presentation" when the rule is purely decorative.'),
          prop(
            "className",
            "string",
            "Styles the rule; a vertical separator needs its own width and height.",
          ),
        ],
      ),
    ],
    [],
    [
      {
        attribute: "[data-orientation]",
        on: "Separator",
        meaning: 'The rendering direction: "horizontal" or "vertical".',
      },
    ],
    "No form behavior.",
    ["toolbar", "menu"],
  ),
  common(
    "toast",
    "Toast",
    "actions",
    ["Button", "Toast", "ToastDismiss", "ToastProvider", "ToastRegion", "useToast"],
    "<ToastProvider><SaveButton /><ToastRegion>{(toast) => <Toast toast={toast}>{toast.content}<ToastDismiss /></Toast>}</ToastRegion></ToastProvider>",
    [
      p("ToastProvider", "root", "Owns the notification queue; it owns no DOM.", false, false, [
        prop(
          "children",
          "ReactNode",
          "App content plus one ToastRegion; call useToast anywhere inside.",
        ),
      ]),
      p(
        "useToast",
        "root",
        "Hook returning notify and dismiss; throws outside ToastProvider.",
        false,
        false,
        [
          prop(
            "notify(content, options?)",
            '(content: ReactNode, options?: { kind?: "status" | "alert"; timeout?: number | null }) => string',
            "Queues a toast and returns its id; kind defaults to status, timeout to 6000 ms, and null keeps it until dismissed.",
          ),
          prop("dismiss(id)", "(id: string) => void", "Removes a queued toast by id."),
        ],
      ),
      p(
        "ToastRegion",
        "content",
        "Labelled live region shown in the top layer only while toasts exist; hover or focus pauses auto-dismiss timers.",
        true,
        false,
        [
          prop(
            "children",
            "(toast: ToastRecord) => ReactNode",
            "Render prop that returns one Toast per queued record.",
          ),
          prop(
            "aria-label",
            "string",
            'Region name for assistive technology; defaults to "Notifications".',
          ),
          prop("forceMount", "boolean", "Keep the region rendered while the queue is empty."),
        ],
      ),
      p(
        "Toast",
        "content",
        "One notification; role=status for polite kinds and role=alert for urgent ones.",
        true,
        false,
        [
          prop("toast", "ToastRecord", "The queued record this item renders."),
          prop("children", "ReactNode", "Custom layout; defaults to the record's content."),
        ],
      ),
      p(
        "ToastDismiss",
        "trigger",
        "Native button pre-wired to dismiss its surrounding toast.",
        true,
        true,
        [prop("aria-label", "string", 'Accessible name; defaults to "Dismiss notification".')],
      ),
    ],
    [
      { keys: ["Tab"], action: "Reaches the dismiss button and other controls inside each toast." },
      {
        keys: ["Escape"],
        action:
          "Intentionally not a global shortcut; dismissal stays on the buttons inside the region.",
      },
    ],
    [
      { attribute: "[data-kind=alert]", on: "Toast", meaning: "The toast is urgent." },
      { attribute: "[data-kind=status]", on: "Toast", meaning: "The toast is polite." },
      {
        attribute: ":popover-open",
        on: "ToastRegion",
        meaning: "The region is shown in the top layer.",
      },
    ],
    "Toasts do not create native form values.",
    ["tooltip", "popover"],
  ),
  common(
    "toolbar",
    "Toolbar",
    "actions",
    ["Toolbar", "ToggleButton", "ToggleButtonGroup"],
    '<Toolbar aria-label="Text formatting"><ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton><ToggleButton value="italic">Italic</ToggleButton></ToggleButtonGroup><ToggleButtonGroup type="single" defaultValue="left" aria-label="Alignment"><ToggleButton value="left">Left</ToggleButton><ToggleButton value="right">Right</ToggleButton></ToggleButtonGroup></Toolbar>',
    [
      p(
        "Toolbar",
        "root",
        "Row of controls that shares one tab stop; arrow keys move between them.",
        true,
        false,
        [
          prop("aria-label", "string", "Names the toolbar for assistive technology."),
          prop(
            "orientation",
            '"horizontal" | "vertical"',
            'Arrow-key direction, announced via aria-orientation; defaults to "horizontal".',
          ),
        ],
      ),
      p(
        "ToggleButtonGroup",
        "item",
        "Optional selection group inside the toolbar; it announces the relationship and can manage which values are on.",
        true,
        true,
        [
          prop("aria-label", "string", "Names the group for assistive technology."),
          prop("type", '"single" | "multiple"', "Whether the group keeps one value or many."),
          prop(
            "value / defaultValue",
            "string | string[]",
            "Controlled or initial selection: a string for single, a string[] for multiple.",
          ),
          prop(
            "onChange",
            "(value: string | string[]) => void",
            'Receives the next selection; "" when a single group empties.',
          ),
        ],
      ),
      p("ToggleButton", "trigger", "Native button that owns one press target.", true, true, [
        prop("value", "string", "Identifies the button inside a selection-managing group."),
        prop("disabled", "boolean", "Removes the button from the toolbar's arrow-key order."),
      ]),
    ],
    [
      {
        keys: ["Tab"],
        action: "Moves into the toolbar to the last-used control; Tab again leaves.",
      },
      {
        keys: ["ArrowRight"],
        action: "Moves to the next control without wrapping.",
        scope: "horizontal",
      },
      {
        keys: ["ArrowLeft"],
        action: "Moves to the previous control without wrapping.",
        scope: "horizontal",
      },
      { keys: ["ArrowDown"], action: "Moves to the next control.", scope: "vertical" },
      { keys: ["ArrowUp"], action: "Moves to the previous control.", scope: "vertical" },
      { keys: ["Home"], action: "Moves to the first control." },
      { keys: ["End"], action: "Moves to the last control." },
      { keys: ["Enter"], action: "Presses the focused control." },
      { keys: ["Space"], action: "Presses the focused control." },
    ],
    [
      { attribute: "[data-orientation]", on: "Toolbar", meaning: "The arrow-key direction." },
      { attribute: "[data-selected]", on: "ToggleButton", meaning: "The button is on." },
    ],
    "A toolbar does not create form values; its controls submit their own.",
    ["toggle-button", "menu"],
  ),
];

const field = [
  common(
    "text-area",
    "Text Area",
    "fields",
    ["Description", "FieldError", "Label", "TextArea", "TextField"],
    '<TextField><Label>Notes</Label><TextArea name="notes" /></TextField>',
    [
      p("TextField", "root", "Optional field provider; it owns no DOM by default.", false, false, [
        prop("value / defaultValue", "string", "Controlled or initial field value."),
        prop("onChange", "(value: string) => void", "Receives the next value."),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field-wide states shared with every part.",
        ),
      ]),
      p("Label", "label", "Native label for the text area.", true, false, [
        prop("htmlFor", "string", "Auto-wired to the field control; set it only to override."),
      ]),
      p(
        "TextArea",
        "input",
        "Native multi-line control that owns typing and submission.",
        true,
        false,
        [
          prop("name", "string", "Submission name for the text."),
          prop("rows", "number", "Visible line count."),
          prop("placeholder", "string", "Hint text; never a replacement for Label."),
          prop("disabled / required", "boolean", "Override the field-wide state for this control."),
        ],
      ),
      p("Description / FieldError", "feedback", "Optional linked help or error text.", true, true, [
        prop(
          "forceMount",
          "boolean",
          "FieldError only: keep it rendered while the field is valid.",
        ),
      ]),
    ],
    [{ keys: ["Tab"], action: "Moves to and from the native text area." }],
    [
      {
        attribute: "[data-disabled]",
        on: "TextArea",
        meaning: "The surrounding field is disabled.",
      },
      { attribute: "[data-invalid]", on: "TextArea", meaning: "The surrounding field is invalid." },
    ],
    "TextArea submits its native name and multi-line value.",
    ["text-field", "fieldset"],
  ),
  common(
    "fieldset",
    "Fieldset",
    "fields",
    ["Fieldset", "Legend"],
    "<Fieldset><Legend>Contact choices</Legend>...</Fieldset>",
    [
      p("Fieldset", "root", "Native fieldset that groups related controls.", true, false, [
        prop("disabled", "boolean", "Natively disables every control inside."),
        prop("invalid / required", "boolean", "Group-wide states exposed as data attributes."),
      ]),
      p("Legend", "label", "Native fieldset caption."),
    ],
    [],
    [
      { attribute: "[data-disabled]", on: "Fieldset", meaning: "The whole group is disabled." },
      { attribute: "[data-invalid]", on: "Fieldset", meaning: "The group is invalid." },
      { attribute: "[data-required]", on: "Fieldset", meaning: "The group is required." },
    ],
    "Fieldset itself has no value; its named child controls submit normally.",
    ["text-field", "checkbox", "radio"],
  ),
  common(
    "text-field",
    "Text Field",
    "fields",
    ["Description", "FieldError", "Input", "Label", "TextField"],
    '<TextField required><Label>Email</Label><Input name="email" type="email" /><Description>For receipts.</Description><FieldError>Enter an email.</FieldError></TextField>',
    [
      p(
        "TextField",
        "root",
        "Field provider; it owns no DOM unless as is supplied.",
        false,
        false,
        [
          prop("value / defaultValue", "string", "Controlled or initial field value."),
          prop("onChange", "(value: string) => void", "Receives the next value."),
          prop(
            "disabled / invalid / required",
            "boolean",
            "Field-wide states shared with every part.",
          ),
        ],
      ),
      p("Label", "label", "Native label linked to the control.", true, false, [
        prop("htmlFor", "string", "Auto-wired to the field control; set it only to override."),
      ]),
      p(
        "Input",
        "input",
        "Native single-line control that owns typing and submission.",
        true,
        false,
        [
          prop("name", "string", "Submission name for the value."),
          prop("type", "string", 'Native input type such as "email" or "password".'),
          prop("placeholder", "string", "Hint text; never a replacement for Label."),
          prop("disabled / required", "boolean", "Override the field-wide state for this control."),
        ],
      ),
      p("Description / FieldError", "feedback", "Linked help or error text.", true, true, [
        prop(
          "forceMount",
          "boolean",
          "FieldError only: keep it rendered while the field is valid.",
        ),
      ]),
    ],
    [{ keys: ["Tab"], action: "Moves to and from the native control." }],
    [
      { attribute: "[data-invalid]", on: "Input", meaning: "The field is invalid." },
      { attribute: "[data-required]", on: "Input", meaning: "The field is required." },
      { attribute: "[data-disabled]", on: "Input", meaning: "The field is disabled." },
    ],
    "Input submits its native name and value.",
    ["text-area", "checkbox", "number-field"],
  ),
  common(
    "search-field",
    "Search Field",
    "fields",
    ["Label", "SearchField", "SearchFieldClear", "SearchFieldInput"],
    '<SearchField><Label>Search</Label><SearchFieldInput name="q" /><SearchFieldClear>Clear</SearchFieldClear></SearchField>',
    [
      p("SearchField", "root", "Field provider with no DOM by default.", false, false, [
        prop("value / defaultValue", "string", "Controlled or initial field value."),
        prop("onChange", "(value: string) => void", "Receives the next value."),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field-wide states shared with every part.",
        ),
        prop("onSubmit", "(value: string) => void", "Receives the query when Enter submits."),
        prop("onClear", "() => void", "Runs when the query is erased."),
      ]),
      p("SearchFieldInput", "input", "Native search input.", true, false, [
        prop("name", "string", "Submission name for the query."),
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
      ]),
      p("SearchFieldClear", "trigger", "Optional native clear button.", true, true),
    ],
    [
      { keys: ["Enter"], action: "Submits the surrounding form." },
      { keys: ["Tab"], action: "Moves between input and clear button." },
    ],
    [
      { attribute: "[data-invalid]", on: "SearchFieldInput", meaning: "The field is invalid." },
      { attribute: "[data-disabled]", on: "SearchFieldInput", meaning: "The field is disabled." },
    ],
    "SearchFieldInput submits its native name and query.",
    ["text-field", "combobox"],
  ),
  common(
    "checkbox",
    "Checkbox",
    "fields",
    ["Checkbox", "CheckboxGroup"],
    '<CheckboxGroup name="topics"><Checkbox value="news">News</Checkbox></CheckboxGroup>',
    [
      p("CheckboxGroup", "root", "Optional shared name and value provider.", false, true, [
        prop("value / defaultValue", "string[]", "Controlled or initial selected values."),
        prop("onChange", "(value: string[]) => void", "Receives the next selected values."),
        prop("name", "string", "Shared submission name for the group."),
      ]),
      p("Checkbox", "input", "Label with a hidden native checkbox.", true, false, [
        prop("name", "string", "Submission name; falls back to the group name."),
        prop("value", "string", "Submitted value for this box."),
        prop("selected / defaultSelected", "boolean", "Controlled or initial tick state."),
        prop("onChange", "(selected: boolean) => void", "Receives the next tick state."),
        prop("indeterminate", "boolean", "Shows the mixed state."),
        prop("disabled", "boolean", "Disables the box."),
        prop("inputProps", "InputHTMLAttributes", "Props for the hidden native input."),
      ]),
    ],
    [
      { keys: ["Space"], action: "Checks or unchecks the focused box." },
      { keys: ["Tab"], action: "Moves between checkboxes." },
    ],
    [
      { attribute: "[data-selected]", on: "Checkbox", meaning: "The box is checked." },
      { attribute: "[data-indeterminate]", on: "Checkbox", meaning: "The box is mixed." },
      { attribute: "[data-disabled]", on: "Checkbox", meaning: "The box cannot change." },
    ],
    "Each selected Checkbox submits its native name and value.",
    ["radio", "switch", "toggle-button"],
  ),
  common(
    "radio",
    "Radio",
    "fields",
    ["Radio", "RadioGroup"],
    '<RadioGroup name="plan" defaultValue="pro"><Radio value="pro">Pro</Radio></RadioGroup>',
    [
      p("RadioGroup", "root", "Selected-value provider; no DOM by default.", false, false, [
        prop("value / defaultValue", "string", "Controlled or initial choice."),
        prop("onChange", "(value: string) => void", "Receives the next choice."),
        prop("name", "string", "Shared submission name for the group."),
      ]),
      p("Radio", "item", "Labelled native radio option.", true, false, [
        prop("value", "string", "This option’s value."),
        prop("disabled", "boolean", "Disables the option."),
      ]),
    ],
    [
      { keys: ["ArrowDown"], action: "Moves to the next radio." },
      { keys: ["ArrowUp"], action: "Moves to the previous radio." },
      { keys: ["Space"], action: "Selects the focused radio." },
    ],
    [
      { attribute: "[data-selected]", on: "Radio", meaning: "This radio is selected." },
      { attribute: "[data-disabled]", on: "Radio", meaning: "This radio is disabled." },
    ],
    "The selected radio submits RadioGroup.name and its value.",
    ["checkbox", "select"],
  ),
  common(
    "switch",
    "Switch",
    "fields",
    ["Switch"],
    '<Switch name="alerts">Email alerts</Switch>',
    [
      p("Switch", "input", "Label with a hidden native checkbox.", true, false, [
        prop("name", "string", "Submission name for the setting."),
        prop("selected / defaultSelected", "boolean", "Controlled or initial on state."),
        prop("onChange", "(selected: boolean) => void", "Receives the next on state."),
        prop("disabled", "boolean", "Disables the switch."),
      ]),
    ],
    [{ keys: ["Space"], action: "Changes the switch." }],
    [
      { attribute: "[data-selected]", on: "Switch", meaning: "The switch is on." },
      { attribute: "[data-disabled]", on: "Switch", meaning: "The switch is disabled." },
    ],
    "A selected switch submits like a native checkbox.",
    ["checkbox", "toggle-button"],
  ),
  common(
    "number-field",
    "Number Field",
    "fields",
    ["NumberField"],
    '<NumberField name="guests" defaultValue={2} min={1} />',
    [
      p("NumberField", "root", "Field provider and wrapper div.", true, false, [
        prop("value / defaultValue", "number", "Controlled or initial number."),
        prop("onChange", "(value: number) => void", "Receives the next number."),
        prop("min / max / step", "number", "Range limits for the native input."),
        prop("name", "string", "Submission name."),
        prop("disabled / invalid / required", "boolean", "Field-wide states."),
      ]),
      p("default Input", "input", "Native number input rendered when you do not pass children."),
    ],
    [
      { keys: ["ArrowUp"], action: "Increases by step." },
      { keys: ["ArrowDown"], action: "Decreases by step." },
    ],
    [
      { attribute: "[data-invalid]", on: "NumberField", meaning: "The value is invalid." },
      { attribute: "[data-disabled]", on: "NumberField", meaning: "The control is disabled." },
    ],
    "Submits as a named native number input.",
    ["slider", "text-field"],
  ),
  common(
    "slider",
    "Slider",
    "fields",
    ["Slider"],
    '<Slider name="volume" defaultValue={30} min={0} max={100} />',
    [
      p("Slider", "input", "Native range input.", true, false, [
        prop("value / defaultValue", "number", "Controlled or initial position."),
        prop("onChange", "(value: number) => void", "Receives the next position."),
        prop("min / max / step", "number", "Range bounds; default 0, 100, and 1."),
        prop("name", "string", "Submission name for the value."),
        prop("disabled", "boolean", "Disables the slider."),
      ]),
    ],
    [
      { keys: ["ArrowRight"], action: "Increases the value." },
      { keys: ["ArrowLeft"], action: "Decreases the value." },
      { keys: ["Home"], action: "Moves to minimum." },
      { keys: ["End"], action: "Moves to maximum." },
    ],
    [{ attribute: "[data-disabled]", on: "Slider", meaning: "The slider is disabled." }],
    "Submits as a named native range input.",
    ["number-field", "switch"],
  ),
];

const navigation = [
  common(
    "accordion",
    "Accordion",
    "navigation",
    ["Accordion", "AccordionHeader", "AccordionItem", "AccordionPanel", "AccordionTrigger"],
    '<Accordion defaultValue="one"><AccordionItem value="one"><AccordionHeader><AccordionTrigger>Details</AccordionTrigger></AccordionHeader><AccordionPanel>More information.</AccordionPanel></AccordionItem></Accordion>',
    [
      p("Accordion", "root", "Open-item state provider.", false, false, [
        prop("type", '"single" | "multiple"', "How many items may stay open."),
        prop("value / defaultValue", "string | string[]", "Controlled or initial open items."),
        prop("onChange", "(value) => void", "Receives the next open items."),
        prop("collapsible", "boolean", "Allows closing the last open item."),
      ]),
      p("AccordionItem", "item", "Owns an item wrapper.", true, false, [
        prop("value", "string", "Identity used by the root’s open state."),
        prop("disabled", "boolean", "Disables the item."),
      ]),
      p("AccordionHeader", "label", "Heading wrapper.", true, false, [
        prop("level", "1 | 2 | 3 | 4 | 5 | 6", "Heading element to render; defaults to h3."),
      ]),
      p("AccordionTrigger", "trigger", "Native button that opens its panel.", true, false, [
        prop("disabled", "boolean", "Disables this trigger on top of the item's disabled state."),
      ]),
      p("AccordionPanel", "content", "Revealed region.", true, false, [
        prop("role", '"region" | "group"', "Use group when many panels would flood landmarks."),
      ]),
    ],
    [
      { keys: ["ArrowDown"], action: "Moves to next trigger." },
      { keys: ["ArrowUp"], action: "Moves to previous trigger." },
      { keys: ["Enter"], action: "Toggles the item." },
      { keys: ["Space"], action: "Toggles the item." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "AccordionItem, AccordionTrigger, AccordionPanel",
        meaning: "The item is expanded.",
      },
      {
        attribute: "[data-disabled]",
        on: "AccordionItem, AccordionTrigger",
        meaning: "The trigger is disabled.",
      },
    ],
    "No native form behavior.",
    ["disclosure", "tabs"],
  ),
  common(
    "disclosure",
    "Disclosure",
    "navigation",
    ["Disclosure", "DisclosurePanel", "DisclosureTrigger"],
    "<Disclosure><DisclosureTrigger>Details</DisclosureTrigger><DisclosurePanel>More information.</DisclosurePanel></Disclosure>",
    [
      p("Disclosure", "root", "Open-state provider.", false, false, [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onChange", "(open: boolean) => void", "Receives the next open state."),
      ]),
      p("DisclosureTrigger", "trigger", "Native summary element that toggles the details."),
      p("DisclosurePanel", "content", "Revealed content."),
    ],
    [
      { keys: ["Enter"], action: "Toggles the panel." },
      { keys: ["Space"], action: "Toggles the panel." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "Disclosure, DisclosureTrigger, DisclosurePanel",
        meaning: "The disclosure is open.",
      },
      { attribute: ":open", on: "Disclosure", meaning: "Native details pseudo-class equivalent." },
    ],
    "No native form behavior.",
    ["accordion", "popover"],
  ),
  common(
    "tabs",
    "Tabs",
    "navigation",
    ["Tab", "TabList", "TabPanel", "Tabs"],
    '<Tabs defaultValue="one"><TabList><Tab tab="one">One</Tab></TabList><TabPanel tab="one">Panel one</TabPanel></Tabs>',
    [
      p("Tabs", "root", "Selected-tab provider.", false, false, [
        prop("value / defaultValue", "string", "Controlled or initial selected tab."),
        prop("onChange", "(value: string) => void", "Receives the next selected tab."),
      ]),
      p("TabList", "root", "Tab list element.", true, false, [
        prop("aria-label", "string", "Names the tab list for assistive technology."),
        prop("orientation", '"horizontal" | "vertical"', "Arrow-key axis and aria-orientation."),
      ]),
      p("Tab", "item", "Native button with tab role.", true, false, [
        prop("tab", "string", "Identity that pairs this tab with its panel."),
        prop("disabled", "boolean", "Disables the tab."),
      ]),
      p("TabPanel", "content", "Panel for a matching tab.", true, false, [
        prop("tab", "string", "The tab this panel belongs to."),
      ]),
    ],
    [
      { keys: ["ArrowRight"], action: "Moves to next tab." },
      { keys: ["ArrowLeft"], action: "Moves to previous tab." },
      { keys: ["Home"], action: "Moves to first tab." },
      { keys: ["End"], action: "Moves to last tab." },
    ],
    [
      {
        attribute: "[data-selected]",
        on: "Tab, TabPanel",
        meaning: "This tab or panel is selected.",
      },
    ],
    "No native form behavior.",
    ["accordion", "list-box"],
  ),
  common(
    "breadcrumbs",
    "Breadcrumbs",
    "navigation",
    ["BreadcrumbLink", "Breadcrumbs"],
    '<Breadcrumbs><BreadcrumbLink href="/">Home</BreadcrumbLink></Breadcrumbs>',
    [
      p("Breadcrumbs", "root", "Navigation landmark and list.", true, false, [
        prop("aria-label", "string", 'Names the landmark; defaults to "Breadcrumbs".'),
      ]),
      p("BreadcrumbLink", "item", "Native anchor in the trail.", true, false, [
        prop("href", "string", "Destination for this trail stop."),
        prop("current", "boolean", 'Marks the page you are on with aria-current="page".'),
      ]),
    ],
    [{ keys: ["Enter"], action: "Follows the focused breadcrumb." }],
    [{ attribute: "[data-current]", on: "BreadcrumbLink", meaning: "This is the current page." }],
    "No native form behavior.",
    ["link", "tabs"],
  ),
  common(
    "list-box",
    "List Box",
    "navigation",
    ["ListBox", "ListBoxItem", "ListBoxSection", "ListBoxSeparator"],
    '<ListBox aria-label="Color"><ListBoxItem value="red">Red</ListBoxItem></ListBox>',
    [
      p("ListBox", "root", "Selectable list container.", true, false, [
        prop("aria-label", "string", "Names the list; nothing labels it automatically."),
        prop("value / defaultValue", "string", "Controlled or initial selection."),
        prop("onChange", "(value: string) => void", "Receives the next selection."),
        prop("orientation", '"vertical" | "horizontal"', "Arrow-key axis."),
      ]),
      p("ListBoxSection", "root", "Optional labelled section.", true, true, [
        prop("aria-label", "string", "Names the group of options."),
      ]),
      p("ListBoxSeparator", "label", "Rule between groups of options.", true, true),
      p("ListBoxItem", "item", "Selectable option.", true, false, [
        prop("value", "string", "This option’s selection key."),
        prop("disabled", "boolean", "Disables the option."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
    ],
    [
      { keys: ["ArrowDown"], action: "Moves active item down." },
      { keys: ["ArrowUp"], action: "Moves active item up." },
      { keys: ["Enter"], action: "Selects the active item." },
      { keys: ["Space"], action: "Selects the active item." },
    ],
    [
      { attribute: "[data-selected]", on: "ListBoxItem", meaning: "The item is selected." },
      {
        attribute: ":focus-visible",
        on: "ListBoxItem",
        meaning: "The item has visible keyboard focus.",
      },
      { attribute: "[data-disabled]", on: "ListBoxItem", meaning: "The item is disabled." },
    ],
    "No native form behavior by itself.",
    ["menu", "select"],
  ),
  common(
    "menu",
    "Menu",
    "navigation",
    ["Menu", "MenuPopover", "MenuItem", "MenuSection", "MenuSeparator", "MenuTrigger"],
    '<Menu><MenuTrigger>Actions</MenuTrigger><MenuPopover aria-label="Actions"><MenuItem>Archive</MenuItem></MenuPopover></Menu>',
    [
      p(
        "Menu",
        "root",
        "Open-state provider; nest a whole Menu inside a MenuPopover to create a submenu.",
        false,
        false,
        [
          prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
          prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        ],
      ),
      p(
        "MenuTrigger",
        "trigger",
        "Button that opens the menu; inside a parent menu it becomes the submenu item.",
        true,
        false,
        [
          prop("disabled", "boolean", "Disables opening."),
          prop(
            "as",
            "ElementType | Fragment",
            "Fragment merges the trigger onto your own element child.",
          ),
        ],
      ),
      p("MenuPopover", "content", "Menu container.", true, false, [
        prop("aria-label", "string", "Names the menu when the trigger text is vague."),
        prop(
          "placement",
          "PopoverPlacement",
          'Trigger side to open on, such as "bottom start" or "right top" for submenus; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the trigger and the menu."),
      ]),
      p("MenuSection", "root", "Optional labelled section.", true, true, [
        prop("aria-label", "string", "Names the group of items."),
      ]),
      p("MenuSeparator", "label", "Rule between groups of items.", true, true),
      p("MenuItem", "item", "Action item.", true, false, [
        prop("onClick", "(event) => void", "Runs the action; preventDefault keeps the menu open."),
        prop("value", "string", "Optional identity for typeahead and data-value."),
        prop("disabled", "boolean", "Disables the action."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
    ],
    [
      { keys: ["ArrowDown"], action: "Opens from the trigger, or moves to the next item." },
      { keys: ["ArrowUp"], action: "Opens from the trigger, or moves to the previous item." },
      { keys: ["ArrowRight"], action: "Opens the focused submenu item.", scope: "submenu" },
      {
        keys: ["ArrowLeft"],
        action: "Closes the submenu and refocuses its item.",
        scope: "submenu",
      },
      { keys: ["Enter"], action: "Activates item." },
      { keys: ["Escape"], action: "Closes and returns focus to trigger." },
      { keys: ["Tab"], action: "Closes the menu and moves on." },
    ],
    [
      { attribute: "[data-open]", on: "MenuTrigger, MenuPopover", meaning: "The menu is open." },
      {
        attribute: ":popover-open",
        on: "MenuPopover",
        meaning: "Native pseudo-class equivalent.",
      },
      {
        attribute: ":focus-visible",
        on: "MenuItem",
        meaning: "The item has visible keyboard focus.",
      },
      { attribute: "[data-disabled]", on: "MenuItem", meaning: "The item is disabled." },
    ],
    "No native form behavior.",
    ["list-box", "popover"],
  ),
  common(
    "tag-group",
    "Tag Group",
    "navigation",
    ["Button", "Tag", "TagGroup"],
    '<TagGroup aria-label="Filters" onRemove={remove}><Tag value="news">News</Tag></TagGroup>',
    [
      p("TagGroup", "root", "Grid of tags and the group's single tab stop.", true, false, [
        prop("aria-label", "string", "Names the group; nothing labels it automatically."),
        prop("value / defaultValue", "string[]", "Controlled or initial selected tags."),
        prop("onChange", "(value: string[]) => void", "Receives the next selected tags."),
        prop(
          "onRemove",
          "(value: string) => void",
          "Receives a tag removed with Delete or Backspace.",
        ),
      ]),
      p("Tag", "item", "Removable, selectable label that can hold a control.", true, false, [
        prop("value", "string", "This tag’s identity."),
        prop("disabled", "boolean", "Disables the tag."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
    ],
    [
      { keys: ["ArrowRight"], action: "Moves to the next tag." },
      { keys: ["ArrowLeft"], action: "Moves to the previous tag." },
      { keys: ["Home"], action: "Moves to the first tag." },
      { keys: ["End"], action: "Moves to the last tag." },
      { keys: ["Space"], action: "Toggles the focused tag's selection." },
      { keys: ["Enter"], action: "Toggles the focused tag's selection." },
    ],
    [
      { attribute: "[data-selected]", on: "Tag", meaning: "The tag is selected." },
      { attribute: "[data-disabled]", on: "Tag", meaning: "The tag is disabled." },
      { attribute: ":focus-visible", on: "Tag", meaning: "The tag has keyboard focus." },
    ],
    "Selection does not create a native form value; mirror it into hidden inputs when a form needs it.",
    ["grid-list", "checkbox"],
  ),
  common(
    "resizer",
    "Resizer",
    "navigation",
    ["Resizer"],
    "<Resizer size={width} min={120} max={320} onResize={setWidth} />",
    [
      p("Resizer", "root", "Native separator that resizes its target.", true, false, [
        prop(
          "orientation",
          '"vertical" | "horizontal"',
          "Vertical resizes width; horizontal resizes height.",
        ),
        prop(
          "onResize",
          "(size: number) => void",
          "Receives the next size; you apply it as a style.",
        ),
        prop("size", "number", "Current size, exposed as aria-valuenow."),
        prop("min / max", "number", "Clamp bounds, also used by Home and End."),
        prop(
          "target",
          "RefObject<HTMLElement>",
          "Element to measure; defaults to the parent or the table column.",
        ),
      ]),
    ],
    [
      { keys: ["ArrowRight"], action: "Widens a vertical split." },
      { keys: ["ArrowLeft"], action: "Narrows a vertical split." },
      { keys: ["ArrowDown"], action: "Grows a horizontal split." },
      { keys: ["ArrowUp"], action: "Shrinks a horizontal split." },
      { keys: ["Home"], action: "Jumps to the minimum size." },
      { keys: ["End"], action: "Jumps to the maximum size." },
    ],
    [
      { attribute: "[data-dragging]", on: "Resizer", meaning: "A pointer drag is in progress." },
      { attribute: ":focus-visible", on: "Resizer", meaning: "The separator has keyboard focus." },
    ],
    "No native form behavior.",
    ["table"],
  ),
  common(
    "grid-list",
    "Grid List",
    "navigation",
    ["Button", "GridList", "GridListDragHandle", "GridListItem"],
    '<GridList aria-label="Files"><GridListItem value="report">report.pdf<Button>Share</Button></GridListItem></GridList>',
    [
      p("GridList", "root", "Grid container and the list's single tab stop.", true, false, [
        prop("aria-label", "string", "Names the grid; nothing labels it automatically."),
        prop("value / defaultValue", "string", "Controlled or initial selected row."),
        prop("onChange", "(value: string) => void", "Receives the next selected row."),
        prop(
          "onReorder",
          "(values: string[]) => void",
          "Receives the full new row order; providing it makes rows draggable and movable with Alt+Arrow keys, with moves announced to screen readers.",
        ),
        prop(
          "canReorder",
          "(values: string[], moved: string) => boolean",
          "Vetoes a proposed order: blocked drop positions show no drop preview and blocked keyboard moves are announced but not applied.",
        ),
      ]),
      p("GridListItem", "item", "Selectable row that can hold its own controls.", true, false, [
        prop("value", "string", "This row’s selection key."),
        prop("disabled", "boolean", "Disables the row."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
      p(
        "GridListDragHandle",
        "trigger",
        "Optional labelled button inside a row; while present, drags start from it instead of the whole row, keeping the row body free for scrolling and text selection.",
        true,
        true,
      ),
    ],
    [
      { keys: ["ArrowDown"], action: "Moves to the next row." },
      { keys: ["ArrowUp"], action: "Moves to the previous row." },
      { keys: ["ArrowRight"], action: "Moves into and through the row's controls." },
      { keys: ["ArrowLeft"], action: "Moves back toward the row." },
      { keys: ["Home"], action: "Moves to the first row." },
      { keys: ["End"], action: "Moves to the last row." },
      { keys: ["Enter"], action: "Selects the focused row." },
      { keys: ["Space"], action: "Selects the focused row." },
      { keys: ["Alt", "ArrowUp"], action: "Moves the row up.", scope: "with onReorder" },
      { keys: ["Alt", "ArrowDown"], action: "Moves the row down.", scope: "with onReorder" },
    ],
    [
      { attribute: "[data-selected]", on: "GridListItem", meaning: "The row is selected." },
      { attribute: "[data-disabled]", on: "GridListItem", meaning: "The row is disabled." },
      { attribute: "[data-dragging]", on: "GridListItem", meaning: "The row is being dragged." },
      {
        attribute: "[data-drop-before]",
        on: "GridListItem",
        meaning: "The dragged row will drop before this row; style it as the drop preview.",
      },
      {
        attribute: "[data-drop-after]",
        on: "GridListItem",
        meaning: "The dragged row will drop after this row; style it as the drop preview.",
      },
      {
        attribute: ":focus-visible",
        on: "GridListItem and its controls",
        meaning: "The row or a control in it has keyboard focus.",
      },
    ],
    "Selection does not create a native form value; mirror it into a hidden input when a form needs it.",
    ["list-box", "table"],
    [
      {
        id: "reorder",
        title: "Reorder with a drag handle",
        description:
          "onReorder makes rows movable; the handle keeps drags off the row body, canReorder pins notes.txt to the end (blocked positions show no drop preview), and Alt+Arrow moves each row without a pointer.",
      },
    ],
  ),
  common(
    "table",
    "Table",
    "navigation",
    [
      "Checkbox",
      "Table",
      "TableBody",
      "TableCell",
      "TableColumn",
      "Resizer",
      "TableHeader",
      "TableRow",
    ],
    '<Table aria-label="People"><TableHeader><TableRow><TableColumn>Name</TableColumn></TableRow></TableHeader><TableBody><TableRow><TableCell>Ada</TableCell></TableRow></TableBody></Table>',
    [
      p("Table", "root", "Native table with the grid role and one tab stop.", true, false, [
        prop("aria-label", "string", "Names the table when there is no visible caption."),
        prop(
          "onRangeSelect",
          "(values: string[]) => void",
          "Receives anchor-to-row values on Shift+Click and Shift+ArrowUp/Down.",
        ),
      ]),
      p("TableHeader", "root", "Native thead holding the column header row."),
      p("TableColumn", "item", "Native th column header and grid cell.", true, false, [
        prop(
          "sort",
          '"ascending" | "descending" | "none"',
          "Current sort, exposed as aria-sort; you sort the rows.",
        ),
        prop("onSort", "() => void", "Runs on click, Enter, or Space."),
        prop(
          "onResize",
          "(width: number) => void",
          "Receives the next width from Shift+Arrow or a resizer drag.",
        ),
      ]),
      p("Resizer", "trigger", "Optional drag handle inside a resizable column.", true, true),
      p("TableBody", "root", "Native tbody holding the data rows."),
      p("TableRow", "item", "Native tr in either section.", true, false, [
        prop(
          "selected",
          "boolean",
          "Marks the row selected for aria and styling; you own the state.",
        ),
        prop("value", "string", "Row identity reported by onRangeSelect."),
      ]),
      p("TableCell", "item", "Native td data cell and grid focus target."),
    ],
    [
      { keys: ["ArrowRight"], action: "Moves right through each cell and the controls inside it." },
      { keys: ["ArrowLeft"], action: "Moves left through each cell and the controls inside it." },
      { keys: ["ArrowDown"], action: "Moves one cell down the column." },
      { keys: ["ArrowUp"], action: "Moves one cell up the column." },
      { keys: ["Home"], action: "Moves to the first cell in the row." },
      { keys: ["End"], action: "Moves to the last cell in the row." },
      { keys: ["Ctrl", "Home"], action: "Moves to the first cell of the table." },
      { keys: ["Ctrl", "End"], action: "Moves to the last cell of the table." },
    ],
    [
      {
        attribute: ":focus-visible",
        on: "TableColumn, TableCell",
        meaning: "The cell has keyboard focus.",
      },
    ],
    "No native form behavior; it presents data.",
    ["grid-list", "list-box"],
  ),
  common(
    "skip-link",
    "Skip Link",
    "navigation",
    ["SkipLink"],
    '<SkipLink href="#main">Skip to main content</SkipLink>',
    [
      p(
        "SkipLink",
        "root",
        "Native anchor that stays visually hidden until it receives focus.",
        true,
        false,
        [
          prop("href", "string", 'In-page target the link jumps to, such as "#main".'),
          prop(
            "className / style",
            "string / CSSProperties",
            "Styles the revealed link; merged with the hiding styles while hidden.",
          ),
        ],
      ),
    ],
    [
      { keys: ["Tab"], action: "Reveals the link when it receives focus." },
      { keys: ["Enter"], action: "Jumps to the target and hides the link again." },
    ],
    [
      { attribute: "[data-focused]", on: "SkipLink", meaning: "The link is focused and visible." },
      {
        attribute: ":focus-visible",
        on: "SkipLink",
        meaning: "Native keyboard-focus styling hook.",
      },
    ],
    "No form behavior.",
    ["link", "visually-hidden"],
  ),
];

const picker = [
  common(
    "select",
    "Select",
    "pickers",
    ["Label", "Popover", "Select", "SelectPopover", "SelectOption", "SelectTrigger", "SelectValue"],
    '<Select name="size" defaultValue="small"><Label>Size</Label><Popover><SelectTrigger><SelectValue /></SelectTrigger><SelectPopover><SelectOption value="small">Small</SelectOption></SelectPopover></Popover></Select>',
    [
      p(
        "Select",
        "root",
        "Selected value and optional visually hidden native select provider.",
        false,
        false,
        [
          prop("value / defaultValue", "string", "Controlled or initial choice."),
          prop("onChange", "(value: string) => void", "Receives the next choice."),
          prop("name", "string", "Submission name for the hidden native select."),
          prop("disabled / invalid / required", "boolean", "Field-wide states."),
        ],
      ),
      p("Label", "label", "Visible name connected to the trigger."),
      p("Popover", "root", "Open-state and top-layer popup lifecycle provider.", false),
      p("SelectTrigger", "trigger", "Button that opens choices.", true, false, [
        prop("disabled", "boolean", "Disables opening."),
        prop("aria-label", "string", "Names the trigger when there is no visible Label."),
      ]),
      p("SelectValue", "value", "Selected option text.", true, false, [
        prop("placeholder", "ReactNode", "Shown while nothing is selected."),
        prop("value", "ReactNode", "Overrides the displayed text for the selected option."),
      ]),
      p("SelectPopover", "content", "The listbox surface.", true, false, [
        prop("aria-label", "string", "Names the listbox when there is no visible Label."),
        prop(
          "placement",
          "PopoverPlacement",
          'Trigger side to open on, such as "bottom"; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the trigger and the listbox."),
      ]),
      p("SelectOption", "item", "Selectable option.", true, false, [
        prop("value", "string", "This option’s value."),
        prop("disabled", "boolean", "Disables the option."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
    ],
    [
      { keys: ["Enter"], action: "Opens or chooses." },
      { keys: ["Space"], action: "Opens or chooses." },
      { keys: ["ArrowDown"], action: "Moves through options." },
      { keys: ["Escape"], action: "Closes the list." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "SelectTrigger, SelectPopover",
        meaning: "Choices are open.",
      },
      {
        attribute: ":popover-open",
        on: "SelectPopover",
        meaning: "Native pseudo-class equivalent.",
      },
      { attribute: "[data-placeholder]", on: "SelectValue", meaning: "No value is selected." },
      { attribute: "[data-value]", on: "SelectValue", meaning: "A value is selected." },
    ],
    "When name or required is set, Select renders a visually hidden native select proxy for submission and validation; it is not an input type=hidden.",
    ["combobox", "list-box"],
  ),
  common(
    "combobox",
    "Combobox",
    "pickers",
    ["Combobox", "ComboboxPopover", "ComboboxInput", "ComboboxOption", "Label", "Popover"],
    '<Combobox name="city"><Label>City</Label><Popover><ComboboxInput /><ComboboxPopover><ComboboxOption value="Paris">Paris</ComboboxOption></ComboboxPopover></Popover></Combobox>',
    [
      p("Combobox", "root", "Selected-value and form-serialization provider.", false, false, [
        prop("value / defaultValue", "string", "Controlled or initial committed option."),
        prop("onChange", "(value: string) => void", "Receives the committed option."),
        prop("inputValue / defaultInputValue", "string", "Controlled or initial editable text."),
        prop("onInputChange", "(value: string) => void", "Receives the editable text."),
        prop("filter", "(textValue, inputValue) => boolean", "Custom match rule for results."),
        prop("name", "string", "Submission name."),
      ]),
      p("Label", "label", "Visible name connected to the input."),
      p("Popover", "root", "Open-state and top-layer popup lifecycle provider.", false),
      p(
        "ComboboxInput",
        "input",
        "Native text input that owns editing and required validity.",
        true,
        false,
        [
          prop("placeholder", "string", "Hint text; never a replacement for Label."),
          prop("aria-label", "string", "Names the input when there is no visible Label."),
          prop("disabled / required", "boolean", "Override the field-wide state for this control."),
        ],
      ),
      p("ComboboxPopover", "content", "The listbox results surface.", true, false, [
        prop("aria-label", "string", "Names the results list when there is no visible Label."),
        prop(
          "placement",
          "PopoverPlacement",
          'Input side to open on, such as "bottom"; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the input and the listbox."),
      ]),
      p("ComboboxOption", "item", "Selectable result.", true, false, [
        prop("value", "string", "This result’s value."),
        prop("disabled", "boolean", "Disables the result."),
        prop(
          "textValue",
          "string",
          "Overrides the text crawled from children when markup makes it ambiguous.",
        ),
      ]),
    ],
    [
      { keys: ["ArrowDown"], action: "Moves through options." },
      { keys: ["Enter"], action: "Selects option." },
      { keys: ["Escape"], action: "Closes results." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "ComboboxInput, ComboboxPopover",
        meaning: "Results are open.",
      },
      {
        attribute: ":popover-open",
        on: "ComboboxPopover",
        meaning: "Native pseudo-class equivalent.",
      },
      { attribute: "[data-selected]", on: "ComboboxOption", meaning: "Option is selected." },
      {
        attribute: "[data-active]",
        on: "ComboboxOption",
        meaning: "Option is active and receives the visible keyboard highlight.",
      },
      {
        attribute: "[aria-activedescendant]",
        on: "ComboboxInput",
        meaning: "The input points to the keyboard-active option while focus stays in the input.",
      },
    ],
    "Combobox.name owns selected-value serialization. ComboboxInput owns text editing and required validity.",
    ["select", "search-field"],
  ),
  common(
    "dialog",
    "Dialog",
    "pickers",
    ["Dialog", "DialogContent", "DialogTrigger"],
    '<Dialog><DialogTrigger>Open details</DialogTrigger><DialogContent aria-label="Details">Details</DialogContent></Dialog>',
    [
      p("Dialog", "root", "Modal open-state provider.", false, false, [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
      ]),
      p("DialogTrigger", "trigger", "Button that opens the dialog.", true, false, [
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ]),
      p("DialogContent", "content", "Modal dialog element.", true, false, [
        prop("aria-label", "string", "Accessible name for the dialog task."),
        prop("portal", "boolean", "Renders into document.body; on by default."),
        prop(
          "closedby",
          '"any" | "closerequest" | "none"',
          "Native dismissal policy; any adds light dismiss where supported.",
        ),
        prop("onClose", "(event) => void", "Native dialog close event."),
      ]),
    ],
    [
      { keys: ["Escape"], action: "Closes and restores trigger focus." },
      { keys: ["Tab"], action: "Cycles inside the modal." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "DialogTrigger, DialogContent",
        meaning: "The dialog is open.",
      },
      { attribute: ":open", on: "DialogContent", meaning: "Native pseudo-class equivalent." },
    ],
    "No native form behavior; forms may live inside DialogContent.",
    ["alert-dialog", "popover"],
  ),
  common(
    "alert-dialog",
    "Alert Dialog",
    "pickers",
    ["AlertDialog", "AlertDialogContent", "DialogTrigger"],
    '<AlertDialog><DialogTrigger>Delete</DialogTrigger><AlertDialogContent aria-label="Delete item">This cannot be undone.</AlertDialogContent></AlertDialog>',
    [
      p("AlertDialog", "root", "Modal open-state provider for an urgent decision.", false, false, [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
      ]),
      p("DialogTrigger", "trigger", "Button that opens the alert.", true, false, [
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ]),
      p("AlertDialogContent", "content", "Modal alert dialog content.", true, false, [
        prop("aria-label", "string", "Accessible name for the decision."),
        prop("portal", "boolean", "Renders into document.body; on by default."),
        prop(
          "closedby",
          '"any" | "closerequest" | "none"',
          "Native dismissal policy; none blocks Escape when the decision must be explicit.",
        ),
      ]),
    ],
    [
      { keys: ["Escape"], action: "Closes when dismissal is allowed." },
      { keys: ["Tab"], action: "Cycles inside the modal." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "DialogTrigger, AlertDialogContent",
        meaning: "The alert is open.",
      },
      { attribute: ":open", on: "AlertDialogContent", meaning: "Native pseudo-class equivalent." },
    ],
    "No native form behavior; put a confirmation form inside when needed.",
    ["dialog", "button"],
  ),
  common(
    "popover",
    "Popover",
    "pickers",
    ["Popover", "PopoverArrow", "PopoverContent", "PopoverTrigger"],
    "<Popover><PopoverTrigger>More</PopoverTrigger><PopoverContent><PopoverArrow />Extra choices</PopoverContent></Popover>",
    [
      p("Popover", "root", "Non-modal open-state provider.", false, false, [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
      ]),
      p("PopoverTrigger", "trigger", "Button that opens content.", true, false, [
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ]),
      p("PopoverContent", "content", "Non-modal floating content.", true, false, [
        prop(
          "aria-label",
          "string",
          "Accessible name; the content is a dialog with no default name.",
        ),
        prop("popover", '"auto" | "manual" | "none"', "Top-layer mode; auto by default."),
        prop(
          "placement",
          "PopoverPlacement",
          'Trigger side to open on, such as "bottom start"; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the trigger and the surface."),
      ]),
      p("PopoverArrow", "content", "Optional decorative arrow inside PopoverContent.", true, true),
    ],
    [
      { keys: ["Enter"], action: "Opens or closes from trigger." },
      { keys: ["Space"], action: "Opens or closes from trigger." },
      { keys: ["Escape"], action: "Closes and restores trigger focus." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "PopoverTrigger, PopoverContent",
        meaning: "The popover is open.",
      },
      {
        attribute: ":popover-open",
        on: "PopoverContent",
        meaning: "Native pseudo-class equivalent.",
      },
    ],
    "No native form behavior.",
    ["dialog", "menu", "tooltip"],
  ),
  common(
    "tooltip",
    "Tooltip",
    "pickers",
    ["Tooltip", "TooltipArrow", "TooltipPopover", "TooltipTrigger"],
    '<Tooltip><TooltipTrigger aria-label="More information">i</TooltipTrigger><TooltipPopover placement="top" offset={6}>Helpful detail<TooltipArrow /></TooltipPopover></Tooltip>',
    [
      p("Tooltip", "root", "Open-state provider.", false, false, [
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
      ]),
      p("TooltipTrigger", "trigger", "Element that reveals help on focus or hover.", true, false, [
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ]),
      p("TooltipPopover", "content", "Short descriptive text.", true, false, [
        prop(
          "placement",
          "PopoverPlacement",
          'Trigger side to open on, such as "top" or "bottom start"; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the trigger and the tooltip."),
      ]),
      p(
        "TooltipArrow",
        "content",
        "Optional decorative caret inside TooltipPopover; style it to point at the trigger.",
        true,
        true,
      ),
    ],
    [
      { keys: ["Escape"], action: "Closes the tooltip." },
      { keys: ["Tab"], action: "Focus reveals the tooltip on its trigger." },
    ],
    [
      {
        attribute: "[data-open]",
        on: "TooltipTrigger, TooltipPopover",
        meaning: "The tooltip is visible.",
      },
      {
        attribute: ":popover-open",
        on: "TooltipPopover",
        meaning: "Native pseudo-class equivalent.",
      },
    ],
    "No native form behavior.",
    ["popover", "visually-hidden"],
  ),
];

export const componentGroups = [
  {
    id: "actions",
    title: "Actions",
    description: "Presses, links, uploads, and hidden helper text.",
    components: action,
  },
  {
    id: "fields",
    title: "Fields",
    description: "Inputs and choices that collect values.",
    components: field,
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "Disclosure, navigation, and collection patterns.",
    components: navigation,
  },
  {
    id: "pickers",
    title: "Pickers and overlays",
    description: "Choices and floating layers.",
    components: picker,
  },
] satisfies ComponentGroup[];
export const components = componentGroups.flatMap((group) => group.components);
export const componentBySlug = new Map(components.map((item) => [item.slug, item]));
