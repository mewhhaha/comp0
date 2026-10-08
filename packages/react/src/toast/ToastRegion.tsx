import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useOverlaySurface } from "../internal/overlay/index.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { ToastRegionContext, useToastContext, type ToastRecord } from "./toast-shared.js";

function ignoreOpenChange() {
  // The region is shown for as long as it is mounted; nothing outside owns its open state.
}

export type ToastRegionProps = Omit<ComponentProps<"div">, "children"> &
  AsProp & {
    /** Keep the region rendered while the queue is empty. */
    forceMount?: boolean | undefined;
    /** Renders one Toast per queued record. */
    children: (toast: ToastRecord) => ReactNode;
  };

export function ToastRegion({
  as,
  children,
  forceMount,
  onBlur,
  onFocus,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...props
}: ToastRegionProps) {
  const context = useToastContext("ToastRegion");
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const contextRef = useRef(context);
  const pointerPauseRef = useRef(false);
  const focusPauseRef = useRef(false);
  useLayoutEffect(() => {
    contextRef.current = context;
  }, [context]);
  const toasts = context.toasts;
  const mounted = Boolean(forceMount || toasts.length > 0);

  // Manual mode keeps the region in the top layer above dialogs without light
  // dismiss; the element only exists while there are toasts, so showing it on
  // mount is enough and unmounting removes it from the top layer.
  const { props: surfaceProps, surfaceRef: regionRef } = useOverlaySurface<HTMLDivElement>({
    popover: "manual",
    id: props.id,
    ref,
    source: { open: mounted, setOpen: ignoreOpenChange },
  });

  useEffect(() => {
    if (!mounted) return;
    return () => {
      if (pointerPauseRef.current) contextRef.current.resume();
      if (focusPauseRef.current) contextRef.current.resume();
      pointerPauseRef.current = false;
      focusPauseRef.current = false;
    };
  }, [mounted]);

  if (!mounted) return null;
  const Part = partElement(as, "div");
  return (
    <ToastRegionContext value={{ regionRef, restoreFocusRef }}>
      <Part
        {...props}
        {...surfaceProps}
        // The region only exists while mounted, so an open marker would carry no information.
        data-open={undefined}
        role={props.role ?? "region"}
        aria-label={props["aria-label"] ?? "Notifications"}
        data-slot={dataSlot(props, "toast-region")}
        onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
          onPointerEnter?.(event);
          if (event.defaultPrevented || pointerPauseRef.current) return;
          pointerPauseRef.current = true;
          context.pause();
        }}
        onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
          onPointerLeave?.(event);
          if (event.defaultPrevented || !pointerPauseRef.current) return;
          pointerPauseRef.current = false;
          context.resume();
        }}
        onFocus={(event: FocusEvent<HTMLDivElement>) => {
          onFocus?.(event);
          if (event.defaultPrevented) return;
          const from = event.relatedTarget as HTMLElement | null;
          // Focus moves inside the region keep the existing pause.
          if (from && regionRef.current?.contains(from)) return;
          if (from) restoreFocusRef.current = from;
          if (focusPauseRef.current) return;
          focusPauseRef.current = true;
          context.pause();
        }}
        onBlur={(event: FocusEvent<HTMLDivElement>) => {
          onBlur?.(event);
          if (event.defaultPrevented) return;
          const to = event.relatedTarget as Node | null;
          if (to && regionRef.current?.contains(to)) return;
          if (!focusPauseRef.current) return;
          focusPauseRef.current = false;
          context.resume();
        }}
      >
        {toasts.map((toast) => (
          <Fragment key={toast.id}>{children(toast)}</Fragment>
        ))}
      </Part>
    </ToastRegionContext>
  );
}
