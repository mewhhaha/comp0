import { createContext, type HTMLAttributes, type ReactNode } from "react";

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
  /** Overrides the text crawled from children for typeahead and display. */
  textValue?: string | undefined;
};

export type ListBoxSectionProps = HTMLAttributes<HTMLDivElement>;

/**
 * The text a collection item is known by: an explicit textValue, plain string
 * children, the rendered element's text, an aria-label, then the value.
 */
export function resolveItemLabel(options: {
  textValue: string | undefined;
  children: ReactNode;
  element: HTMLElement | null | undefined;
  ariaLabel: string | undefined;
  fallback: string;
}) {
  if (options.textValue) return options.textValue;
  if (typeof options.children === "string") return options.children;
  const crawled = options.element?.textContent?.replace(/\s+/g, " ").trim();
  if (crawled) return crawled;
  return options.ariaLabel ?? options.fallback;
}
