import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { composeRefs, dataAttr, useControllableState } from "@comp0/core";
import { type RefProp } from "../shared.js";
import { type ModalProps } from "./overlay-shared.js";
export type { ModalProps } from "./overlay-shared.js";
export function Modal({
  open: openProp,
  defaultOpen = false,
  onChange,
  children,
  onCancel,
  onClose,
  ref,
  ...props
}: ModalProps & RefProp<HTMLDialogElement>) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange,
  });
  const localRef = useRef<HTMLDialogElement | null>(null);
  const restoreFocusRef = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = localRef.current;
    if (!dialog) return;

    if (open) {
      restoreFocusRef.current = document.activeElement;
      if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (dialog.open) {
      dialog.close();
      if (restoreFocusRef.current instanceof HTMLElement) restoreFocusRef.current.focus();
    }
  }, [open]);

  const dialog = (
    <dialog
      {...props}
      ref={(element) => {
        localRef.current = element;
        composeRefs(ref)(element);
      }}
      aria-modal={props["aria-modal"] ?? true}
      data-open={dataAttr(open)}
      onCancel={(event) => {
        onCancel?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      onClose={(event) => {
        onClose?.(event);
        if (open) setOpen(false);
      }}
    >
      {typeof children === "function" ? children({ open }) : children}
    </dialog>
  );

  if (!mounted || typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
}
