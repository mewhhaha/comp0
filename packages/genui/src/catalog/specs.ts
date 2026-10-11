import { type CatalogSpec } from "./types.js";
import {
  cardProps,
  gridProps,
  headingProps,
  imageProps,
  listProps,
  stackProps,
  textProps,
} from "../facades/layout.props.js";
import {
  buttonProps,
  copyButtonProps,
  linkProps,
  suggestionsProps,
} from "../facades/actions.props.js";
import {
  checkboxGroupProps,
  checkboxProps,
  datePickerProps,
  formProps,
  numberFieldProps,
  radioGroupProps,
  selectProps,
  sliderProps,
  switchProps,
  textAreaProps,
  textFieldProps,
} from "../facades/forms.props.js";
import { accordionProps, disclosureProps, tabsProps } from "../facades/disclosure.props.js";
import {
  areaChartProps,
  barChartProps,
  columnChartProps,
  lineChartProps,
  meterProps,
  pieChartProps,
  progressBarProps,
  tableProps,
} from "../facades/data.props.js";
import { citedTextProps, comparisonProps, outputProps } from "../facades/results.props.js";
import { alertProps, separatorProps } from "../facades/feedback.props.js";
import { queryProps, slotProps } from "../facades/host.props.js";

/** Shared by every labelled form control's description. */
const labelledField =
  "A form control. Always give it a visible label; it names the control for everyone.";

/**
 * The built-in components as plain data: the name a model writes, the group it is listed under,
 * the description written for the model, and the prop schemas. Nothing here renders, so it is
 * safe on a server; `catalog` pairs each spec with its React component.
 */
export const catalogSpecs: readonly CatalogSpec[] = [
  {
    name: "Stack",
    group: "Layout",
    description:
      "Lays out components in order, vertically by default or in a row. Use it for the root and to group related components. Requires children.",
    props: stackProps,
  },
  {
    name: "Grid",
    group: "Layout",
    description:
      "Places components in equal columns, for dashboards and side-by-side cards. Requires children; columns defaults to 2.",
    props: gridProps,
  },
  {
    name: "Card",
    group: "Layout",
    description:
      "A titled section that groups related content, such as one metric, one result, or one step. Requires a title and children.",
    props: cardProps,
  },
  {
    name: "Heading",
    group: "Layout",
    description:
      "A heading that titles the content below it. Use it to structure a long response. Requires text; keep levels in order.",
    props: headingProps,
  },
  {
    name: "Text",
    group: "Layout",
    description:
      "A paragraph of plain text. Use it for explanations around other components. Requires text.",
    props: textProps,
  },
  {
    name: "Image",
    group: "Layout",
    description:
      "An image from an http(s) or relative URL. Requires src and alt text that describes the image; add a caption when the image needs explaining.",
    props: imageProps,
  },
  {
    name: "List",
    group: "Layout",
    description:
      "A bulleted or numbered list of short text items. Use it for steps, options, or highlights. Requires items.",
    props: listProps,
  },
  {
    name: "Button",
    group: "Actions",
    description:
      'A button that sends a message back to the assistant when pressed, for choices and next steps ("Show details", "Book it"). Inside a Form it sends that form\'s values. Requires a label that says what it does.',
    props: buttonProps,
  },
  {
    name: "Link",
    group: "Actions",
    description:
      "A link to a web page, email address, phone number, or section. Requires label text and an http(s), mailto:, tel:, relative, or #fragment href; other URLs are not linked.",
    props: linkProps,
  },
  {
    name: "Suggestions",
    group: "Actions",
    description:
      "Quick replies for likely next steps. Pressing one sends its text as the person's next message. Requires a label for the group and the list of replies; keep them short and few.",
    props: suggestionsProps,
  },
  {
    name: "CopyButton",
    group: "Actions",
    description:
      "A button that copies text to the clipboard, such as a code snippet, command, or address. Show the text itself nearby, since the person cannot see what is copied. Requires a label that says what is copied and the value.",
    props: copyButtonProps,
  },
  {
    name: "Form",
    group: "Forms",
    description:
      "Groups form controls and a submit button. When the person submits, the assistant receives their answers, described with the controls' labels. Requires name, title, and children; put controls (TextField, Select, ...) inside, and a Button inside only for secondary actions.",
    props: formProps,
  },
  {
    name: "TextField",
    group: "Forms",
    description: `A single-line text input (name, email, phone, URL). ${labelledField} Requires label and name.`,
    props: textFieldProps,
  },
  {
    name: "TextArea",
    group: "Forms",
    description: `A multi-line text input for longer answers. ${labelledField} Requires label and name.`,
    props: textAreaProps,
  },
  {
    name: "NumberField",
    group: "Forms",
    description: `A numeric input with increase and decrease buttons, for quantities and amounts. ${labelledField} Requires label and name; add min and max when there are limits.`,
    props: numberFieldProps,
  },
  {
    name: "Select",
    group: "Forms",
    description: `A drop-down for choosing one of many options (more than five). ${labelledField} Requires label, name, and options.`,
    props: selectProps,
  },
  {
    name: "RadioGroup",
    group: "Forms",
    description: `Choose exactly one of a few visible options (five or fewer). ${labelledField} Requires label, name, and options.`,
    props: radioGroupProps,
  },
  {
    name: "CheckboxGroup",
    group: "Forms",
    description: `Choose any number of a few visible options. ${labelledField} Requires label, name, and options; the value is the list of checked option values.`,
    props: checkboxGroupProps,
  },
  {
    name: "Checkbox",
    group: "Forms",
    description:
      "A single yes/no choice such as accepting terms. The label is the visible text next to the box. Requires label and name.",
    props: checkboxProps,
  },
  {
    name: "Switch",
    group: "Forms",
    description:
      "An on/off setting that applies right away, such as notifications. The label names the setting. Requires label and name.",
    props: switchProps,
  },
  {
    name: "Slider",
    group: "Forms",
    description: `A number chosen along a range, when the exact value matters less than the rough amount. ${labelledField} Requires label and name; min is 0 and max is 100 unless given.`,
    props: sliderProps,
  },
  {
    name: "DatePicker",
    group: "Forms",
    description: `A calendar date. The value is "YYYY-MM-DD". ${labelledField} Requires label and name.`,
    props: datePickerProps,
  },
  {
    name: "Tabs",
    group: "Disclosure",
    description:
      "Switches between parallel views of the same subject (for example per region or per plan). Requires tabs, each { label, children }; only one view is visible at a time.",
    props: tabsProps,
  },
  {
    name: "Accordion",
    group: "Disclosure",
    description:
      "A list of sections that expand one at a time (or several with multiple). Use it for FAQs and long, skimmable content. Requires items, each { title, children, open? }.",
    props: accordionProps,
  },
  {
    name: "Disclosure",
    group: "Disclosure",
    description:
      "One show/hide section for optional details. Requires summary and children; use Accordion for several.",
    props: disclosureProps,
  },
  {
    name: "Table",
    group: "Data",
    description:
      "A table for comparing items across attributes. Requires caption, columns, and rows; the first column should name each row. Use it instead of a chart when exact values matter. Large tables are cut off (24 columns, 800 cells).",
    props: tableProps,
  },
  {
    name: "BarChart",
    group: "Data",
    description:
      "Horizontal bars comparing a number across categories, best for long labels or rankings. Requires title and data ({ label, value } objects); add a description with the takeaway. A data table is included for screen readers.",
    props: barChartProps,
  },
  {
    name: "ColumnChart",
    group: "Data",
    description:
      "Vertical columns comparing a number across a few short categories. Requires title and data ({ label, value } objects); add a description with the takeaway.",
    props: columnChartProps,
  },
  {
    name: "LineChart",
    group: "Data",
    description:
      "A line showing how a number changes along an ordered axis such as time. Requires title and data ({ x, y } objects with increasing x); add a description with the takeaway.",
    props: lineChartProps,
  },
  {
    name: "AreaChart",
    group: "Data",
    description:
      "Like LineChart with the area below filled, for totals that accumulate. Requires title and data ({ x, y } objects with increasing x).",
    props: areaChartProps,
  },
  {
    name: "PieChart",
    group: "Data",
    description:
      "Parts of a whole, for up to six slices that sum to a meaningful total. Requires title and data ({ label, value } objects with values >= 0). Prefer BarChart for more slices.",
    props: pieChartProps,
  },
  {
    name: "Meter",
    group: "Data",
    description:
      "A value within a known range, such as disk usage or a score. Requires label and value; min is 0 and max is 100 unless given. Use ProgressBar for task progress.",
    props: meterProps,
  },
  {
    name: "ProgressBar",
    group: "Data",
    description:
      "Progress of a task from 0 to 100 percent. Requires label; omit value when the amount is unknown.",
    props: progressBarProps,
  },
  {
    name: "Output",
    group: "Data",
    description:
      'A computed result shown next to the controls it depends on, such as a price or a total. Bind controls with {"$bind": name} and write the value as {"$expr": "..."} over those names, and it updates live. Requires label and value.',
    props: outputProps,
  },
  {
    name: "Comparison",
    group: "Data",
    description:
      "Sets options side by side, such as plans or products, with a recommended one. Requires caption, options, and features; each feature has one value per option, true or false for included or not.",
    props: comparisonProps,
  },
  {
    name: "CitedText",
    group: "Data",
    description:
      "An answer whose claims point at numbered sources. Requires text with [1]-style markers and the list of sources ({ title, href?, note? }); the sources are listed under the text and each marker links to its source.",
    props: citedTextProps,
  },
  {
    name: "Alert",
    group: "Feedback",
    description:
      "A highlighted message: confirmation, information, a warning, or an error. Requires message; tone is info by default. Warnings and errors are announced immediately.",
    props: alertProps,
  },
  {
    name: "Separator",
    group: "Feedback",
    description: "A divider line between sections. Takes no required arguments.",
    props: separatorProps,
  },
  {
    name: "Query",
    group: "Host",
    description:
      "Calls one of the host's tools and stores the result under a name, again whenever a bound argument changes, without asking the assistant. Draws nothing: bind a chart's data, a table's rows, or a list's items to the name to show the result. Requires tool and into.",
    props: queryProps,
  },
  {
    name: "Slot",
    group: "Host",
    description:
      "Places one of the host's own views, such as a live preview, by name. The host's views read values bound by your controls. Requires name.",
    props: slotProps,
  },
];
