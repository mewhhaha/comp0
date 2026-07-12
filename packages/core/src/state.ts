import { useCallback, useState } from "react";
import { useEventCallback } from "./utils.js";

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

  const setValue = useCallback(
    (next: unknown | ((current: unknown) => unknown)) => {
      const resolvedValue =
        typeof next === "function" ? (next as (current: unknown) => unknown)(currentValue) : next;

      if (!Object.is(resolvedValue, currentValue)) {
        if (!isControlled) setUncontrolledValue(resolvedValue);
        onChangeStable(resolvedValue);
      }
    },
    [currentValue, isControlled, onChangeStable],
  );

  return [currentValue, setValue] as const;
}
