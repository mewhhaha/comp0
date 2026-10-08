import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type StepsContextValue = {
  baseId: string;
  currentValue: string;
  /** Registered item values in document order. */
  order: string[];
  setCurrentValue: (value: string) => void;
  /** The document-order registry every StepsItem joins. */
  collection: Collection;
};

export const [StepsContext, useStepsContext] = createRequiredContext<StepsContextValue>("Steps");

export type StepsItemContextValue = {
  value: string;
  current: boolean;
  completed: boolean;
};

export const [StepsItemContext, useStepsItemContext] =
  createRequiredContext<StepsItemContextValue>("StepsItem");

export const stepsPairIds = (baseId: string, value: string) => ({
  itemId: `${baseId}-item-${value}`,
  panelId: `${baseId}-panel-${value}`,
});
