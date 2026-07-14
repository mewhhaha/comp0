import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useDialogContext, type DialogContentProps } from "./overlay-shared.js";
export type { DialogContentProps } from "./overlay-shared.js";

export function DialogContent({
  onCancel,
  onClose,
  portal = true,
  ref,
  ...props
}: DialogContentProps & RefProp<HTMLDialogElement>) {
  const dialog = useDialogContext();
  const contentRef = useRef<HTMLDialogElement | null>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const dismissingRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    if (dialog?.open) {
      if (!wasOpenRef.current) restoreFocusRef.current = element.ownerDocument.activeElement;
      wasOpenRef.current = true;
      if (!element.open && typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    if (element.open && typeof element.close === "function") element.close();
    else element.removeAttribute("open");
    if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus();
  }, [dialog]);

  const content = (
    <dialog
      {...props}
      ref={composeRefs(contentRef, ref)}
      id={props.id ?? dialog?.contentId}
      role={props.role ?? "dialog"}
      aria-modal={props["aria-modal"] ?? true}
      aria-labelledby={props["aria-labelledby"] ?? dialog?.triggerId}
      data-open={dataAttr(dialog?.open)}
      data-slot={dataSlot(props, "dialog-content")}
      onCancel={(event) => {
        onCancel?.(event);
        if (event.defaultPrevented) return;
        // Keep the native element synchronized with controlled state. The state owner decides
        // whether the request is accepted; a rejected request must leave the dialog open.
        event.preventDefault();
        dismissingRef.current = true;
        dialog?.setOpen(false);
        queueMicrotask(() => {
          dismissingRef.current = false;
        });
      }}
      onClose={(event) => {
        onClose?.(event);
        if (dialog?.open && !dismissingRef.current) dialog.setOpen(false);
        if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus();
      }}
    />
  );

  if (!portal || typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
