import { Dialog } from "./Dialog.js";
import { type AlertDialogProps } from "./overlay-shared.js";
export type { AlertDialogProps } from "./overlay-shared.js";

export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} />;
}
