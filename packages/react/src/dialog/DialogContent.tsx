import { type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { dataAttr } from "@comp0/core";
import { useModalDialog } from "../internal/overlay/modal-dialog.js";
import { useRequiredDialogContext } from "../internal/overlay/context.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";

export type DialogContentProps = Omit<ComponentProps<"dialog">, "open"> &
  AsProp & {
    /** Render into `document.body` instead of in place. */
    portal?: boolean | undefined;
  };

export function DialogContent({
  as,
  onCancel,
  onClose,
  portal = true,
  ref,
  ...props
}: DialogContentProps) {
  const dialog = useRequiredDialogContext("DialogContent");
  const modal = useModalDialog({
    open: dialog.open,
    setOpen: dialog.setOpen,
    ref,
    onCancel,
    onClose,
  });

  const Part = partElement(as, "dialog");
  const content = (
    <Part
      {...props}
      {...modal}
      id={props.id ?? dialog.contentId}
      role={props.role ?? "dialog"}
      aria-modal={props["aria-modal"] ?? true}
      data-open={dataAttr(dialog.open)}
      data-slot={dataSlot(props, "dialog-content")}
    />
  );

  if (!portal || typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
