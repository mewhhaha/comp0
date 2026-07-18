import { createContext, useContext, type PointerEvent, type RefObject } from "react";

export type FloatingPanelPosition = {
  x: number;
  y: number;
};

export type FloatingPanelSize = {
  width: number;
  height: number;
};

type FloatingPanelRegistration = {
  open: boolean;
  surface: HTMLElement | null;
  trigger: HTMLElement | null;
  lastFocused: HTMLElement | null;
};

export type FloatingPanelGroupContextValue = {
  activeId: string | undefined;
  stack: readonly string[];
  activate: (id: string, focused?: HTMLElement | null) => void;
  register: (id: string, registration: FloatingPanelRegistration) => void;
  unregister: (id: string) => void;
};

export type FloatingPanelContextValue = {
  active: boolean;
  announcement: string;
  contentId: string;
  moving: boolean;
  open: boolean;
  position: FloatingPanelPosition | null;
  resizing: boolean;
  size: FloatingPanelSize | null;
  surfaceRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  triggerId: string;
  activate: (focused?: HTMLElement | null) => void;
  cancelPointerMove: (event: PointerEvent<HTMLElement>) => void;
  continuePointerMove: (event: PointerEvent<HTMLElement>) => void;
  finishPointerMove: (event: PointerEvent<HTMLElement>) => void;
  getPosition: () => FloatingPanelPosition | undefined;
  measure: () => DOMRect | undefined;
  moveBy: (x: number, y: number) => void;
  requestClose: () => void;
  setMoving: (moving: boolean) => void;
  setOpen: (open: boolean) => void;
  setPosition: (position: FloatingPanelPosition) => void;
  setResizing: (resizing: boolean) => void;
  setSize: (size: FloatingPanelSize) => void;
  setSurfaceElement: (element: HTMLDivElement | null) => void;
  setTriggerElement: (element: HTMLElement | null) => void;
  startPointerMove: (
    event: PointerEvent<HTMLElement>,
    position?: FloatingPanelPosition | undefined,
  ) => void;
  stackIndex: number;
  announce: (message: string) => void;
};

export const FloatingPanelGroupContext = createContext<FloatingPanelGroupContextValue | null>(null);
export const FloatingPanelContext = createContext<FloatingPanelContextValue | null>(null);

export function useFloatingPanelGroupContext(component: string) {
  const context = useContext(FloatingPanelGroupContext);
  if (!context) throw new Error(`${component} must be rendered inside FloatingPanelGroup.`);
  return context;
}

export function useFloatingPanelContext(component: string) {
  const context = useContext(FloatingPanelContext);
  if (!context) throw new Error(`${component} must be rendered inside FloatingPanel.`);
  return context;
}
