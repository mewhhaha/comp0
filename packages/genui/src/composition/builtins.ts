import { fromJsonSchema, kindOf, oneOf, type PropShape } from "../catalog/schema.js";
import { catalogSpecs } from "../catalog/specs.js";
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
  sliderProps,
  switchProps,
  textAreaProps,
  textFieldProps,
} from "../facades/forms.props.js";
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
import { comparisonProps, citedTextProps, outputProps } from "../facades/results.props.js";
import { alertProps, separatorProps } from "../facades/feedback.props.js";
import { imageProps } from "../facades/layout.props.js";
import { disclosureProps } from "../facades/disclosure.props.js";
import { spec, vocabulary } from "./spec.js";

const text = fromJsonSchema<string>({ type: "string" });
const number = fromJsonSchema<number>({ type: "number" });
const boolean = fromJsonSchema<boolean>({ type: "boolean" });
const strings = fromJsonSchema<string[]>({ type: "array", items: { type: "string" } });
const gap = oneOf(["xs", "sm", "md", "lg", "xl"]);

function leaf<const TProps extends PropShape>(name: string, props: TProps, description?: string) {
  const literalProps = Object.fromEntries(
    Object.entries(props).map(([name, schema]) => {
      const kind = kindOf(schema);
      if (kind?.kind === "bindable" || kind?.kind === "computed") return [name, kind.inner];
      return [name, schema];
    }),
  ) as TProps;
  return spec(name, {
    description:
      description ?? catalogSpecs.find((entry) => entry.name === name)?.description ?? name,
    props: literalProps,
  });
}

function fieldProps<const TProps extends PropShape & { name: typeof text }>(props: TProps) {
  const { name: _name, ...rest } = props;
  return { ...rest, "name?": text };
}

export const stackSpec = spec("Stack", {
  description: "Lays out children vertically by default, or in a row.",
  props: {
    "direction?": oneOf(["column", "row"]),
    "gap?": gap,
    "align?": oneOf(["start", "center", "end", "stretch"]),
    "wrap?": boolean,
  },
  children: "nodes",
});
export const gridSpec = spec("Grid", {
  description: "Lays out children in equal columns; two columns by default.",
  props: { "columns?": number, "gap?": gap },
  children: "nodes",
});
export const cardSpec = spec("Card", {
  description:
    "Groups related children in a section. Give it a title when it needs a named region.",
  props: { "title?": text, "description?": text, "tone?": oneOf(["default", "muted", "accent"]) },
  children: "nodes",
});
export const headingSpec = spec("Heading", {
  description:
    "Titles the content below it. Write the heading as text children; keep heading levels in order.",
  props: { "level?": number },
  children: "text",
});
export const textSpec = spec("Text", {
  description: "A paragraph of plain text children. Markdown and HTML are shown literally.",
  props: {
    "tone?": oneOf(["default", "muted", "success", "warning", "danger"]),
    "size?": oneOf(["sm", "md", "lg"]),
  },
  children: "text",
});
export const listSpec = spec("List", {
  description: "A bulleted or numbered list. Each child is an Item.",
  props: { "ordered?": boolean },
  children: ["Item"],
});
export const itemSpec = spec("Item", {
  description: "One list item, written as text children. Only use inside List.",
  props: {},
  children: "text",
});
export const layout = vocabulary(
  stackSpec,
  gridSpec,
  cardSpec,
  headingSpec,
  textSpec,
  listSpec,
  itemSpec,
  leaf("Image", imageProps),
  leaf("Alert", alertProps),
  leaf("Separator", separatorProps),
);

export const formSpec = spec("Form", {
  description:
    "Groups form controls and a submit button. Label names the form; action runs on submit. Bind fields to shared names when other components depend on them.",
  props: {
    label: text,
    "name?": text,
    "submitLabel?": formProps["submitLabel?"],
    "action?": formProps["action?"],
  },
  children: "nodes",
});
export const selectSpec = spec("Select", {
  description:
    "A labelled dropdown. Each child is an Option with its own value and visible text. Bind reads and writes a shared value.",
  props: { label: text, "name?": text, "value?": text, "required?": boolean, "description?": text },
  binding: { prop: "value", kind: "string" },
  children: ["Option"],
});
export const optionSpec = spec("Option", {
  description:
    "One dropdown choice. Value is stored; text children label it. Only use inside Select.",
  props: { value: text, "disabled?": boolean },
  children: "text",
});
export const forms = vocabulary(
  formSpec,
  selectSpec,
  optionSpec,
  spec("TextField", {
    description: "A labelled single-line text input. Bind reads and writes shared text.",
    props: { ...fieldProps(textFieldProps), "value?": text },
    binding: { prop: "value", kind: "string" },
  }),
  spec("TextArea", {
    description: "A labelled multiline text input.",
    props: { ...fieldProps(textAreaProps), "value?": text },
    binding: { prop: "value", kind: "string" },
  }),
  spec("NumberField", {
    description: "A labelled number input with increase and decrease buttons.",
    props: { ...fieldProps(numberFieldProps), "value?": number },
    binding: { prop: "value", kind: "number" },
  }),
  spec("Slider", {
    description: "A labelled number chosen along a range. Min defaults to 0 and max to 100.",
    props: { ...fieldProps(sliderProps), "value?": number },
    binding: { prop: "value", kind: "number" },
  }),
  spec("Switch", {
    description: "A labelled on/off setting that applies right away.",
    props: { ...fieldProps(switchProps), "checked?": boolean },
    binding: { prop: "checked", kind: "boolean" },
  }),
  spec("Checkbox", {
    description: "A labelled yes/no choice.",
    props: { ...fieldProps(checkboxProps), "checked?": boolean },
    binding: { prop: "checked", kind: "boolean" },
  }),
  spec("RadioGroup", {
    description: "Choose exactly one of a few visible labelled options.",
    props: { ...fieldProps(radioGroupProps), "value?": text },
    binding: { prop: "value", kind: "string" },
  }),
  spec("CheckboxGroup", {
    description: "Choose any number of a few visible labelled options.",
    props: { ...fieldProps(checkboxGroupProps), "value?": strings },
    binding: { prop: "value", kind: "strings" },
  }),
  spec("DatePicker", {
    description: "A labelled calendar date. Values use YYYY-MM-DD.",
    props: { ...fieldProps(datePickerProps), "value?": text },
    binding: { prop: "value", kind: "string" },
  }),
);

const { label: _buttonLabel, ...buttonAttributes } = buttonProps;
const { label: _linkLabel, ...linkAttributes } = linkProps;
export const buttonSpec = spec("Button", {
  description:
    "A button with visible text children. Action runs steps on click; otherwise it sends its message, or its text, to the assistant.",
  props: buttonAttributes,
  children: "text",
});
export const linkSpec = spec("Link", {
  description: "A link with visible text children and a safe href.",
  props: linkAttributes,
  children: "text",
});
export const actions = vocabulary(
  buttonSpec,
  linkSpec,
  leaf("Suggestions", suggestionsProps),
  leaf("CopyButton", copyButtonProps),
);

export const tabsSpec = spec("Tabs", {
  description:
    "Switches between parallel views. Put Tab children inside TabList, followed by matching TabPanel children. Each Tab and its TabPanel share a value.",
  props: { "defaultValue?": text },
  children: ["TabList", "TabPanel"],
});
export const tabListSpec = spec("TabList", {
  description: "The labelled row of Tab buttons inside Tabs.",
  props: { label: text, "orientation?": oneOf(["horizontal", "vertical"]) },
  children: ["Tab"],
});
export const tabSpec = spec("Tab", {
  description:
    "A tab button with visible text children and a value matching its TabPanel. Only use inside TabList.",
  props: { value: text, "disabled?": boolean },
  children: "text",
});
export const tabPanelSpec = spec("TabPanel", {
  description: "Content of one tab, with the same value as its Tab. Only use inside Tabs.",
  props: { value: text },
  children: "nodes",
});
export const accordionSpec = spec("Accordion", {
  description: "Expandable Section children. One section opens at a time unless multiple is true.",
  props: {
    "multiple?": boolean,
    "defaultValue?": fromJsonSchema<string | string[]>({
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    }),
  },
  children: ["Section"],
});
export const sectionSpec = spec("Section", {
  description:
    "One accordion section. Title labels its expand button; children are its content. Only use inside Accordion.",
  props: { value: text, title: text, "disabled?": boolean },
  children: "nodes",
});
const { children: _disclosureChildren, ...disclosureAttributes } = disclosureProps;
export const disclosure = vocabulary(
  tabsSpec,
  tabListSpec,
  tabSpec,
  tabPanelSpec,
  accordionSpec,
  sectionSpec,
  spec("Disclosure", {
    description:
      "One optional section that opens and closes. Summary labels the button; children are its content.",
    props: disclosureAttributes,
    children: "nodes",
  }),
);

export const charts = vocabulary(
  leaf("Table", tableProps),
  leaf("BarChart", barChartProps),
  leaf("ColumnChart", columnChartProps),
  leaf("LineChart", lineChartProps),
  leaf("AreaChart", areaChartProps),
  leaf("PieChart", pieChartProps),
  leaf("Meter", meterProps),
  leaf("ProgressBar", progressBarProps),
  leaf(
    "Output",
    outputProps,
    "A labelled result next to the controls it depends on. Use an expression such as value={seats * 12} to update it live.",
  ),
  leaf("Comparison", comparisonProps),
  leaf("CitedText", citedTextProps),
);

/** Server-safe descriptions and schemas; React implementations live in parts.tsx. */
export const builtInVocabulary = vocabulary(layout, forms, charts, actions, disclosure);
