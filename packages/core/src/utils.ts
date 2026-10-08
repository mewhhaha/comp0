import {
  type CSSProperties,
  type MutableRefObject,
  type Ref,
  type RefCallback,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";

/** A minimal event handler shape used by prop-composition utilities. */
type AnyEventHandler = (event: { defaultPrevented?: boolean }) => void;
/** A callback ref, object ref, or omitted ref. */
export type PossibleRef<T> = Ref<T> | undefined;
type RefCleanup = () => void;

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

  useLayoutEffect(() => {
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

  // React detaches and reattaches a callback ref whose identity changes, so the
  // composed ref must stay stable while the refs it writes to change.
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

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // A stable identity is the point of this hook: callers pass it to effects and
  // context values that must not re-run when the implementation changes.
  return useCallback((...args: unknown[]) => callbackRef.current?.(...args), []);
}

function isEventHandler(key: string, value: unknown) {
  return /^on[A-Z]/.test(key) && typeof value === "function";
}

/** Chains handlers, allowing the first to prevent the second by default. */
function chainHandlers(theirs: AnyEventHandler, ours: AnyEventHandler): AnyEventHandler {
  return (event) => {
    theirs(event);
    if (event.defaultPrevented) return;
    ours(event);
  };
}

type Spread<TLeft, TRight> = Omit<TLeft, keyof TRight> & TRight;

/** The props `mergeProps` returns: later objects override earlier keys, as at runtime. */
export type MergedProps<TProps extends readonly unknown[]> = TProps extends readonly [
  infer THead,
  ...infer TTail,
]
  ? Spread<NonNullable<THead>, MergedProps<TTail>>
  : Record<never, never>;

/**
 * Merges DOM props from left to right: classes concatenate, styles merge, refs
 * compose, event handlers chain (an earlier handler that calls `preventDefault`
 * stops later ones), and any other later defined value wins.
 */
export function mergeProps<TProps extends readonly (object | undefined | null)[]>(
  ...propsList: TProps
): MergedProps<TProps> {
  const merged: Record<string, unknown> = {};

  for (const props of propsList) {
    if (!props) continue;

    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      const current = merged[key];

      if (key === "className" && current && value) {
        merged.className = `${current as string} ${value as string}`;
      } else if (key === "style" && typeof value === "object" && typeof current === "object") {
        merged.style = { ...(current as CSSProperties), ...(value as CSSProperties) };
      } else if (key === "ref" && current) {
        merged.ref = composeRefs(current as PossibleRef<unknown>, value as PossibleRef<unknown>);
      } else if (isEventHandler(key, value) && isEventHandler(key, current)) {
        merged[key] = chainHandlers(current as AnyEventHandler, value as AnyEventHandler);
      } else {
        merged[key] = value;
      }
    }
  }

  return merged as MergedProps<TProps>;
}

/** Returns an empty string for a present boolean data attribute. */
export function dataAttr(value: boolean | undefined) {
  return value ? "" : undefined;
}
