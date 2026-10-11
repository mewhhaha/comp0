import { type PropShape } from "../catalog/schema.js";
import { type CatalogEntry } from "../catalog/types.js";
import {
  buttonProps,
  copyButtonProps,
  linkProps,
  suggestionsProps,
} from "../facades/actions.props.js";
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
import { accordionProps, disclosureProps, tabsProps } from "../facades/disclosure.props.js";
import { alertProps, separatorProps } from "../facades/feedback.props.js";
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
import {
  cardProps,
  gridProps,
  headingProps,
  imageProps,
  listProps,
  stackProps,
  textProps,
} from "../facades/layout.props.js";
import { queryProps, slotProps } from "../facades/host.props.js";
import { citedTextProps, comparisonProps, outputProps } from "../facades/results.props.js";

const shapes: Record<string, PropShape> = {
  Stack: stackProps,
  Grid: gridProps,
  Card: cardProps,
  Heading: headingProps,
  Text: textProps,
  Image: imageProps,
  List: listProps,
  Slot: slotProps,
  Button: buttonProps,
  Link: linkProps,
  Suggestions: suggestionsProps,
  CopyButton: copyButtonProps,
  Form: formProps,
  TextField: textFieldProps,
  TextArea: textAreaProps,
  NumberField: numberFieldProps,
  Select: selectProps,
  RadioGroup: radioGroupProps,
  CheckboxGroup: checkboxGroupProps,
  Checkbox: checkboxProps,
  Switch: switchProps,
  Slider: sliderProps,
  DatePicker: datePickerProps,
  Tabs: tabsProps,
  Accordion: accordionProps,
  Disclosure: disclosureProps,
  Table: tableProps,
  BarChart: barChartProps,
  ColumnChart: columnChartProps,
  LineChart: lineChartProps,
  AreaChart: areaChartProps,
  PieChart: pieChartProps,
  Meter: meterProps,
  ProgressBar: progressBarProps,
  Output: outputProps,
  Comparison: comparisonProps,
  CitedText: citedTextProps,
  Alert: alertProps,
  Separator: separatorProps,
  Query: queryProps,
};

/**
 * The built-in components as the server knows them: names and prop schemas, without the React
 * components. The server validates the layout with it; interactive components render on the
 * client from their validated JSON.
 */
export const serverCatalog: readonly CatalogEntry[] = Object.entries(shapes).map(
  ([name, props]) => ({ name, props, description: "", group: "", component: () => null }),
);
