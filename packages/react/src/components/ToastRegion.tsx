import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { composeRefs } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { ToastRegionContext, useToastContext, type ToastRecord } from "./toast-shared.js";

export type ToastRegionProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Keep the region rendered while the queue is empty. */
  forceMount?: boolean | undefined;
  /** Renders one Toast per queued record. */
  children: (toast: ToastRecord) => ReactNode;
};

export function ToastRegion({
  children,
  forceMount,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: ToastRegionProps & RefProp<HTMLDivElement>) {
  const context = useToastContext();
  const regionRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const contextRef = useRef(context);
  const pointerPauseRef = useRef(false);
  const focusPauseRef = useRef(false);
  contextRef.current = context;
  const toasts = context?.toasts ?? [];
  const mounted = Boolean(forceMount || toasts.length > 0);

  // Manual mode keeps the region in the top layer above dialogs without light
  // dismiss; the element only exists while there are toasts, so showing it on
  // mount is enough and unmounting removes it from the top layer.
  useLayoutEffect(() => {
    if (typeof document === "undefined" || !mounted) return;
    const element = regionRef.current as (HTMLDivElement & { showPopover?: () => void }) | null;
    if (!element?.isConnected || typeof element.showPopover !== "function") return;
    try {
      element.showPopover();
    } catch {
      // Already shown, or the environment does not support popovers; the
      // region then stays in normal flow.
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    return () => {
      if (pointerPauseRef.current) contextRef.current?.resume();
      if (focusPauseRef.current) contextRef.current?.resume();
      pointerPauseRef.current = false;
      focusPauseRef.current = false;
    };
  }, [mounted]);

  if (!mounted) return null;
  return (
    <ToastRegionContext value={{ regionRef, restoreFocusRef }}>
      <div
        {...props}
        ref={composeRefs(regionRef, ref)}
        role={props.role ?? "region"}
        aria-label={props["aria-label"] ?? "Notifications"}
        popover="manual"
        data-slot={dataSlot(props, "toast-region")}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.defaultPrevented || pointerPauseRef.current) return;
          pointerPauseRef.current = true;
          context?.pause();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (event.defaultPrevented || !pointerPauseRef.current) return;
          pointerPauseRef.current = false;
          context?.resume();
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          const from = event.relatedTarget as HTMLElement | null;
          // Focus moves inside the region keep the existing pause.
          if (from && regionRef.current?.contains(from)) return;
          if (from) restoreFocusRef.current = from;
          if (focusPauseRef.current) return;
          focusPauseRef.current = true;
          context?.pause();
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (event.defaultPrevented) return;
          const to = event.relatedTarget as Node | null;
          if (to && regionRef.current?.contains(to)) return;
          if (!focusPauseRef.current) return;
          focusPauseRef.current = false;
          context?.resume();
        }}
      >
        {toasts.map((toast) => (
          <Fragment key={toast.id}>{children(toast)}</Fragment>
        ))}
      </div>
    </ToastRegionContext>
  );
}
