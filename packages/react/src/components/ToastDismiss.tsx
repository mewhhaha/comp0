import { type ButtonHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import {
  useToastContext,
  useToastItemContext,
  useToastRegionContext,
  type ToastRegionContextValue,
} from "./toast-shared.js";

export type ToastDismissProps = ButtonHTMLAttributes<HTMLButtonElement>;

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

export function ToastDismiss({
  onClick,
  ref,
  ...props
}: ToastDismissProps & RefProp<HTMLButtonElement>) {
  const context = useToastContext();
  const item = useToastItemContext();
  const region = useToastRegionContext();

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      aria-label={props["aria-label"] ?? "Dismiss notification"}
      data-slot={dataSlot(props, "toast-dismiss")}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || !item) return;
        const toastElement = item.itemRef.current;
        const activeElement = toastElement?.ownerDocument.activeElement;
        if (toastElement && activeElement && toastElement.contains(activeElement)) {
          moveFocusBeforeDismiss(toastElement, region);
        }
        context?.dismiss(item.toast.id);
      }}
    />
  );
}
