import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  FloatingPanelGroupContext,
  type FloatingPanelGroupContextValue,
} from "./floating-panel-shared.js";

type FloatingPanelRegistration = Parameters<FloatingPanelGroupContextValue["register"]>[1];

export type FloatingPanelGroupProps = {
  children?: ReactNode | undefined;
};

function panelFocusTarget(surface: HTMLElement) {
  return surface.querySelector<HTMLElement>("[autofocus]") ?? surface;
}

export function FloatingPanelGroup({ children }: FloatingPanelGroupProps) {
  const registrations = useRef(new Map<string, FloatingPanelRegistration>());
  const applicationFocus = useRef<HTMLElement | null>(null);
  const [stack, setStack] = useState<readonly string[]>([]);

  // Registration effects depend on these functions, so their identity must stay stable.
  const register = useCallback((id: string, registration: FloatingPanelRegistration) => {
    const previous = registrations.current.get(id);
    registrations.current.set(id, {
      ...registration,
      lastFocused: previous?.lastFocused ?? registration.lastFocused,
    });
    setStack((current) => {
      const withoutPanel = current.filter((candidate) => candidate !== id);
      if (!registration.open) return withoutPanel;
      return [...withoutPanel, id];
    });
  }, []);
  const unregister = useCallback((id: string) => {
    registrations.current.delete(id);
    setStack((current) => current.filter((candidate) => candidate !== id));
  }, []);
  const activate = useCallback((id: string, focused?: HTMLElement | null) => {
    const registration = registrations.current.get(id);
    if (!registration?.open) return;
    if (focused) registration.lastFocused = focused;
    setStack((current) => {
      if (current.at(-1) === id) return current;
      return [...current.filter((candidate) => candidate !== id), id];
    });
  }, []);

  useEffect(() => {
    const ownerDocument = document;
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const insidePanel = Array.from(registrations.current.values()).some((registration) =>
        registration.surface?.contains(event.target as Node),
      );
      if (!insidePanel) applicationFocus.current = event.target;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F6" || event.altKey || event.ctrlKey || event.metaKey) return;
      const openPanels = Array.from(registrations.current.entries()).filter(
        ([, registration]) => registration.open && registration.surface?.isConnected,
      );
      if (openPanels.length === 0) return;
      const activeElement = ownerDocument.activeElement;
      const currentIndex = openPanels.findIndex(([, registration]) =>
        activeElement ? registration.surface?.contains(activeElement) : false,
      );
      let nextIndex = event.shiftKey ? openPanels.length - 1 : 0;
      if (currentIndex >= 0) nextIndex = currentIndex + (event.shiftKey ? -1 : 1);
      event.preventDefault();
      if (nextIndex < 0 || nextIndex >= openPanels.length) {
        const fallback = openPanels[currentIndex]?.[1].trigger;
        if (applicationFocus.current?.isConnected) applicationFocus.current.focus();
        else fallback?.focus();
        return;
      }
      const [id, registration] = openPanels[nextIndex]!;
      const target = registration.lastFocused;
      if (target?.isConnected && registration.surface?.contains(target)) target.focus();
      else if (registration.surface) panelFocusTarget(registration.surface).focus();
      activate(id, ownerDocument.activeElement as HTMLElement | null);
    };
    ownerDocument.addEventListener("focusin", onFocusIn);
    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      ownerDocument.removeEventListener("focusin", onFocusIn);
      ownerDocument.removeEventListener("keydown", onKeyDown);
    };
  }, [activate]);

  return (
    <FloatingPanelGroupContext
      value={{ activeId: stack.at(-1), stack, activate, register, unregister }}
    >
      {children}
    </FloatingPanelGroupContext>
  );
}
