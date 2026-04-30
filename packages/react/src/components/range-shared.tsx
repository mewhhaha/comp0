import {
  type HTMLAttributes,
  type InputHTMLAttributes,
  type MeterHTMLAttributes,
  type ReactNode,
} from "react";
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

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: number | undefined;
  defaultValue?: number | undefined;
  onChange?: (value: number) => void;
  disabled?: boolean | undefined;
};

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value?: number | undefined;
  minValue?: number | undefined;
  maxValue?: number | undefined;
  children?:
    | ReactNode
    | ((state: { value: number | undefined; percentage: number | undefined }) => ReactNode);
};

export type MeterProps = MeterHTMLAttributes<HTMLMeterElement> & {
  value: number;
};
