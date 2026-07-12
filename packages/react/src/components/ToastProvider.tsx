import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  ToastContext,
  type ToastContextValue,
  type ToastOptions,
  type ToastRecord,
} from "./toast-shared.js";

type ToastTimer = {
  /** Active window.setTimeout handle, or null while paused. */
  handle: number | null;
  /** Timestamp the running timer fires at; meaningless while paused. */
  expiresAt: number;
  /** Milliseconds left when the timer last paused. */
  remaining: number;
};

export type ToastProviderProps = {
  children?: ReactNode | undefined;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const baseId = useId();
  const nextToastNumber = useRef(0);
  const timers = useRef(new Map<string, ToastTimer>());
  const pauseCount = useRef(0);

  const startTimer = (id: string, duration: number) => {
    if (typeof window === "undefined") return;
    const handle = window.setTimeout(() => {
      timers.current.delete(id);
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, duration);
    timers.current.set(id, { expiresAt: Date.now() + duration, handle, remaining: duration });
  };

  const notify = (content: ReactNode, options?: ToastOptions) => {
    const kind = options?.kind ?? "status";
    let timeout = options?.timeout;
    if (timeout === undefined) timeout = 6000;
    nextToastNumber.current += 1;
    const id = `${baseId}toast-${nextToastNumber.current}`;
    setToasts((previous) => [...previous, { content, id, kind, timeout }]);
    if (timeout !== null) {
      if (pauseCount.current > 0) {
        timers.current.set(id, { expiresAt: 0, handle: null, remaining: timeout });
      } else {
        startTimer(id, timeout);
      }
    }
    return id;
  };

  const dismiss = (id: string) => {
    const timer = timers.current.get(id);
    if (timer && timer.handle !== null) window.clearTimeout(timer.handle);
    timers.current.delete(id);
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const pause = () => {
    pauseCount.current += 1;
    if (pauseCount.current !== 1) return;
    for (const timer of timers.current.values()) {
      if (timer.handle === null) continue;
      window.clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.expiresAt - Date.now());
    }
  };

  const resume = () => {
    pauseCount.current = Math.max(0, pauseCount.current - 1);
    if (pauseCount.current !== 0) return;
    for (const [id, timer] of timers.current) {
      if (timer.handle === null) startTimer(id, timer.remaining);
    }
  };

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers.values()) {
        if (timer.handle !== null) window.clearTimeout(timer.handle);
      }
      activeTimers.clear();
    };
  }, []);

  const context: ToastContextValue = { dismiss, notify, pause, resume, toasts };
  return <ToastContext value={context}>{children}</ToastContext>;
}
