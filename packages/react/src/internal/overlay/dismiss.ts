import { useEffect, type RefObject } from "react";

/**
 * Escape dismisses an open hover surface (Tooltip, Preview) no matter where
 * focus is, as WCAG 1.4.13 requires. The listener lives on the trigger's document.
 */
export function useEscapeDismiss(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  setOpen: (open: boolean) => void,
) {
  useEffect(() => {
    if (!open) return;
    const ownerDocument = triggerRef.current?.ownerDocument;
    if (!ownerDocument) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    ownerDocument.addEventListener("keydown", onKeyDown, true);
    return () => ownerDocument.removeEventListener("keydown", onKeyDown, true);
  }, [open, triggerRef, setOpen]);
}
