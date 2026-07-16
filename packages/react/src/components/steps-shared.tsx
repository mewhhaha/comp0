import {
  createContext,
  Fragment,
  useContext,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
} from "react";
import { type CollectionNode } from "@comp0/core";
import { type StateChildren, type StateClassName } from "../shared.js";

export interface StepsContextValue {
  baseId: string;
  currentValue: string;
  /** Registered item values in document order. */
  order: string[];
  setCurrentValue: (value: string) => void;
  /** Adds an item to the document-order collection; returns its unregister. */
  registerItem: (node: CollectionNode<string>) => () => void;
}

export const StepsContext = createContext<StepsContextValue | null>(null);

export function useStepsContext(part: string) {
  const context = useContext(StepsContext);
  if (!context) throw new Error(`${part} must be rendered inside Steps.`);
  return context;
}

export interface StepsItemContextValue {
  value: string;
  current: boolean;
  completed: boolean;
}

export const StepsItemContext = createContext<StepsItemContextValue | null>(null);

export const stepsPairIds = (baseId: string, value: string) => ({
  itemId: `${baseId}-item-${value}`,
  panelId: `${baseId}-panel-${value}`,
});

export type StepsProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next step value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
};

export type StepsListProps = OlHTMLAttributes<HTMLOListElement>;

export type StepsItemState = {
  /** 1-based position in document order; 0 until the item has registered. */
  step: number;
  current: boolean;
  completed: boolean;
};

export type StepsItemProps = Omit<
  LiHTMLAttributes<HTMLLIElement>,
  "id" | "children" | "className"
> & {
  /** Identity that pairs this item with its panel through the root's value. */
  value: string;
  children?: StateChildren<StepsItemState>;
  className?: StateClassName<StepsItemState>;
};

export type StepsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: ElementType | typeof Fragment | undefined;
};

export type StepsPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  /** Identity that pairs this panel with its item through the root's value. */
  value: string;
  role?: "region" | "group" | undefined;
};
