import { createContext, useContext, type ReactNode, type RefObject } from "react";

export type ToastKind = "status" | "alert";

export type ToastRecord = {
  id: string;
  content: ReactNode;
  kind: ToastKind;
  /** Milliseconds until auto-dismissal; null keeps the toast until dismissed. */
  timeout: number | null;
};

export type ToastOptions = {
  kind?: ToastKind | undefined;
  /** Milliseconds until auto-dismissal; null keeps the toast until dismissed. Defaults to 6000. */
  timeout?: number | null | undefined;
};

export type ToastContextValue = {
  toasts: ToastRecord[];
  notify: (content: ReactNode, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  /** Suspends every auto-dismiss timer; each pause holds until a matching resume. */
  pause: () => void;
  /** Releases one pause; timers restart with their remaining time once all pauses release. */
  resume: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext() {
  return useContext(ToastContext);
}

export type ToastRegionContextValue = {
  regionRef: RefObject<HTMLDivElement | null>;
  /** The element focus came from when it last entered the region, for restoration after dismissal. */
  restoreFocusRef: RefObject<HTMLElement | null>;
};

export const ToastRegionContext = createContext<ToastRegionContextValue | null>(null);

export function useToastRegionContext() {
  return useContext(ToastRegionContext);
}

export type ToastItemContextValue = {
  toast: ToastRecord;
  itemRef: RefObject<HTMLDivElement | null>;
};

export const ToastItemContext = createContext<ToastItemContextValue | null>(null);

export function useToastItemContext() {
  return useContext(ToastItemContext);
}
