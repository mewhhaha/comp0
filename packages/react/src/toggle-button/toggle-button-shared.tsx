import { createRequiredContext } from "../internal/context.js";

/** A single group's value is one string; a multiple group's value is a list. */
export type ToggleButtonGroupValue = string | string[];

export type ToggleButtonGroupContextValue = {
  type: "single" | "multiple";
  isSelected: (value: string) => boolean;
  toggle: (value: string) => void;
};

// A ToggleButton also works on its own; the group provides null while it manages no selection.
export const [ToggleButtonGroupContext, , useToggleButtonGroupContext] =
  createRequiredContext<ToggleButtonGroupContextValue>("ToggleButtonGroup");
