import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import {
  useToastContext,
  useToastItemContext,
  useOptionalToastRegionContext,
  type ToastRegionContextValue,
} from "./toast-shared.js";

const focusableSelector = "button, [href], input, select, textarea, [tabindex]";

/**
 * A dismissed toast that contained focus would strand focus on a removed
 * node; move it to the neighboring toast first, or back to where it came
 * from when this was the last toast.
 */
function moveFocusBeforeDismiss(toastElement: HTMLElement, region: ToastRegionContextValue | null) {
  const regionElement = region?.regionRef.current ?? toastElement.parentElement;
  let siblings: HTMLElement[] = [];
  if (regionElement) {
    siblings = Array.from(regionElement.querySelectorAll<HTMLElement>('[data-slot="toast"]'));
  }
  const index = siblings.indexOf(toastElement);
  let neighbor: HTMLElement | undefined = siblings[index + 1];
  if (neighbor === undefined && index > 0) neighbor = siblings[index - 1];
  let target: HTMLElement | null = null;
  if (neighbor) target = neighbor.querySelector<HTMLElement>(focusableSelector);
  const restore = region?.restoreFocusRef.current;
  if (!target && restore?.isConnected) target = restore;
  target?.focus();
}

export type ToastCloseProps = ComponentProps<"button"> & AsProp;

export function ToastClose({ as, onClick, ...props }: ToastCloseProps) {
  const context = useToastContext("ToastClose");
  const item = useToastItemContext("ToastClose");
  const region = useOptionalToastRegionContext();
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-label={props["aria-label"] ?? "Dismiss notification"}
      data-slot={dataSlot(props, "toast-close")}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const toastElement = item.itemRef.current;
        const activeElement = toastElement?.ownerDocument.activeElement;
        if (toastElement && activeElement && toastElement.contains(activeElement)) {
          moveFocusBeforeDismiss(toastElement, region);
        }
        context.dismiss(item.toast.id);
      }}
    />
  );
}
