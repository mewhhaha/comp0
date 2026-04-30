import { type RefProp } from "./shared.js";
import {
  createContext,
  useState,
  useContext,
  useId,
  useRef,
  type CSSProperties,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState, useIsoLayoutEffect } from "@comp0/core";
import { describedBy, FieldProvider, useFieldIds } from "./field.js";

const visuallyHiddenInputStyle: CSSProperties = {
  border: 0,
  clipPath: "inset(50%)",
  height: 1,
  margin: 0,
  opacity: 0,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

interface CheckboxGroupContextValue {
  name?: string | undefined;
  value: string[];
  disabled?: boolean | undefined;
  onChange: (value: string, selected: boolean) => void;
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export type CheckboxGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: (value: string[]) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function CheckboxGroup({
  children,
  id,
  value,
  defaultValue = [],
  onChange,
  invalid,
  required,
  name,
  ref,
  ...props
}: CheckboxGroupProps & RefProp<HTMLFieldSetElement>) {
  const ids = useFieldIds(id);
  const [selectedValues, setSelectedValues] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const disabled = Boolean(props.disabled);
  const resolvedInvalid = Boolean(invalid);
  const resolvedRequired = Boolean(required);

  return (
    <FieldProvider
      value={{ ...ids, disabled, invalid: resolvedInvalid, required: resolvedRequired }}
    >
      <CheckboxGroupContext.Provider
        value={{
          name,
          value: selectedValues,
          disabled,
          onChange(nextValue, selected) {
            setSelectedValues((current) => {
              if (selected) return [...new Set([...current, nextValue])];
              return current.filter((item) => item !== nextValue);
            });
          },
        }}
      >
        <fieldset
          {...props}
          ref={ref}
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={describedBy({ ...ids, invalid: resolvedInvalid })}
          aria-invalid={resolvedInvalid || undefined}
          data-disabled={dataAttr(disabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          {children}
        </fieldset>
      </CheckboxGroupContext.Provider>
    </FieldProvider>
  );
}

export type CheckboxProps = Omit<
  LabelHTMLAttributes<HTMLLabelElement>,
  "onChange" | "children" | "defaultChecked"
> & {
  name?: string | undefined;
  value?: string | undefined;
  selected?: boolean | undefined;
  defaultSelected?: boolean | undefined;
  indeterminate?: boolean | undefined;
  disabled?: boolean | undefined;
  onChange?: (selected: boolean) => void;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "defaultChecked" | "disabled"
  >;
  children?: ReactNode | ((state: ChoiceState) => ReactNode);
};

export interface ChoiceState {
  selected: boolean;
  disabled: boolean;
  indeterminate: boolean;
  focused: boolean;
}

export function Checkbox({
  children,
  name,
  value = "on",
  selected: selectedProp,
  defaultSelected = false,
  indeterminate,
  disabled: disabledProp,
  onChange,
  inputProps,
  ref,
  ...props
}: CheckboxProps & RefProp<HTMLLabelElement>) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const group = useContext(CheckboxGroupContext);
  const selectedFromGroup = group ? group.value.includes(value) : undefined;
  const [selected, setSelected] = useControllableState({
    value: selectedProp ?? selectedFromGroup,
    defaultValue: defaultSelected,
    onChange,
  });
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const resolvedIndeterminate = Boolean(indeterminate);
  const [focused, setFocused] = useState(false);
  const state: ChoiceState = {
    selected,
    disabled,
    indeterminate: resolvedIndeterminate,
    focused,
  };

  useIsoLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = resolvedIndeterminate;
  }, [resolvedIndeterminate]);

  return (
    <label
      {...props}
      ref={ref}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(focused)}
      data-indeterminate={dataAttr(resolvedIndeterminate)}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="checkbox"
        name={name ?? group?.name}
        value={value}
        checked={selected}
        disabled={disabled}
        aria-checked={resolvedIndeterminate ? "mixed" : selected}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          setFocused(false);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (event.defaultPrevented) return;
          setSelected(event.currentTarget.checked);
          group?.onChange(value, event.currentTarget.checked);
        }}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          setFocused(true);
        }}
      />
      {typeof children === "function" ? children(state) : children}
    </label>
  );
}

interface RadioGroupContextValue {
  name: string;
  value: string;
  disabled?: boolean | undefined;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "value" | "defaultValue" | "onChange"
> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
};

export function RadioGroup({
  children,
  id,
  value,
  defaultValue = "",
  onChange,
  invalid,
  required,
  name,
  ref,
  ...props
}: RadioGroupProps & RefProp<HTMLFieldSetElement>) {
  const generatedName = useId();
  const ids = useFieldIds(id);
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const disabled = Boolean(props.disabled);
  const resolvedInvalid = Boolean(invalid);
  const resolvedRequired = Boolean(required);

  return (
    <FieldProvider
      value={{ ...ids, disabled, invalid: resolvedInvalid, required: resolvedRequired }}
    >
      <RadioGroupContext.Provider
        value={{ name: name ?? generatedName, value: selected, disabled, onChange: setSelected }}
      >
        <fieldset
          {...props}
          ref={ref}
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={describedBy({ ...ids, invalid: resolvedInvalid })}
          aria-invalid={resolvedInvalid || undefined}
          data-disabled={dataAttr(disabled)}
          data-invalid={dataAttr(resolvedInvalid)}
          data-required={dataAttr(resolvedRequired)}
        >
          {children}
        </fieldset>
      </RadioGroupContext.Provider>
    </FieldProvider>
  );
}

export type RadioProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "onChange" | "children"> & {
  value: string;
  disabled?: boolean | undefined;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "disabled" | "name" | "value"
  >;
  children?: ReactNode | ((state: Omit<ChoiceState, "indeterminate">) => ReactNode);
};

export function Radio({
  children,
  value,
  disabled: disabledProp,
  inputProps,
  ref,
  ...props
}: RadioProps & RefProp<HTMLLabelElement>) {
  const id = useId();
  const group = useContext(RadioGroupContext);
  const selected = group?.value === value;
  const disabled = Boolean(disabledProp ?? group?.disabled);
  const [focused, setFocused] = useState(false);
  const state = { selected, disabled, focused };

  return (
    <label
      {...props}
      ref={ref}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(disabled)}
      data-focused={dataAttr(focused)}
    >
      <input
        {...inputProps}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="radio"
        name={group?.name}
        value={value}
        checked={selected}
        disabled={disabled}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          setFocused(false);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (!event.defaultPrevented && event.currentTarget.checked) group?.onChange(value);
        }}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          setFocused(true);
        }}
      />
      {typeof children === "function" ? children(state) : children}
    </label>
  );
}

export type SwitchProps = CheckboxProps;

export function Switch(props: SwitchProps & RefProp<HTMLLabelElement>) {
  const { ref } = props;
  return (
    <Checkbox
      {...props}
      ref={ref}
      inputProps={{ ...props.inputProps, role: "switch" }}
      data-switch=""
    />
  );
}
