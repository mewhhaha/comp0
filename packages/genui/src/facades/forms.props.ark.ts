// The forms facades' props, written with ArkType and precompiled into forms.props.ts.
// Edit here, then run `pnpm test -u` to regenerate.
import { type } from "arktype";
import { stepProps } from "./actions.props.ark.js";
import { bindable, list, nodes, oneOf } from "../catalog/schema.js";
import { textTypes } from "./tokens.js";

const optionProps = type({
  value: type("string").describe("The value that is stored and submitted."),
  "label?": type("string").describe("Visible text; defaults to the value."),
});

const optionList = type("string")
  .or(optionProps)
  .array()
  .describe(
    "The choices: plain strings (shown and stored as written) or { value, label } when the stored value differs from the text.",
  );

export const formProps = {
  name: type("string").describe("Short identifier for the form, unique in the response."),
  title: type("string").describe("Accessible name of the form. Add a Heading to show it."),
  "submitLabel?": type("string").describe('Text of the submit button; "Submit" by default.'),
  "action?": list(
    stepProps,
    "Steps to run in order on submit instead of sending the answers to the assistant: a call step without args receives the form's values by control name. Stops at the first that fails.",
  ),
  children: nodes("The form controls and any explanatory components."),
};

export const textFieldProps = {
  label: type("string").describe("Visible label naming the field. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "value?": bindable(
    type("string"),
    'Initial text, or a binding {"$bind": name} the field reads and writes.',
  ),
  "required?": type("boolean").describe("The person must fill this in."),
  "placeholder?": type("string").describe("Example input; never a substitute for the label."),
  "inputType?": oneOf(textTypes, 'Kind of text: "text" (default), "email", "tel", or "url".'),
  "description?": type("string").describe("Help text shown under the field."),
};

export const textAreaProps = {
  label: type("string").describe("Visible label naming the field. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "value?": bindable(type("string"), 'Initial text, or a binding {"$bind": name}.'),
  "required?": type("boolean").describe("The person must fill this in."),
  "placeholder?": type("string").describe("Example input; never a substitute for the label."),
  "description?": type("string").describe("Help text shown under the field."),
};

export const numberFieldProps = {
  label: type("string").describe("Visible label naming the field. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "value?": bindable(
    type("number"),
    'Initial number, or a binding {"$bind": name} the field reads and writes; empty when omitted.',
  ),
  "min?": type("number").describe("Smallest allowed number."),
  "max?": type("number").describe("Largest allowed number."),
  "step?": type("number").describe("Amount one step changes the number; 1 by default."),
  "required?": type("boolean").describe("The person must fill this in."),
  "description?": type("string").describe("Help text shown under the field."),
};

export const selectProps = {
  label: type("string").describe("Visible label naming the field. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  options: optionList,
  "value?": bindable(
    type("string"),
    'Initially chosen option value, or a binding {"$bind": name} the field reads and writes.',
  ),
  "required?": type("boolean").describe("The person must choose one."),
  "description?": type("string").describe("Help text shown under the field."),
};

export const radioGroupProps = {
  label: type("string").describe("Visible question or label naming the group. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  options: optionList,
  "value?": bindable(
    type("string"),
    'Initially chosen option value, or a binding {"$bind": name} the group reads and writes.',
  ),
  "required?": type("boolean").describe("The person must choose one."),
  "description?": type("string").describe("Help text shown under the group."),
};

export const checkboxGroupProps = {
  label: type("string").describe("Visible label naming the group. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  options: optionList,
  "value?": bindable(
    type("string[]"),
    'Option values that start checked, or a binding {"$bind": name}.',
  ),
  "description?": type("string").describe("Help text shown under the group."),
};

export const checkboxProps = {
  label: type("string").describe("Visible text next to the checkbox. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "checked?": bindable(
    type("boolean"),
    'Starts checked, or a binding {"$bind": name} the checkbox reads and writes.',
  ),
  "required?": type("boolean").describe("Must be checked to submit."),
};

export const switchProps = {
  label: type("string").describe("Visible text next to the switch, naming the setting. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "checked?": bindable(
    type("boolean"),
    'Starts on, or a binding {"$bind": name} the switch reads and writes.',
  ),
};

export const sliderProps = {
  label: type("string").describe("Visible label naming the setting. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "min?": type("number").describe("Lowest value; 0 by default."),
  "max?": type("number").describe("Highest value; 100 by default."),
  "value?": bindable(
    type("number"),
    'Initial value, or a binding {"$bind": name} the slider reads and writes; min by default.',
  ),
  "step?": type("number").describe("Amount one step changes the value; 1 by default."),
};

export const datePickerProps = {
  label: type("string").describe("Visible label naming the date. Required."),
  name: type("string").describe("Identifier of the field, unique in its form."),
  "value?": bindable(type("string"), 'Initial date as "YYYY-MM-DD", or a binding {"$bind": name}.'),
  "required?": type("boolean").describe("The person must pick a date."),
  "description?": type("string").describe("Help text shown under the field."),
};
