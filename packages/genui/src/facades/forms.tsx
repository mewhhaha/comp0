import { use, useId, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  Button,
  Calendar,
  CalendarGrid,
  CalendarHeader,
  CalendarNextButton,
  CalendarPreviousButton,
  Checkbox,
  CheckboxGroup,
  DateField,
  DatePicker,
  DatePickerPopover,
  DatePickerTrigger,
  Description,
  Input,
  Label,
  Legend,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  TextArea,
  TextField,
} from "@comp0/react";
import {
  FieldRegistry,
  FieldRegistryContext,
  FormNameContext,
  fieldKey,
  useRegisterField,
  useStateKey,
} from "../bridge/fields.js";
import { useField } from "../bridge/state.js";
import { bindable, nodes } from "../catalog/schema.js";
import { defineEntry, type CatalogProps } from "../catalog/types.js";
import { describeFormValues, type FormFieldDescriptor } from "../describe.js";
import { type JsonValue } from "../json/parse.js";
import { useGenUI } from "../render/context.js";
import { asBoolean, asNumber, asText, asToken, uniqueBy } from "../safe.js";

type ChoiceOption = { value: string; label: string };

/** The most choices a control lists; a longer list is left to a search the host app provides. */
const maxOptions = 200;

/**
 * Options arrive as plain strings or as `{ value, label }` objects, and may be half-written while
 * streaming.
 * Entries without a value are skipped and values are unique, because collections reject duplicates.
 */
export function normalizeOptions(value: unknown): ChoiceOption[] {
  if (!Array.isArray(value)) return [];
  const options: ChoiceOption[] = [];
  for (const item of value) {
    if (options.length >= maxOptions) break;
    if (typeof item === "string") {
      if (item !== "") options.push({ value: item, label: item });
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const optionValue = asText(record.value);
    if (optionValue === "") continue;
    const label = asText(record.label);
    options.push({ value: optionValue, label: label === "" ? optionValue : label });
  }
  return uniqueBy(options, (option) => option.value);
}

const optionProps = z.object({
  value: z.string().describe("The value that is stored and submitted."),
  label: z.string().optional().describe("Visible text; defaults to the value."),
});

const optionList = z
  .array(z.union([z.string(), optionProps]))
  .describe(
    "The choices: plain strings (shown and stored as written) or { value, label } when the stored value differs from the text.",
  );

const formProps = z.object({
  name: z.string().describe("Short identifier for the form, unique in the response."),
  title: z.string().describe("Accessible name of the form. Add a Heading to show it."),
  children: nodes("The form controls and any explanatory components."),
  submitLabel: z.string().optional().describe('Text of the submit button; "Submit" by default.'),
});

export function FormFacade({ name, title, children, submitLabel }: CatalogProps<typeof formProps>) {
  const formName = fieldKey(name, title);
  const { act, store, streaming } = useGenUI();
  const [registry] = useState(() => new FieldRegistry());
  const enclosing = use(FieldRegistryContext);
  const submitText = asText(submitLabel).trim() === "" ? "Submit" : asText(submitLabel);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Submitting while streaming would send controls that are still being written.
    if (streaming) return;
    const fields = registry.list();
    const values: Record<string, JsonValue> = {};
    for (const field of fields) {
      const value = store.get(field.key) ?? field.initial;
      if (value !== undefined) values[field.name] = value;
    }
    act({
      type: "form",
      name: formName,
      message: describeFormValues(fields, values) || submitText,
      values,
    });
  }

  // A form inside a form is invalid HTML. The inner one becomes a labelled group of the outer
  // form, whose submit reports its controls too.
  if (enclosing !== null) {
    return (
      <fieldset data-slot="form" aria-label={asText(title)}>
        {children}
      </fieldset>
    );
  }
  return (
    <FormNameContext value={formName}>
      <FieldRegistryContext value={registry}>
        <form data-slot="form" aria-label={asText(title)} onSubmit={submit}>
          {children}
          <Button type="submit" data-slot="form-submit" disabled={streaming}>
            {submitText}
          </Button>
        </form>
      </FieldRegistryContext>
    </FormNameContext>
  );
}

/** A control's identity, state, and registration with its form. */
function useControl<TValue extends JsonValue>(
  name: unknown,
  label: unknown,
  literal: TValue | undefined,
  binding: unknown,
  options?: ChoiceOption[],
) {
  const key = fieldKey(name, label);
  const stateKey = useStateKey(key);
  const field = useField<TValue>(stateKey, literal, binding);
  const descriptor: FormFieldDescriptor = { name: key, label: asText(label) };
  if (options !== undefined) descriptor.options = options;
  useRegisterField({ ...descriptor, key: field.key, initial: field.fallback });
  return { key, field };
}

const textTypes = ["text", "email", "tel", "url"] as const;

const textFieldProps = z.object({
  label: z.string().describe("Visible label naming the field. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  value: bindable(z.string())
    .optional()
    .describe('Initial text, or a binding {"$bind": name} the field reads and writes.'),
  required: z.boolean().optional().describe("The person must fill this in."),
  placeholder: z.string().optional().describe("Example input; never a substitute for the label."),
  inputType: z
    .enum(textTypes)
    .optional()
    .describe('Kind of text: "text" (default), "email", "tel", or "url".'),
  description: z.string().optional().describe("Help text shown under the field."),
});

export function TextFieldFacade({
  label,
  name,
  value,
  required,
  placeholder,
  inputType,
  description,
}: CatalogProps<typeof textFieldProps>) {
  const { key, field } = useControl<string>(
    name,
    label,
    typeof value === "string" ? value : undefined,
    value,
  );
  const hint = asText(description);
  return (
    <TextField
      as="div"
      data-slot="text-field"
      value={asText(field.value)}
      onChange={field.setValue}
      required={required === true}
    >
      <Label>{asText(label)}</Label>
      <Input
        name={key}
        type={asToken(inputType, textTypes) ?? "text"}
        placeholder={asText(placeholder) || undefined}
      />
      {hint === "" ? null : <Description>{hint}</Description>}
    </TextField>
  );
}

const textAreaProps = z.object({
  label: z.string().describe("Visible label naming the field. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  value: bindable(z.string()).optional().describe('Initial text, or a binding {"$bind": name}.'),
  required: z.boolean().optional().describe("The person must fill this in."),
  placeholder: z.string().optional().describe("Example input; never a substitute for the label."),
  description: z.string().optional().describe("Help text shown under the field."),
});

export function TextAreaFacade({
  label,
  name,
  value,
  required,
  placeholder,
  description,
}: CatalogProps<typeof textAreaProps>) {
  const { key, field } = useControl<string>(
    name,
    label,
    typeof value === "string" ? value : undefined,
    value,
  );
  const hint = asText(description);
  return (
    <TextField
      as="div"
      data-slot="text-area"
      value={asText(field.value)}
      onChange={field.setValue}
      required={required === true}
    >
      <Label>{asText(label)}</Label>
      <TextArea name={key} placeholder={asText(placeholder) || undefined} />
      {hint === "" ? null : <Description>{hint}</Description>}
    </TextField>
  );
}

const numberFieldProps = z.object({
  label: z.string().describe("Visible label naming the field. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  value: bindable(z.number())
    .optional()
    .describe(
      'Initial number, or a binding {"$bind": name} the field reads and writes; empty when omitted.',
    ),
  min: z.number().optional().describe("Smallest allowed number."),
  max: z.number().optional().describe("Largest allowed number."),
  step: z.number().optional().describe("Amount one step changes the number; 1 by default."),
  required: z.boolean().optional().describe("The person must fill this in."),
  description: z.string().optional().describe("Help text shown under the field."),
});

export function NumberFieldFacade({
  label,
  name,
  value,
  min,
  max,
  step,
  required,
  description,
}: CatalogProps<typeof numberFieldProps>) {
  const { key, field } = useControl<number | null>(name, label, asNumber(value), value);
  const hint = asText(description);
  const labelText = asText(label);
  return (
    <NumberField
      data-slot="number-field"
      name={key}
      // An empty field is NaN, which the input shows as no text.
      value={asNumber(field.value) ?? Number.NaN}
      onChange={(next) => field.setValue(Number.isNaN(next) ? null : next)}
      min={asNumber(min)}
      max={asNumber(max)}
      step={asNumber(step)}
      required={required === true}
    >
      <Label>{labelText}</Label>
      <NumberFieldInput />
      <NumberFieldDecrement aria-label={`Decrease ${labelText}`}>{"−"}</NumberFieldDecrement>
      <NumberFieldIncrement aria-label={`Increase ${labelText}`}>+</NumberFieldIncrement>
      {hint === "" ? null : <Description>{hint}</Description>}
    </NumberField>
  );
}

const selectProps = z.object({
  label: z.string().describe("Visible label naming the field. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  options: optionList,
  value: bindable(z.string())
    .optional()
    .describe(
      'Initially chosen option value, or a binding {"$bind": name} the field reads and writes.',
    ),
  required: z.boolean().optional().describe("The person must choose one."),
  description: z.string().optional().describe("Help text shown under the field."),
});

export function SelectFacade({
  label,
  name,
  options,
  value,
  required,
  description,
}: CatalogProps<typeof selectProps>) {
  const choices = normalizeOptions(options);
  const { key, field } = useControl<string>(
    name,
    label,
    typeof value === "string" ? value : undefined,
    value,
    choices,
  );
  const hint = asText(description);
  return (
    <Select
      as="div"
      name={key}
      value={asText(field.value)}
      onChange={field.setValue}
      required={required === true}
    >
      <Label>{asText(label)}</Label>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectPopover>
        {choices.map((option) => (
          <SelectOption key={option.value} value={option.value}>
            {option.label}
          </SelectOption>
        ))}
      </SelectPopover>
      {hint === "" ? null : <Description>{hint}</Description>}
    </Select>
  );
}

const radioGroupProps = z.object({
  label: z.string().describe("Visible question or label naming the group. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  options: optionList,
  value: bindable(z.string())
    .optional()
    .describe(
      'Initially chosen option value, or a binding {"$bind": name} the group reads and writes.',
    ),
  required: z.boolean().optional().describe("The person must choose one."),
  description: z.string().optional().describe("Help text shown under the group."),
});

export function RadioGroupFacade({
  label,
  name,
  options,
  value,
  required,
  description,
}: CatalogProps<typeof radioGroupProps>) {
  const choices = normalizeOptions(options);
  const { key, field } = useControl<string>(
    name,
    label,
    typeof value === "string" ? value : undefined,
    value,
    choices,
  );
  const hint = asText(description);
  return (
    <RadioGroup
      data-slot="radio-group"
      name={key}
      value={asText(field.value)}
      onChange={field.setValue}
      required={required === true}
    >
      <Legend>{asText(label)}</Legend>
      {hint === "" ? null : <Description>{hint}</Description>}
      {choices.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
        </Radio>
      ))}
    </RadioGroup>
  );
}

const checkboxGroupProps = z.object({
  label: z.string().describe("Visible label naming the group. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  options: optionList,
  value: bindable(z.array(z.string()))
    .optional()
    .describe('Option values that start checked, or a binding {"$bind": name}.'),
  description: z.string().optional().describe("Help text shown under the group."),
});

function stringValues(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

export function CheckboxGroupFacade({
  label,
  name,
  options,
  value,
  description,
}: CatalogProps<typeof checkboxGroupProps>) {
  const choices = normalizeOptions(options);
  const { key, field } = useControl<string[]>(
    name,
    label,
    stringValues(value) ?? [],
    value,
    choices,
  );
  const hint = asText(description);
  return (
    <CheckboxGroup
      data-slot="checkbox-group"
      name={key}
      value={stringValues(field.value) ?? []}
      onChange={field.setValue}
    >
      <Legend>{asText(label)}</Legend>
      {hint === "" ? null : <Description>{hint}</Description>}
      {choices.map((option) => (
        <Checkbox key={option.value} value={option.value}>
          {option.label}
        </Checkbox>
      ))}
    </CheckboxGroup>
  );
}

const checkboxProps = z.object({
  label: z.string().describe("Visible text next to the checkbox. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  checked: bindable(z.boolean())
    .optional()
    .describe('Starts checked, or a binding {"$bind": name} the checkbox reads and writes.'),
  required: z.boolean().optional().describe("Must be checked to submit."),
});

export function CheckboxFacade({
  label,
  name,
  checked,
  required,
}: CatalogProps<typeof checkboxProps>) {
  const { key, field } = useControl<boolean>(name, label, asBoolean(checked) ?? false, checked);
  return (
    <Checkbox
      data-slot="checkbox"
      name={key}
      checked={field.value === true}
      onChange={field.setValue}
      inputProps={{ required: required === true }}
    >
      {asText(label)}
    </Checkbox>
  );
}

const switchProps = z.object({
  label: z.string().describe("Visible text next to the switch, naming the setting. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  checked: bindable(z.boolean())
    .optional()
    .describe('Starts on, or a binding {"$bind": name} the switch reads and writes.'),
});

export function SwitchFacade({ label, name, checked }: CatalogProps<typeof switchProps>) {
  const { key, field } = useControl<boolean>(name, label, asBoolean(checked) ?? false, checked);
  return (
    <Switch data-slot="switch" name={key} checked={field.value === true} onChange={field.setValue}>
      {asText(label)}
    </Switch>
  );
}

const sliderProps = z.object({
  label: z.string().describe("Visible label naming the setting. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  min: z.number().optional().describe("Lowest value; 0 by default."),
  max: z.number().optional().describe("Highest value; 100 by default."),
  value: bindable(z.number())
    .optional()
    .describe(
      'Initial value, or a binding {"$bind": name} the slider reads and writes; min by default.',
    ),
  step: z.number().optional().describe("Amount one step changes the value; 1 by default."),
});

export function SliderFacade({
  label,
  name,
  min,
  max,
  value,
  step,
}: CatalogProps<typeof sliderProps>) {
  const id = useId();
  const low = asNumber(min) ?? 0;
  const high = Math.max(low, asNumber(max) ?? 100);
  const initial = Math.min(high, Math.max(low, asNumber(value) ?? low));
  const { key, field } = useControl<number>(name, label, initial, value);
  const current = asNumber(field.value) ?? initial;
  return (
    <div data-slot="slider">
      <Label htmlFor={id}>{asText(label)}</Label>
      <Slider
        id={id}
        name={key}
        min={low}
        max={high}
        step={asNumber(step)}
        value={current}
        onChange={field.setValue}
      />
      <span data-slot="slider-value" aria-hidden="true">
        {current}
      </span>
    </div>
  );
}

const datePickerProps = z.object({
  label: z.string().describe("Visible label naming the date. Required."),
  name: z.string().describe("Identifier of the field, unique in its form."),
  value: bindable(z.string())
    .optional()
    .describe('Initial date as "YYYY-MM-DD", or a binding {"$bind": name}.'),
  required: z.boolean().optional().describe("The person must pick a date."),
  description: z.string().optional().describe("Help text shown under the field."),
});

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function DatePickerFacade({
  label,
  name,
  value,
  required,
  description,
}: CatalogProps<typeof datePickerProps>) {
  const initial = typeof value === "string" && isoDate.test(value) ? value : undefined;
  const { key, field } = useControl<string>(name, label, initial, value);
  const hint = asText(description);
  return (
    <DatePicker
      as="div"
      name={key}
      value={asText(field.value)}
      onChange={field.setValue}
      required={required === true}
    >
      <Label>{asText(label)}</Label>
      <DateField />
      <DatePickerTrigger>Choose date</DatePickerTrigger>
      <DatePickerPopover>
        <Calendar>
          <CalendarPreviousButton />
          <CalendarHeader />
          <CalendarNextButton />
          <CalendarGrid />
        </Calendar>
      </DatePickerPopover>
      {hint === "" ? null : <Description>{hint}</Description>}
    </DatePicker>
  );
}

const labelledField =
  "A form control. Always give it a visible label; it names the control for everyone.";

export const formEntries = [
  defineEntry({
    name: "Form",
    group: "Forms",
    description:
      "Groups form controls and a submit button. When the person submits, the assistant receives their answers, described with the controls' labels. Requires name, title, and children; put controls (TextField, Select, ...) inside, and a Button inside only for secondary actions.",
    props: formProps,
    component: FormFacade,
  }),
  defineEntry({
    name: "TextField",
    group: "Forms",
    description: `A single-line text input (name, email, phone, URL). ${labelledField} Requires label and name.`,
    props: textFieldProps,
    component: TextFieldFacade,
  }),
  defineEntry({
    name: "TextArea",
    group: "Forms",
    description: `A multi-line text input for longer answers. ${labelledField} Requires label and name.`,
    props: textAreaProps,
    component: TextAreaFacade,
  }),
  defineEntry({
    name: "NumberField",
    group: "Forms",
    description: `A numeric input with increase and decrease buttons, for quantities and amounts. ${labelledField} Requires label and name; add min and max when there are limits.`,
    props: numberFieldProps,
    component: NumberFieldFacade,
  }),
  defineEntry({
    name: "Select",
    group: "Forms",
    description: `A drop-down for choosing one of many options (more than five). ${labelledField} Requires label, name, and options.`,
    props: selectProps,
    component: SelectFacade,
  }),
  defineEntry({
    name: "RadioGroup",
    group: "Forms",
    description: `Choose exactly one of a few visible options (five or fewer). ${labelledField} Requires label, name, and options.`,
    props: radioGroupProps,
    component: RadioGroupFacade,
  }),
  defineEntry({
    name: "CheckboxGroup",
    group: "Forms",
    description: `Choose any number of a few visible options. ${labelledField} Requires label, name, and options; the value is the list of checked option values.`,
    props: checkboxGroupProps,
    component: CheckboxGroupFacade,
  }),
  defineEntry({
    name: "Checkbox",
    group: "Forms",
    description:
      "A single yes/no choice such as accepting terms. The label is the visible text next to the box. Requires label and name.",
    props: checkboxProps,
    component: CheckboxFacade,
  }),
  defineEntry({
    name: "Switch",
    group: "Forms",
    description:
      "An on/off setting that applies right away, such as notifications. The label names the setting. Requires label and name.",
    props: switchProps,
    component: SwitchFacade,
  }),
  defineEntry({
    name: "Slider",
    group: "Forms",
    description: `A number chosen along a range, when the exact value matters less than the rough amount. ${labelledField} Requires label and name; min is 0 and max is 100 unless given.`,
    props: sliderProps,
    component: SliderFacade,
  }),
  defineEntry({
    name: "DatePicker",
    group: "Forms",
    description: `A calendar date. The value is "YYYY-MM-DD". ${labelledField} Requires label and name.`,
    props: datePickerProps,
    component: DatePickerFacade,
  }),
];
