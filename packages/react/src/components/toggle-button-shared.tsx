import { createContext } from "react";

/** A single group's value is one string; a multiple group's value is a list. */
export type ToggleButtonGroupValue = string | string[];

export type ToggleButtonGroupContextValue = {
  type: "single" | "multiple";
  isSelected: (value: string) => boolean;
  toggle: (value: string) => void;
};

/** Non-null only while the surrounding ToggleButtonGroup manages selection. */
export const ToggleButtonGroupContext = createContext<ToggleButtonGroupContextValue | null>(null);
