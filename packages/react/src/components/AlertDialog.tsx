import { dataSlot, type RefProp } from "../shared.js";
import { Modal } from "./Modal.js";
import { type ModalProps } from "./overlay-shared.js";

export type AlertDialogProps = ModalProps & {
  role?: "alertdialog" | "dialog" | undefined;
};

export function AlertDialog({
  role = "alertdialog",
  ref,
  ...props
}: AlertDialogProps & RefProp<HTMLDialogElement>) {
  return (
    <Modal
      {...props}
      ref={ref}
      role={role}
      aria-modal={props["aria-modal"] ?? true}
      data-slot={dataSlot(props, "alert-dialog")}
    />
  );
}
