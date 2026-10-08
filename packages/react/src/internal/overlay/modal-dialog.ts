import { useEffect, useRef, type Ref, type SyntheticEvent } from "react";
import { useComposedRefs } from "@comp0/core";

type ModalDialogOptions = {
  open: boolean;
  setOpen: (open: boolean) => void;
  ref?: Ref<HTMLDialogElement> | undefined;
  onCancel?: ((event: SyntheticEvent<HTMLDialogElement>) => void) | undefined;
  onClose?: ((event: SyntheticEvent<HTMLDialogElement>) => void) | undefined;
};

/**
 * Keeps a native `<dialog>` in sync with an owner's open state (Dialog, Drawer, Tour):
 * `showModal()` on open, `close()` on close, focus restored to the previously focused
 * element, and Escape / native close routed back through `setOpen(false)`.
 * Spread the returned `ref`, `onCancel` and `onClose` on the dialog element.
 */
export function useModalDialog({ onCancel, onClose, open, ref, setOpen }: ModalDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dismissingRef = useRef(false);
  const wasOpenRef = useRef(false);
  const composedRef = useComposedRefs(dialogRef, ref);

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (open) {
      if (!wasOpenRef.current) {
        const activeElement = element.ownerDocument.activeElement;
        const ownerWindow = element.ownerDocument.defaultView;
        restoreFocusRef.current =
          ownerWindow && activeElement instanceof ownerWindow.HTMLElement ? activeElement : null;
      }
      wasOpenRef.current = true;
      if (!element.open && typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    if (element.open && typeof element.close === "function") element.close();
    else element.removeAttribute("open");
    restoreFocusRef.current?.focus();
  }, [open]);

  return {
    ref: composedRef,
    onCancel(event: SyntheticEvent<HTMLDialogElement>) {
      onCancel?.(event);
      if (event.defaultPrevented) return;
      // Keep the native element synchronized with controlled state. The state owner decides
      // whether the request is accepted; a rejected request must leave the dialog open.
      event.preventDefault();
      dismissingRef.current = true;
      setOpen(false);
      queueMicrotask(() => {
        dismissingRef.current = false;
      });
    },
    onClose(event: SyntheticEvent<HTMLDialogElement>) {
      onClose?.(event);
      if (open && !dismissingRef.current) setOpen(false);
      restoreFocusRef.current?.focus();
    },
  };
}
