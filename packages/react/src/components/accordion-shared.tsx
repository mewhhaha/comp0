import {
  createContext,
  Fragment,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type AccordionValue = string | string[];

type AccordionBaseProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
};

type SingleAccordionProps = {
  type?: "single" | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the next expanded item value rather than a DOM ChangeEvent. */
  onChange?: ((value: string) => void) | undefined;
  collapsible?: boolean | undefined;
};

type MultipleAccordionProps = {
  type: "multiple";
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  collapsible?: never;
};

export type AccordionProps = AccordionBaseProps & (SingleAccordionProps | MultipleAccordionProps);

export interface AccordionTriggerRecord {
  key: string;
  element: HTMLButtonElement | null;
  disabled?: boolean | undefined;
}

export interface AccordionContextValue {
  type: "single" | "multiple";
  selectedKeys: Set<string>;
  collapsible: boolean;
  setItemOpen: (key: string, open: boolean) => void;
  registerTrigger: (key: string, element: HTMLButtonElement | null, disabled?: boolean) => void;
  triggers: () => AccordionTriggerRecord[];
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);

export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  disabled?: boolean | undefined;
};

export interface AccordionItemContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  panelId: string;
}

export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

export type AccordionHeaderProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
};

export type AccordionTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id">;

export type AccordionPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  role?: "region" | "group" | undefined;
  children?: ReactNode;
};
