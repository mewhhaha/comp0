import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useControllableState } from "@comp0/core";

export type OverlayRootProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state; native cancel, close, and toggle events stay on content parts. */
  onToggle?: ((open: boolean) => void) | undefined;
  children?: ReactNode | undefined;
};

export type DialogProps = OverlayRootProps;
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

export type PopoverPlacement =
  | "top"
  | "top start"
  | "top end"
  | "bottom"
  | "bottom start"
  | "bottom end"
  | "left"
  | "left top"
  | "left bottom"
  | "right"
  | "right top"
  | "right bottom";

export type PopoverPlacementProps = {
  /** Trigger side to open on, with an optional aligned edge; positioned with CSS anchor positioning and flipped automatically when there is no room. */
  placement?: PopoverPlacement | undefined;
  /** Gap between the trigger and the surface in pixels; only used together with placement. */
  offset?: number | undefined;
};

export type PopoverOverlayProps = Omit<OverlayContentProps, "popover"> &
  PopoverPlacementProps & {
    popover?: "auto" | "manual" | "none" | undefined;
  };

const placementAreas: Record<PopoverPlacement, string> = {
  top: "block-start",
  "top start": "block-start span-inline-end",
  "top end": "block-start span-inline-start",
  bottom: "block-end",
  "bottom start": "block-end span-inline-end",
  "bottom end": "block-end span-inline-start",
  left: "left",
  "left top": "left span-bottom",
  "left bottom": "left span-top",
  right: "right",
  "right top": "right span-bottom",
  "right bottom": "right span-top",
};

/** CSS anchor names must be dashed idents, but React ids contain characters like «r1»; both the trigger and its surface derive the same name from the shared trigger id. */
export function popoverAnchorName(triggerId: string | undefined): string | undefined {
  if (!triggerId) return undefined;
  return `--comp0-anchor-${triggerId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export function triggerAnchorStyle(
  triggerId: string | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  const anchorName = popoverAnchorName(triggerId);
  if (!anchorName) return style;
  return { anchorName, ...style } as CSSProperties;
}

export function placementSurfaceStyle(
  placement: PopoverPlacement | undefined,
  offset: number | undefined,
  triggerId: string | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (!placement) return style;
  // The UA popover stylesheet sets inset: 0 and margin: auto, which fight
  // position-area; the offset margin only follows the placement axis so a
  // flip fallback keeps the same gap.
  const onBlockAxis = placement.startsWith("top") || placement.startsWith("bottom");
  const computed: Record<string, string | number> = {
    inset: "auto",
    margin: 0,
    positionArea: placementAreas[placement],
    positionTryFallbacks: onBlockAxis ? "flip-block" : "flip-inline",
  };
  const anchorName = popoverAnchorName(triggerId);
  if (anchorName) computed["positionAnchor"] = anchorName;
  if (offset) computed[onBlockAxis ? "marginBlock" : "marginInline"] = `${offset}px`;
  return { ...computed, ...style } as CSSProperties;
}

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

export type TooltipContextValue = OverlayContextValue & {
  cancelClose: () => void;
  scheduleClose: () => void;
};

export const DialogContext = createContext<OverlayContextValue | null>(null);
export const PopoverContext = createContext<PopoverContextValue | null>(null);
export const TooltipContext = createContext<TooltipContextValue | null>(null);

export function useDialogContext() {
  return useContext(DialogContext);
}

export function usePopoverContext() {
  return useContext(PopoverContext);
}

/**
 * The open-state half of a popover: controllable open state, a trigger ref for
 * focus restore, and requestClose (close and return focus to the trigger).
 * Popover provides this, and so do the picker roots (Select, Combobox,
 * DatePicker) so their surfaces work without a separate Popover wrapper.
 */
export function usePopoverState(options: {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onToggle?: ((open: boolean) => void) | undefined;
  triggerId: string;
  contentId: string;
}): PopoverContextValue {
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(false);
  const wasOpen = useRef(false);
  const [open, setOpenState] = useControllableState({
    value: options.open,
    defaultValue: options.defaultOpen ?? false,
    onChange: options.onToggle,
  });
  const setOpen = (nextOpen: boolean) => {
    if (!nextOpen) restoreFocus.current = false;
    setOpenState(nextOpen);
  };
  const requestClose = () => {
    restoreFocus.current = true;
    setOpenState(false);
  };
  useLayoutEffect(() => {
    if (wasOpen.current && !open && restoreFocus.current) triggerRef.current?.focus();
    if (!open) restoreFocus.current = false;
    wasOpen.current = open;
  }, [open]);
  return {
    open,
    setOpen,
    requestClose,
    triggerId: options.triggerId,
    contentId: options.contentId,
    focusTrigger() {
      triggerRef.current?.focus();
    },
    setTriggerElement(element) {
      triggerRef.current = element;
    },
  };
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

  const restoreControlledSurface = () => {
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
  };

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

  const onNativeToggle = (open: boolean) => {
    if (autoPopover.current) noteAutoPopoverToggle(autoPopover.current, open);
    if (open !== popover?.open) popover?.setOpen(open);
    if (!open && popover?.open) restoreControlledSurface();
  };

  return { onNativeToggle, popover, surfaceRef };
}

export function useTooltipContext() {
  return useContext(TooltipContext);
}
