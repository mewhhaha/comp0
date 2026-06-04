import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export interface MenubarItemRecord {
  key: string;
  textValue: string;
  element: HTMLButtonElement | null;
  disabled?: boolean | undefined;
  hasPopup?: boolean | undefined;
}

export interface MenubarContextValue {
  activeKey: string;
  openKey: string;
  orientation: "horizontal" | "vertical";
  setActiveKey: (key: string) => void;
  setOpenKey: (key: string) => void;
  close: () => void;
  registerItem: (item: MenubarItemRecord) => void;
  unregisterItem: (key: string) => void;
  items: () => MenubarItemRecord[];
  focusItem: (key: string) => void;
  focusTrigger: (key: string) => void;
}

export const MenubarContext = createContext<MenubarContextValue | null>(null);

export type MenubarProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
  loop?: boolean | undefined;
};

export type MenubarItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id"> & {
  id: string;
  disabled?: boolean | undefined;
  textValue?: string | undefined;
};

export type MenubarMenuProps = {
  id: string;
  children?: ReactNode;
};

export interface MenubarMenuContextValue {
  id: string;
  triggerId: string;
  contentId: string;
}

export const MenubarMenuContext = createContext<MenubarMenuContextValue | null>(null);

export type MenubarTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id"> & {
  id?: string | undefined;
  disabled?: boolean | undefined;
  textValue?: string | undefined;
};

export type MenubarContentProps = HTMLAttributes<HTMLDivElement>;

export function sortMenubarItems(items: MenubarItemRecord[]) {
  return [...items].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return -1;
  });
}
