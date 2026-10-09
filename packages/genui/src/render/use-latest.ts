import { useEffect, useRef, type RefObject } from "react";

/**
 * A ref that always holds the latest value, for callbacks that effects and event handlers call
 * without resubscribing when the host passes a new function.
 */
export function useLatest<TValue>(value: TValue): RefObject<TValue> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
