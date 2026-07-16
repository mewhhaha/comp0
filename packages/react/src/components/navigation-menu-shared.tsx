import { createContext } from "react";

export type NavigationMenuContextValue = {
  value: string;
  open: (value: string) => void;
  close: () => void;
  scheduleOpen: (value: string) => void;
  cancelOpen: () => void;
  registerTrigger: (value: string, element: HTMLElement | null) => void;
};

export const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null);

export type NavigationMenuItemContextValue = {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
};

export const NavigationMenuItemContext = createContext<NavigationMenuItemContextValue | null>(null);
