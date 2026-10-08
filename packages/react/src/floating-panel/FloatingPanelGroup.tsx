import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useCollection, useComposedRefs, type CollectionItem } from "@comp0/core";
import { type RootProps, rootElement } from "../internal/polymorphic.js";
import {
  FloatingPanelGroupContext,
  type FloatingPanelGroupContextValue,
} from "./floating-panel-shared.js";

type FloatingPanelRegistration = Parameters<FloatingPanelGroupContextValue["register"]>[1];

/** A registered panel: its surface is the collection element, so panels read back in document order. */
type FloatingPanelItem = CollectionItem & { open: boolean; trigger: HTMLElement | null };

function panelFocusTarget(surface: HTMLElement) {
  return surface.querySelector<HTMLElement>("[autofocus]") ?? surface;
}

export type FloatingPanelGroupProps = RootProps<{
  children?: ReactNode | undefined;
}>;

export function FloatingPanelGroup({
  as,
  children,
  ref,
  style,
  ...props
}: FloatingPanelGroupProps) {
  const panels = useCollection<FloatingPanelItem>();
  const lastFocused = useRef(new Map<string, HTMLElement>());
  const applicationFocus = useRef<HTMLElement | null>(null);
  const boundaryRef = useRef<HTMLElement | null>(null);
  const composedRef = useComposedRefs(boundaryRef, ref);
  const [stack, setStack] = useState<readonly string[]>([]);
  const bounded = as !== undefined && as !== Fragment;

  // Registration effects depend on these functions, so their identity must stay stable.
  const register = useCallback(
    (id: string, registration: FloatingPanelRegistration) => {
      panels.register({
        key: id,
        textValue: "",
        element: registration.surface,
        open: registration.open,
        trigger: registration.trigger,
      });
      setStack((current) => {
        const withoutPanel = current.filter((candidate) => candidate !== id);
        if (!registration.open) return withoutPanel;
        return [...withoutPanel, id];
      });
    },
    [panels],
  );
  // Same effect-dependency constraint as register: unregister runs from effect cleanups.
  const unregister = useCallback(
    (id: string) => {
      panels.unregister(id);
      lastFocused.current.delete(id);
      setStack((current) => current.filter((candidate) => candidate !== id));
    },
    [panels],
  );
  // The F6 listener effect depends on activate, so it must not change identity per render.
  const activate = useCallback(
    (id: string, focused?: HTMLElement | null) => {
      if (!panels.get(id)?.open) return;
      if (focused) lastFocused.current.set(id, focused);
      setStack((current) => {
        if (current.at(-1) === id) return current;
        return [...current.filter((candidate) => candidate !== id), id];
      });
    },
    [panels],
  );

  useEffect(() => {
    const ownerDocument = document;
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const insidePanel = panels
        .items()
        .some((panel) => panel.element?.contains(event.target as Node));
      if (!insidePanel) applicationFocus.current = event.target;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "F6" || event.altKey || event.ctrlKey || event.metaKey) return;
      const openPanels = panels.items().filter((panel) => panel.open && panel.element?.isConnected);
      if (openPanels.length === 0) return;
      const activeElement = ownerDocument.activeElement;
      const currentIndex = openPanels.findIndex((panel) =>
        activeElement ? panel.element?.contains(activeElement) : false,
      );
      let nextIndex = event.shiftKey ? openPanels.length - 1 : 0;
      if (currentIndex >= 0) nextIndex = currentIndex + (event.shiftKey ? -1 : 1);
      event.preventDefault();
      if (nextIndex < 0 || nextIndex >= openPanels.length) {
        const fallback = openPanels[currentIndex]?.trigger;
        if (applicationFocus.current?.isConnected) applicationFocus.current.focus();
        else fallback?.focus();
        return;
      }
      const panel = openPanels[nextIndex]!;
      const target = lastFocused.current.get(panel.key);
      if (target?.isConnected && panel.element?.contains(target)) target.focus();
      else if (panel.element) panelFocusTarget(panel.element).focus();
      activate(panel.key, ownerDocument.activeElement as HTMLElement | null);
    };
    ownerDocument.addEventListener("focusin", onFocusIn);
    ownerDocument.addEventListener("keydown", onKeyDown);
    return () => {
      ownerDocument.removeEventListener("focusin", onFocusIn);
      ownerDocument.removeEventListener("keydown", onKeyDown);
    };
  }, [activate, panels]);

  const Root = rootElement(as);
  return (
    <FloatingPanelGroupContext
      value={{
        activeId: stack.at(-1),
        boundary: bounded ? boundaryRef : undefined,
        stack,
        activate,
        register,
        unregister,
      }}
    >
      <Root
        data-slot="floating-panel-group"
        {...props}
        ref={composedRef}
        style={bounded ? { ...style, position: style?.position ?? "relative" } : style}
      >
        {children}
      </Root>
    </FloatingPanelGroupContext>
  );
}
