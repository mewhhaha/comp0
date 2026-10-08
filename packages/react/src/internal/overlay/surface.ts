import {
  useEffect,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type Ref,
  type ToggleEvent,
} from "react";
import { dataAttr, useComposedRefs } from "@comp0/core";
import { usePopoverContext } from "./context.js";
import {
  noteAutoPopoverToggle,
  prioritizeAutoPopover,
  registerAutoPopover,
  scheduleAutoPopoverFlush,
  unregisterAutoPopover,
  type CoordinatedAutoPopover,
  type PopoverSurfaceElement,
} from "./coordinator.js";
import { placementSurfaceStyle, type PopoverPlacementProps } from "./placement.js";

/** What a native popover surface needs from its owner: whether it is open and how to change that. */
export type PopoverSurfaceSource = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

/**
 * Drives a native `popover` element from an owner's open state: shows and hides
 * it, coordinates `auto` popovers that would otherwise close each other, and
 * restores a controlled surface the browser closed against the owner's wishes.
 * The owner defaults to the nearest popover context; pass `source` for surfaces
 * that have no popover context (ToastRegion).
 */
export function usePopoverSurface<TElement extends PopoverSurfaceElement>(
  popoverMode: "auto" | "manual" | undefined,
  source?: PopoverSurfaceSource | null | undefined,
) {
  const contextPopover = usePopoverContext();
  const popover = source === undefined ? contextPopover : source;
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

  return { onNativeToggle, popover: source === undefined ? contextPopover : null, surfaceRef };
}

export type OverlaySurfaceOptions<TElement extends HTMLElement = HTMLElement> =
  PopoverPlacementProps & {
    /** Native popover mode; `undefined` renders in normal flow. */
    popover: "auto" | "manual" | undefined;
    /** Owner of the open state; defaults to the nearest popover context. */
    source?: PopoverSurfaceSource | null | undefined;
    /** DOM id; defaults to the popover context's content id. */
    id?: string | undefined;
    hidden?: boolean | undefined;
    style?: CSSProperties | undefined;
    ref?: Ref<TElement> | undefined;
    /** The consumer's toggle handler; runs first and can `preventDefault()` to skip state sync. */
    onToggle?: ((event: ToggleEvent<TElement>) => void) | undefined;
  };

/**
 * The shared popover surface for every part that renders a floating panel in
 * the top layer (PopoverContent, TooltipContent, PreviewContent; designed for
 * SelectPopover, ComboboxPopover, MenuPopover, ColorPickerPopover,
 * DatePickerPopover, DateRangePickerPopover and MentionFieldPopover to adopt).
 *
 * Spread `props` on the surface element and add the part's own role, handlers
 * and `data-slot`. It supplies the composed `ref`, `id`, `popover`, `hidden`
 * (closed unless the owner is open), anchor-positioned `style`, `data-open`
 * and an `onToggle` that mirrors native open/close back into the owner while
 * ignoring toggles bubbling from nested popovers.
 */
export function useOverlaySurface<TElement extends HTMLElement = HTMLElement>({
  hidden,
  id,
  offset,
  onToggle,
  placement,
  popover: popoverMode,
  ref,
  source,
  style,
}: OverlaySurfaceOptions<TElement>) {
  const {
    onNativeToggle,
    popover: context,
    surfaceRef,
  } = usePopoverSurface<TElement & PopoverSurfaceElement>(popoverMode, source);
  const owner = source === undefined ? context : source;
  const composedRef = useComposedRefs(surfaceRef, ref);
  const triggerId = context?.triggerId;
  return {
    open: Boolean(owner?.open),
    popover: context,
    surfaceRef,
    props: {
      ref: composedRef,
      id: id ?? context?.contentId,
      popover: popoverMode,
      hidden: hidden ?? !owner?.open,
      style: placementSurfaceStyle(placement, offset, triggerId, style),
      "data-open": dataAttr(owner?.open),
      onToggle(event: ToggleEvent<TElement>) {
        onToggle?.(event);
        // Toggle events from nested popovers bubble through the React tree;
        // only this surface's own toggles drive its state.
        if (event.target !== event.currentTarget) return;
        if (!event.defaultPrevented) onNativeToggle(event.newState === "open");
      },
    },
  };
}
