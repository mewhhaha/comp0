import {
  createContext,
  Fragment,
  useContext,
  type AnchorHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
} from "react";

export type MenuProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
};

export type MenuTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-expanded" | "aria-controls"
> & {
  as?: ElementType | typeof Fragment | undefined;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target">;

export type MenuPopoverProps = HTMLAttributes<HTMLDivElement>;

export type MenuItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** Overrides the text crawled from children for typeahead. */
  textValue?: string | undefined;
};

export type MenuSectionProps = HTMLAttributes<HTMLDivElement>;

export type MenuRootContextValue = {
  open: boolean;
  isSubmenu: boolean;
  triggerId: string;
  contentId: string;
  setOpen: (open: boolean) => void;
  focusTrigger: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
};

export const MenuRootContext = createContext<MenuRootContextValue | null>(null);

export function useMenuRootContext() {
  return useContext(MenuRootContext);
}
