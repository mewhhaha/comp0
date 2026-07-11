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
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const onChangeStable = useEventCallback(onChange);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolvedValue =
        typeof next === "function" ? (next as (current: T) => T)(currentValue) : next;

      if (!Object.is(resolvedValue, currentValue)) {
        if (!isControlled) setUncontrolledValue(resolvedValue);
        onChangeStable(resolvedValue);
      }
    },
    [currentValue, isControlled, onChangeStable],
  );

  return [currentValue, setValue] as const;
}
