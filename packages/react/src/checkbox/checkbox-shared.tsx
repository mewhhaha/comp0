import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

/** A group member: keyed by the checkbox value, backed by its native input. */
export type CheckboxGroupItem = CollectionItem & { element: HTMLInputElement | null };

export type CheckboxGroupContextValue = {
  name?: string | undefined;
  form?: string | undefined;
  value: string[];
  disabled?: boolean | undefined;
  /** The group's checkboxes in document order. */
  collection: Collection<CheckboxGroupItem>;
  onChange: (value: string, checked: boolean) => void;
};

// A Checkbox also works on its own, so it reads the group optionally.
export const [CheckboxGroupContext, , useCheckboxGroupContext] =
  createRequiredContext<CheckboxGroupContextValue>("CheckboxGroup");
