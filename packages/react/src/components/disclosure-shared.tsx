import {
  createContext,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type DetailsHTMLAttributes,
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
  onChange?: (open: boolean) => void;
  children?: ReactNode;
};

export type DisclosureTriggerProps = HTMLAttributes<HTMLElement>;

export type DisclosurePanelProps = HTMLAttributes<HTMLDivElement>;

export interface TabsContextValue {
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  registerTab: (key: string, element: HTMLButtonElement | null, disabled?: boolean) => void;
  tabs: () => { key: string; disabled?: boolean | undefined; element: HTMLButtonElement | null }[];
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
};

export type TabListProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export type TabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  id?: string | undefined;
  tabKey: string;
};

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
  tabKey: string;
};

export type BreadcrumbsProps = HTMLAttributes<HTMLElement> & {
  "aria-label"?: string | undefined;
};

export type BreadcrumbLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  current?: boolean | undefined;
};
