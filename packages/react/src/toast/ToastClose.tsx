import { type ComponentProps, type MouseEvent } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
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
function moveFocusBeforeDismiss(
  toastElement: HTMLElement,
  toastId: string,
  region: ToastRegionContextValue | null,
) {
  const siblings = region?.collection.items() ?? [];
  const index = siblings.findIndex((sibling) => sibling.key === toastId);
  let neighbor = siblings[index + 1];
  if (neighbor === undefined && index > 0) neighbor = siblings[index - 1];
  let target: HTMLElement | null = null;
  if (neighbor?.element) target = neighbor.element.querySelector<HTMLElement>(focusableSelector);
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
      data-slot="toast-close"
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      aria-label={props["aria-label"] ?? "Dismiss notification"}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        const toastElement = item.itemRef.current;
        const activeElement = toastElement?.ownerDocument.activeElement;
        if (toastElement && activeElement && toastElement.contains(activeElement)) {
          moveFocusBeforeDismiss(toastElement, item.toast.id, region);
        }
        context.dismiss(item.toast.id);
      }}
    />
  );
}
