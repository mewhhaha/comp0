import { type RefObject } from "react";
import { createRequiredContext } from "../internal/context.js";
import { type TagPickerState } from "./TagPicker.js";

export type TagPickerContextValue = TagPickerState & {
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  addOption: (value: string, label: string) => void;
  registerOptionLabel: (value: string, label: string) => void;
};

export const [TagPickerContext, useTagPickerContext] =
  createRequiredContext<TagPickerContextValue>("TagPicker");
