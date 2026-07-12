import { useToastContext } from "./toast-shared.js";

export function useToast() {
  const context = useToastContext();
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }
  return { dismiss: context.dismiss, notify: context.notify };
}
