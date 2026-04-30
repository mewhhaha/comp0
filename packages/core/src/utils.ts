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

export type AnyEventHandler = (event: { defaultPrevented?: boolean }) => void;
export type PossibleRef<T> = Ref<T> | undefined;

export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
export const useIsoLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

export function assignRef<T>(ref: PossibleRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export function composeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      assignRef(ref, value);
    }
  };
}

export function useComposedRefs<T>(...refs: PossibleRef<T>[]) {
  const refsRef = useRef(refs);

  useIsoLayoutEffect(() => {
    refsRef.current = refs;
  });

  return useCallback((value: T | null) => {
    for (const ref of refsRef.current) {
      assignRef(ref, value);
    }
  }, []);
}

export function useEventCallback<T extends (...args: never[]) => unknown>(callback: T | undefined) {
  const callbackRef = useRef(callback);

  useIsoLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Parameters<T>) => callbackRef.current?.(...args), []);
}

function isEventHandler(key: string, value: unknown) {
  return /^on[A-Z]/.test(key) && typeof value === "function";
}

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

export function dataAttr(value: boolean | undefined) {
  return value ? "" : undefined;
}

export function dataAttributes(states: Record<string, boolean | undefined>) {
  return Object.fromEntries(
    Object.entries(states)
      .filter(([, value]) => value)
      .map(([key]) => [`data-${key}`, ""]),
  );
}

export function callAll<T extends (...args: never[]) => unknown>(...callbacks: (T | undefined)[]) {
  return (...args: Parameters<T>) => {
    for (const callback of callbacks) {
      callback?.(...args);
    }
  };
}
