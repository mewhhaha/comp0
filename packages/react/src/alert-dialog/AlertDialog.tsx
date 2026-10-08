import { Dialog, type DialogProps } from "../dialog/Dialog.js";

export type AlertDialogProps = DialogProps;

export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} />;
}
