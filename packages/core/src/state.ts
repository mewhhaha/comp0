import { useCallback, useRef, useState } from "react";
import { useEventCallback, useIsoLayoutEffect } from "./utils.js";

/** Options for a controlled or uncontrolled state value. */
export interface ControllableStateOptions<T> {
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

/**
 * Manages a value that may be controlled by the caller or initialized internally.
 */
export function useControllableState<T>(
  options: ControllableStateOptions<T>,
): readonly [T, (next: T | ((current: T) => T)) => void];
export function useControllableState({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<unknown>): readonly [
  unknown,
  (next: unknown | ((current: unknown) => unknown)) => void,
] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const onChangeStable = useEventCallback(onChange);
  const currentValueRef = useRef(currentValue);
  const isControlledRef = useRef(isControlled);
  useIsoLayoutEffect(() => {
    currentValueRef.current = currentValue;
    isControlledRef.current = isControlled;
  }, [currentValue, isControlled]);

  const setValue = useCallback(
    (next: unknown | ((current: unknown) => unknown)) => {
      const previousValue = currentValueRef.current;
      const resolvedValue =
        typeof next === "function" ? (next as (current: unknown) => unknown)(previousValue) : next;

      if (Object.is(resolvedValue, previousValue)) return;
      currentValueRef.current = resolvedValue;
      if (!isControlledRef.current) setUncontrolledValue(resolvedValue);
      onChangeStable(resolvedValue);
    },
    [onChangeStable],
  );

  return [currentValue, setValue] as const;
}
