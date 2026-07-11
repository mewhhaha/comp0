import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type OverlayRootProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
};

export type DialogProps = OverlayRootProps;
export type ModalProps = OverlayRootProps;
export type AlertDialogProps = OverlayRootProps;
export type PopoverProps = OverlayRootProps;
export type TooltipProps = OverlayRootProps;

export type OverlayTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target"> & {
    as?: ElementType | typeof Fragment | undefined;
  };

export type OverlayContentProps = HTMLAttributes<HTMLDivElement> & {
  as?: ElementType | undefined;
};

export type DialogContentProps = Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open"> & {
  portal?: boolean | undefined;
};

export type PopoverContentProps = Omit<OverlayContentProps, "popover"> & {
  anchor?: string | undefined;
  popover?: "auto" | "manual" | "none" | undefined;
};

export type ModalContentProps = Omit<React.DialogHTMLAttributes<HTMLDialogElement>, "open"> & {
  portal?: boolean | undefined;
};

export type OverlayContextValue = {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
  focusTrigger: () => void;
  setTriggerElement: (element: HTMLElement | null) => void;
};

export type PopoverContextValue = OverlayContextValue & {
  requestClose: () => void;
};

export const DialogContext = createContext<OverlayContextValue | null>(null);
export const ModalContext = createContext<OverlayContextValue | null>(null);
export const PopoverContext = createContext<PopoverContextValue | null>(null);
export const TooltipContext = createContext<OverlayContextValue | null>(null);

export function useDialogContext() {
  return useContext(DialogContext);
}

export function useModalContext() {
  return useContext(ModalContext);
}

export function usePopoverContext() {
  return useContext(PopoverContext);
}

type PopoverSurfaceElement = HTMLElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

type CoordinatedAutoPopover = {
  coordinator: AutoPopoverCoordinator;
  desiredOpen: () => boolean;
  element: PopoverSurfaceElement;
  opening: "prioritized" | "restoring" | null;
  pending: boolean;
  priority: number;
};

type AutoPopoverCoordinator = {
  document: Document;
  entries: Set<CoordinatedAutoPopover>;
  nextPriority: number;
  onToggle: () => void;
  timer: ReturnType<typeof setTimeout> | undefined;
};

const autoPopoverCoordinators = new WeakMap<Document, AutoPopoverCoordinator>();

function areNestedPopovers(first: HTMLElement, second: HTMLElement) {
  return first.contains(second) || second.contains(first);
}

function scheduleAutoPopoverFlush(coordinator: AutoPopoverCoordinator) {
  if (coordinator.timer !== undefined) return;
  coordinator.timer = setTimeout(() => {
    coordinator.timer = undefined;
    flushAutoPopoverCoordinator(coordinator);
  });
}

function flushAutoPopoverCoordinator(coordinator: AutoPopoverCoordinator) {
  const entriesByElement = new Map(
    Array.from(coordinator.entries, (entry) => [entry.element, entry] as const),
  );
  for (const entry of coordinator.entries) {
    if (!entry.element.isConnected || !entry.desiredOpen()) entry.pending = false;
    if (entry.element.matches(":popover-open")) entry.pending = false;
  }

  const candidates = Array.from(coordinator.entries)
    .filter(
      (entry) =>
        entry.pending &&
        entry.desiredOpen() &&
        entry.element.isConnected &&
        !entry.element.matches(":popover-open"),
    )
    .sort((first, second) => second.priority - first.priority);

  for (const candidate of candidates) {
    const openAutoPopovers = candidate.element.ownerDocument.querySelectorAll<HTMLElement>(
      '[popover="auto"]:popover-open',
    );
    let blocked = false;
    for (const openElement of openAutoPopovers) {
      if (openElement === candidate.element || areNestedPopovers(openElement, candidate.element))
        continue;
      const openEntry = entriesByElement.get(openElement);
      if (!openEntry || (openEntry.desiredOpen() && openEntry.priority > candidate.priority)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    candidate.opening = "restoring";
    candidate.pending = false;
    try {
      candidate.element.showPopover?.();
    } catch {
      candidate.opening = null;
      candidate.pending = candidate.desiredOpen();
      continue;
    }
    scheduleAutoPopoverFlush(coordinator);
    return;
  }
}

function getAutoPopoverCoordinator(document: Document) {
  const existing = autoPopoverCoordinators.get(document);
  if (existing) return existing;

  const coordinator: AutoPopoverCoordinator = {
    document,
    entries: new Set(),
    nextPriority: 0,
    onToggle() {
      scheduleAutoPopoverFlush(coordinator);
    },
    timer: undefined,
  };
  document.addEventListener("toggle", coordinator.onToggle, true);
  autoPopoverCoordinators.set(document, coordinator);
  return coordinator;
}

function registerAutoPopover(element: PopoverSurfaceElement, desiredOpen: () => boolean) {
  const coordinator = getAutoPopoverCoordinator(element.ownerDocument);
  const entry: CoordinatedAutoPopover = {
    coordinator,
    desiredOpen,
    element,
    opening: null,
    pending: false,
    priority: 0,
  };
  coordinator.entries.add(entry);
  return entry;
}

function unregisterAutoPopover(entry: CoordinatedAutoPopover) {
  const { coordinator } = entry;
  coordinator.entries.delete(entry);
  if (coordinator.entries.size) {
    scheduleAutoPopoverFlush(coordinator);
    return;
  }

  clearTimeout(coordinator.timer);
  coordinator.document.removeEventListener("toggle", coordinator.onToggle, true);
  autoPopoverCoordinators.delete(coordinator.document);
}

function prioritizeAutoPopover(entry: CoordinatedAutoPopover) {
  entry.opening = "prioritized";
  entry.pending = false;
  entry.priority = ++entry.coordinator.nextPriority;
}

function noteAutoPopoverToggle(entry: CoordinatedAutoPopover, open: boolean) {
  if (open) {
    if (!entry.opening) entry.priority = ++entry.coordinator.nextPriority;
    entry.opening = null;
    entry.pending = false;
  } else {
    entry.opening = null;
    entry.pending = entry.desiredOpen();
  }
  scheduleAutoPopoverFlush(entry.coordinator);
}

export function usePopoverSurface<TElement extends PopoverSurfaceElement>(
  popoverMode: "auto" | "manual" | undefined,
) {
  const popover = usePopoverContext();
  const autoPopover = useRef<CoordinatedAutoPopover | null>(null);
  const surfaceRef = useRef<TElement | null>(null);
  const desiredOpen = useRef(Boolean(popover?.open));
  const restoreTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  desiredOpen.current = Boolean(popover?.open);

  useLayoutEffect(() => {
    const element = surfaceRef.current;
    const nativePopoverElement = element as {
      hidePopover?: unknown;
      showPopover?: unknown;
    } | null;
    if (
      autoPopover.current &&
      (autoPopover.current.element !== element || popoverMode !== "auto")
    ) {
      unregisterAutoPopover(autoPopover.current);
      autoPopover.current = null;
    }
    if (
      !autoPopover.current &&
      element &&
      typeof nativePopoverElement?.showPopover === "function" &&
      typeof nativePopoverElement.hidePopover === "function" &&
      popoverMode === "auto"
    ) {
      autoPopover.current = registerAutoPopover(element, () => desiredOpen.current);
    }
  });

  useLayoutEffect(
    () => () => {
      if (autoPopover.current) unregisterAutoPopover(autoPopover.current);
      autoPopover.current = null;
    },
    [],
  );

  const restoreControlledSurface = useCallback(() => {
    if (autoPopover.current) {
      autoPopover.current.pending = true;
      scheduleAutoPopoverFlush(autoPopover.current.coordinator);
      return;
    }
    clearTimeout(restoreTimer.current);
    restoreTimer.current = setTimeout(() => {
      const element = surfaceRef.current;
      if (!desiredOpen.current || !element?.isConnected || !element.showPopover) return;
      if (element.matches(":popover-open")) return;
      try {
        element.showPopover();
      } catch {
        // A detached or hidden native popover will synchronize on the next render.
      }
    });
  }, []);

  useLayoutEffect(() => {
    const element = surfaceRef.current;
    if (!element?.isConnected || !popoverMode || !element.showPopover || !element.hidePopover)
      return;
    try {
      const nativeOpen = element.matches(":popover-open");
      if (popover?.open && !nativeOpen) {
        if (autoPopover.current) prioritizeAutoPopover(autoPopover.current);
        element.showPopover();
      }
      if (!popover?.open && autoPopover.current) {
        autoPopover.current.pending = false;
        scheduleAutoPopoverFlush(autoPopover.current.coordinator);
      }
      if (!popover?.open && nativeOpen) element.hidePopover();
    } catch {
      // Native popover methods can reject while an element is detaching or hidden.
    }
  }, [popover?.open, popoverMode]);

  useEffect(
    () => () => {
      clearTimeout(restoreTimer.current);
    },
    [],
  );

  const onNativeToggle = useCallback(
    (open: boolean) => {
      if (autoPopover.current) noteAutoPopoverToggle(autoPopover.current, open);
      if (open !== popover?.open) popover?.setOpen(open);
      if (!open && popover?.open) restoreControlledSurface();
    },
    [popover, restoreControlledSurface],
  );

  return { onNativeToggle, popover, surfaceRef };
}

export function useTooltipContext() {
  return useContext(TooltipContext);
}
