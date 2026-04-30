import { type RefProp } from "./shared.js";
import {
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MeterHTMLAttributes,
  type ReactNode,
} from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { FieldProvider, useFieldIds } from "./field.js";
import { Input } from "./text-field.js";

export type NumberFieldProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  id?: string | undefined;
  name?: string | undefined;
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: (value: number) => void;
  disabled?: boolean | undefined;
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
};

export function NumberField({
  children,
  id,
  name,
  value,
  defaultValue = 0,
  onChange,
  disabled,
  invalid,
  required,
  min,
  max,
  step,
  ref,
  ...props
}: NumberFieldProps & RefProp<HTMLDivElement>) {
  const ids = useFieldIds(id);
  const [numberValue, setNumberValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);
  const resolvedInvalid = Boolean(invalid);
  const resolvedRequired = Boolean(required);

  return (
    <FieldProvider
      value={{
        ...ids,
        disabled: resolvedDisabled,
        invalid: resolvedInvalid,
        required: resolvedRequired,
      }}
    >
      <div
        {...props}
        ref={ref}
        data-disabled={dataAttr(resolvedDisabled)}
        data-invalid={dataAttr(resolvedInvalid)}
        data-required={dataAttr(resolvedRequired)}
      >
        {children ?? (
          <Input
            type="number"
            value={Number.isNaN(numberValue) ? "" : numberValue}
            name={name}
            min={min}
            max={max}
            step={step}
            disabled={resolvedDisabled}
            required={resolvedRequired}
            onChange={(event) => setNumberValue(event.currentTarget.valueAsNumber)}
          />
        )}
      </div>
    </FieldProvider>
  );
}

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: (value: number) => void;
  disabled?: boolean | undefined;
};

export function Slider({
  value,
  defaultValue = 0,
  onChange,
  disabled,
  min = 0,
  max = 100,
  step = 1,
  ref,
  ...props
}: SliderProps & RefProp<HTMLInputElement>) {
  const [sliderValue, setSliderValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  });
  const resolvedDisabled = Boolean(disabled);

  return (
    <input
      {...props}
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={sliderValue}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      data-orientation="horizontal"
      style={{ "--comp0-slider-value": `${sliderValue}` } as CSSProperties}
      onChange={(event) => setSliderValue(event.currentTarget.valueAsNumber)}
    />
  );
}

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value?: number | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  children?:
    | ReactNode
    | ((state: { value: number | undefined; percentage: number | undefined }) => ReactNode);
};

export function ProgressBar({
  value,
  minValue = 0,
  maxValue = 100,
  children,
  ref,
  ...props
}: ProgressBarProps & RefProp<HTMLDivElement>) {
  let percentage: number | undefined;
  if (value !== undefined) {
    percentage = Math.max(0, Math.min(100, ((value - minValue) / (maxValue - minValue)) * 100));
  }
  const state = { value, percentage };

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
      aria-valuenow={value}
      data-indeterminate={dataAttr(value === undefined)}
      style={
        {
          "--comp0-progress": percentage === undefined ? undefined : `${percentage}%`,
        } as CSSProperties
      }
    >
      {typeof children === "function" ? children(state) : children}
    </div>
  );
}

export type MeterProps = MeterHTMLAttributes<HTMLMeterElement> & {
  value: number;
};

export function Meter({
  value,
  min = 0,
  max = 1,
  ref,
  ...props
}: MeterProps & RefProp<HTMLMeterElement>) {
  return (
    <meter
      {...props}
      ref={ref}
      value={value}
      min={min}
      max={max}
      data-complete={dataAttr(value >= Number(max))}
    />
  );
}
