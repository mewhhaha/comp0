import {
  createContext,
  Fragment,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type DetailsHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
export interface DisclosureContextValue {
  open: boolean;
  panelId: string;
}

export const DisclosureContext = createContext<DisclosureContextValue | null>(null);

export type DisclosureProps = Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  "open" | "onToggle" | "onChange" | "children"
> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; the native toggle event remains internal to details. */
  onChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type DisclosureTriggerProps = HTMLAttributes<HTMLElement>;

export type DisclosurePanelProps = HTMLAttributes<HTMLDivElement>;

export interface TabsContextValue {
  baseId: string;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  registerTab: (key: string, element: HTMLButtonElement | null, disabled?: boolean) => void;
  hasEnabledTab: (key: string) => boolean;
  tabs: () => { key: string; disabled?: boolean | undefined; element: HTMLButtonElement | null }[];
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export const tabPairIds = (context: TabsContextValue | null, tab: string) => {
  const prefix = context ? `${context.baseId}-` : "";
  return { tabId: `${prefix}tab-${tab}`, panelId: `${prefix}panel-${tab}` };
};

export type TabsProps = Omit<HTMLAttributes<HTMLElement>, "defaultValue" | "onChange"> & {
  as?: ElementType | typeof Fragment | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Receives the selected tab value rather than a DOM ChangeEvent. */
  onChange?: (value: string) => void;
};

export type TabListProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id" | "value"> & {
  tab: string;
};

export type TabPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  tab: string;
};

export type BreadcrumbsProps = HTMLAttributes<HTMLElement> & {
  "aria-label"?: string | undefined;
};

export type BreadcrumbLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  current?: boolean | undefined;
};
