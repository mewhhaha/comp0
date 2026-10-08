import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";
import { type PopoverContextValue } from "../internal/overlay/index.js";

export type SelectContextValue = {
  disabled: boolean;
  selectedKey: string;
  triggerId: string;
  listBoxId: string;
  labelId: string;
  descriptionId: string;
  /** The label of the selected option, once known (before options mount it comes from the children walk). */
  selectedText: string | undefined;
  /** Every mounted option, readable while the listbox is closed so the trigger can type ahead. */
  collection: Collection;
  popover: PopoverContextValue;
  setSelectedKey: (key: string) => void;
};

export const [SelectContext, useSelectContext, useOptionalSelectContext] =
  createRequiredContext<SelectContextValue>("Select");
