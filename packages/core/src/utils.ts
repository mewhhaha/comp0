import {
  type CSSProperties,
  type MutableRefObject,
  type Ref,
  type RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

/** A minimal event handler shape used by prop-composition utilities. */
export type AnyEventHandler = (event: { defaultPrevented?: boolean }) => void;
/** A callback ref, object ref, or omitted ref. */
export type PossibleRef<T> = Ref<T> | undefined;
type RefCleanup = () => void;

/** Whether DOM globals are available in the current runtime. */
export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
/** Uses a layout effect in the browser and an effect during server rendering. */
export const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

/** Assigns a value to either form of React ref and returns its React 19 cleanup. */
export function assignRef<T>(ref: PossibleRef<T>, value: T | null): RefCleanup | undefined {
  if (typeof ref === "function") {
    const cleanup = ref(value);
    if (typeof cleanup === "function") return cleanup;
    if (value !== null) return () => ref(null);
    return undefined;
  }

  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
    if (value !== null) {
      return () => {
        if (ref.current === value) ref.current = null;
      };
    }
  }
  return undefined;
}

/** Combines refs into one callback ref that preserves every ref cleanup. */
export function composeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return (value) => {
    const cleanups = refs.flatMap((ref) => assignRef(ref, value) ?? []);
    if (value === null || cleanups.length === 0) return undefined;
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}

/** Returns a stable callback ref that always writes to the latest supplied refs. */
export function useComposedRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T>;
export function useComposedRefs(...refs: PossibleRef<unknown>[]): RefCallback<unknown> {
  const refsRef = useRef(refs);
  const valueRef = useRef<unknown | null>(null);
  const assignmentsRef = useRef<
    Array<{ ref: PossibleRef<unknown>; cleanup: RefCleanup | undefined }>
  >([]);

  useIsoLayoutEffect(() => {
    const value = valueRef.current;
    refsRef.current = refs;
    if (value === null) return;

    const previousAssignments = [...assignmentsRef.current];
    const nextAssignments = refs.map((ref) => {
      const previousIndex = previousAssignments.findIndex((assignment) => assignment.ref === ref);
      if (previousIndex === -1) return { ref, cleanup: undefined, pending: true };
      const [previous] = previousAssignments.splice(previousIndex, 1);
      return { ...previous!, pending: false };
    });
    for (const assignment of previousAssignments) assignment.cleanup?.();
    assignmentsRef.current = nextAssignments.map(({ ref, cleanup, pending }) => ({
      ref,
      cleanup: pending ? assignRef(ref, value) : cleanup,
    }));
  });

  return useCallback((value: unknown | null) => {
    for (const assignment of assignmentsRef.current) assignment.cleanup?.();
    assignmentsRef.current = [];
    valueRef.current = value;
    if (value === null) return undefined;

    assignmentsRef.current = refsRef.current.map((ref) => ({
      ref,
      cleanup: assignRef(ref, value),
    }));
    return () => {
      for (const assignment of assignmentsRef.current) assignment.cleanup?.();
      assignmentsRef.current = [];
      valueRef.current = null;
    };
  }, []);
}

/** Returns a stable callback that invokes the latest supplied implementation. */
export function useEventCallback<T extends (...args: never[]) => unknown>(
  callback: T | undefined,
): (...args: Parameters<T>) => ReturnType<T> | undefined;
export function useEventCallback(
  callback: ((...args: unknown[]) => unknown) | undefined,
): (...args: unknown[]) => unknown {
  const callbackRef = useRef(callback);

  useIsoLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: unknown[]) => callbackRef.current?.(...args), []);
}

function isEventHandler(key: string, value: unknown) {
  return /^on[A-Z]/.test(key) && typeof value === "function";
}

/** Chains handlers, allowing the first to prevent the second by default. */
export function chainHandlers<T extends AnyEventHandler>(
  theirs: T | undefined,
  ours: T | undefined,
  options: { checkDefaultPrevented?: boolean } = {},
) {
  return (event: Parameters<T>[0]) => {
    theirs?.(event);
    if (options.checkDefaultPrevented !== false && event.defaultPrevented) return;
    ours?.(event);
  };
}

/** Merges DOM props, concatenating classes, merging styles, and chaining handlers. */
export function mergeProps<T extends Record<string, unknown>>(...propsList: (T | undefined)[]) {
  const merged: Record<string, unknown> = {};

  for (const props of propsList) {
    if (!props) continue;

    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;

      if (key === "className" && merged.className && value) {
        merged.className = `${merged.className as string} ${value as string}`;
      } else if (
        key === "style" &&
        typeof value === "object" &&
        value &&
        typeof merged.style === "object"
      ) {
        merged.style = { ...(merged.style as CSSProperties), ...(value as CSSProperties) };
      } else if (isEventHandler(key, value) && isEventHandler(key, merged[key])) {
        merged[key] = chainHandlers(merged[key] as AnyEventHandler, value as AnyEventHandler);
      } else {
        merged[key] = value;
      }
    }
  }

  return merged as T;
}

/** Returns an empty string for a present boolean data attribute. */
export function dataAttr(value: boolean | undefined) {
  return value ? "" : undefined;
}

/** Converts named boolean states into presence-based `data-*` attributes. */
export function dataAttributes(states: Record<string, boolean | undefined>) {
  return Object.fromEntries(
    Object.entries(states)
      .filter(([, value]) => value)
      .map(([key]) => [`data-${key}`, ""]),
  );
}

/** Invokes every supplied callback in declaration order. */
export function callAll<T extends (...args: never[]) => unknown>(...callbacks: (T | undefined)[]) {
  return (...args: Parameters<T>) => {
    for (const callback of callbacks) {
      callback?.(...args);
    }
  };
}
