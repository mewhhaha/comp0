import { useToastContext } from "./toast-shared.js";

export function useToast() {
  const context = useToastContext("useToast");
  return { dismiss: context.dismiss, notify: context.notify };
}
