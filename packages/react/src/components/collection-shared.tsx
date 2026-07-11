import { createContext, type HTMLAttributes, type ReactNode } from "react";
export type CollectionProps<TItem> = {
  items?: Iterable<TItem> | undefined;
  children: ReactNode | ((item: TItem) => ReactNode);
};

export interface SelectableCollectionContextValue {
  activeKey: string;
  selectedKey: string;
  setActiveKey: (key: string) => void;
  setSelectedKey: (key: string) => void;
  close?: (() => void) | undefined;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
}

export interface CollectionItemRecord {
  key: string;
  id?: string | undefined;
  textValue: string;
  disabled?: boolean | undefined;
  element: HTMLElement | null;
}

export const ListBoxContext = createContext<SelectableCollectionContextValue | null>(null);
export const MenuContext = createContext<SelectableCollectionContextValue | null>(null);

export function sortItems<TItem extends { element: HTMLElement | null }>(items: TItem[]) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
  });
}

export type ListBoxProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
  orientation?: "vertical" | "horizontal" | undefined;
};

export type ListBoxItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
};

export type MenuProps = HTMLAttributes<HTMLDivElement>;

export type MenuItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
};

export type MenuSectionProps = HTMLAttributes<HTMLDivElement>;

export type ListBoxSectionProps = HTMLAttributes<HTMLDivElement>;
