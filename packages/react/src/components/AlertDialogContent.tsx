import { DialogContent, type DialogContentProps } from "./DialogContent.js";

export type AlertDialogContentProps = DialogContentProps;

export function AlertDialogContent(props: AlertDialogContentProps) {
  return <DialogContent {...props} role={props.role ?? "alertdialog"} />;
}
