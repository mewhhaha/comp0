// Generated from forms.props.ark.ts by `pnpm test -u` (src/facades/props.test.ts). Do not edit:
// change the ArkType source and regenerate.
import { bindable, fromJsonSchema, list, nodes, oneOf } from "../catalog/schema.js";

export const formProps = {
  name: fromJsonSchema<string>({
    type: "string",
    description: "Short identifier for the form, unique in the response.",
  }),
  title: fromJsonSchema<string>({
    type: "string",
    description: "Accessible name of the form. Add a Heading to show it.",
  }),
  "submitLabel?": fromJsonSchema<string>({
    type: "string",
    description: 'Text of the submit button; "Submit" by default.',
  }),
  "action?": list(
    {
      "call?": fromJsonSchema<string>({
        type: "string",
        description: "Name of a host tool to call, from the list of tools.",
      }),
      "args?": fromJsonSchema<Record<string, unknown>>({
        type: "object",
        description:
          'Arguments for the tool; any value may be {"$bind": name} or {"$expr": "..."}.',
        additionalProperties: {},
      }),
      "into?": fromJsonSchema<string>({
        type: "string",
        description: "Name to store the tool's result under, for bound props.",
      }),
      "set?": fromJsonSchema<string>({ type: "string", description: "Name of a value to set." }),
      "value?": fromJsonSchema<unknown>({
        description: 'The value to set; may be {"$bind": name} or {"$expr": "..."}.',
      }),
      "send?": fromJsonSchema<string>({
        type: "string",
        description: "A message to send to the assistant as the person's next turn.",
      }),
    },
    "Steps to run in order on submit instead of sending the answers to the assistant: a call step without args receives the form's values by control name. Stops at the first that fails.",
  ),
  children: nodes("The form controls and any explanatory components."),
};
export const textFieldProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the field. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "value?": bindable(
    fromJsonSchema<string>({ type: "string" }),
    'Initial text, or a binding {"$bind": name} the field reads and writes.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must fill this in.",
  }),
  "placeholder?": fromJsonSchema<string>({
    type: "string",
    description: "Example input; never a substitute for the label.",
  }),
  "inputType?": oneOf(
    ["text", "email", "tel", "url"],
    'Kind of text: "text" (default), "email", "tel", or "url".',
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the field.",
  }),
};
export const textAreaProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the field. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "value?": bindable(
    fromJsonSchema<string>({ type: "string" }),
    'Initial text, or a binding {"$bind": name}.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must fill this in.",
  }),
  "placeholder?": fromJsonSchema<string>({
    type: "string",
    description: "Example input; never a substitute for the label.",
  }),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the field.",
  }),
};
export const numberFieldProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the field. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "value?": bindable(
    fromJsonSchema<number>({ type: "number" }),
    'Initial number, or a binding {"$bind": name} the field reads and writes; empty when omitted.',
  ),
  "min?": fromJsonSchema<number>({ type: "number", description: "Smallest allowed number." }),
  "max?": fromJsonSchema<number>({ type: "number", description: "Largest allowed number." }),
  "step?": fromJsonSchema<number>({
    type: "number",
    description: "Amount one step changes the number; 1 by default.",
  }),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must fill this in.",
  }),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the field.",
  }),
};
export const selectProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the field. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  options: fromJsonSchema<(string | { value: string; label?: string })[]>({
    type: "array",
    description:
      "The choices: plain strings (shown and stored as written) or { value, label } when the stored value differs from the text.",
    items: {
      anyOf: [
        { type: "string" },
        {
          type: "object",
          properties: {
            value: { type: "string", description: "The value that is stored and submitted." },
            label: { type: "string", description: "Visible text; defaults to the value." },
          },
          required: ["value"],
        },
      ],
    },
  }),
  "value?": bindable(
    fromJsonSchema<string>({ type: "string" }),
    'Initially chosen option value, or a binding {"$bind": name} the field reads and writes.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must choose one.",
  }),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the field.",
  }),
};
export const radioGroupProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible question or label naming the group. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  options: fromJsonSchema<(string | { value: string; label?: string })[]>({
    type: "array",
    description:
      "The choices: plain strings (shown and stored as written) or { value, label } when the stored value differs from the text.",
    items: {
      anyOf: [
        { type: "string" },
        {
          type: "object",
          properties: {
            value: { type: "string", description: "The value that is stored and submitted." },
            label: { type: "string", description: "Visible text; defaults to the value." },
          },
          required: ["value"],
        },
      ],
    },
  }),
  "value?": bindable(
    fromJsonSchema<string>({ type: "string" }),
    'Initially chosen option value, or a binding {"$bind": name} the group reads and writes.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must choose one.",
  }),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the group.",
  }),
};
export const checkboxGroupProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the group. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  options: fromJsonSchema<(string | { value: string; label?: string })[]>({
    type: "array",
    description:
      "The choices: plain strings (shown and stored as written) or { value, label } when the stored value differs from the text.",
    items: {
      anyOf: [
        { type: "string" },
        {
          type: "object",
          properties: {
            value: { type: "string", description: "The value that is stored and submitted." },
            label: { type: "string", description: "Visible text; defaults to the value." },
          },
          required: ["value"],
        },
      ],
    },
  }),
  "value?": bindable(
    fromJsonSchema<string[]>({ type: "array", items: { type: "string" } }),
    'Option values that start checked, or a binding {"$bind": name}.',
  ),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the group.",
  }),
};
export const checkboxProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible text next to the checkbox. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "checked?": bindable(
    fromJsonSchema<boolean>({ type: "boolean" }),
    'Starts checked, or a binding {"$bind": name} the checkbox reads and writes.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "Must be checked to submit.",
  }),
};
export const switchProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible text next to the switch, naming the setting. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "checked?": bindable(
    fromJsonSchema<boolean>({ type: "boolean" }),
    'Starts on, or a binding {"$bind": name} the switch reads and writes.',
  ),
};
export const sliderProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the setting. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "min?": fromJsonSchema<number>({ type: "number", description: "Lowest value; 0 by default." }),
  "max?": fromJsonSchema<number>({ type: "number", description: "Highest value; 100 by default." }),
  "value?": bindable(
    fromJsonSchema<number>({ type: "number" }),
    'Initial value, or a binding {"$bind": name} the slider reads and writes; min by default.',
  ),
  "step?": fromJsonSchema<number>({
    type: "number",
    description: "Amount one step changes the value; 1 by default.",
  }),
};
export const datePickerProps = {
  label: fromJsonSchema<string>({
    type: "string",
    description: "Visible label naming the date. Required.",
  }),
  name: fromJsonSchema<string>({
    type: "string",
    description: "Identifier of the field, unique in its form.",
  }),
  "value?": bindable(
    fromJsonSchema<string>({ type: "string" }),
    'Initial date as "YYYY-MM-DD", or a binding {"$bind": name}.',
  ),
  "required?": fromJsonSchema<boolean>({
    type: "boolean",
    description: "The person must pick a date.",
  }),
  "description?": fromJsonSchema<string>({
    type: "string",
    description: "Help text shown under the field.",
  }),
};
