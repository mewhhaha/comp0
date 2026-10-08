import { type RefObject } from "react";
import { type ControllableStateControls } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type NumberFieldContextValue = {
  controlId: string;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  max: number | undefined;
  min: number | undefined;
  name: string | undefined;
  required: boolean;
  step: number | undefined;
  value: number;
  announceValue: (value: string) => void;
  setValue: (value: number) => void;
  valueState: ControllableStateControls<number>;
};

export const [NumberFieldContext, useNumberFieldContext] =
  createRequiredContext<NumberFieldContextValue>("NumberField");
