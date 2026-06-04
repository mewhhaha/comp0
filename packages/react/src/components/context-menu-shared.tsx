import { createContext, type ButtonHTMLAttributes, type HTMLAttributes } from "react";

export interface ContextMenuContextValue {
  open: boolean;
  triggerId: string;
  contentId: string;
  x: number | undefined;
  y: number | undefined;
  setOpen: (open: boolean) => void;
  openAt: (x: number | undefined, y: number | undefined) => void;
  focusTrigger: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
}

export const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export type ContextMenuProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onChange?: ((open: boolean) => void) | undefined;
};

export type ContextMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export type ContextMenuContentProps = HTMLAttributes<HTMLDivElement>;
