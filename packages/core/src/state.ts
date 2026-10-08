import { useCallback, useRef, useState } from "react";
import { useEventCallback, useIsoLayoutEffect } from "./utils.js";

/** Options for a controlled or uncontrolled state value. */
export type ControllableStateOptions<T> = {
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
};

/** A state update: the next value, or a function of the current value. */
export type ControllableStateUpdate<T> = T | ((current: T) => T);

/**
 * Form lifecycle controls for a controllable value. `reset` and `restore` only
 * affect uncontrolled state and never notify `onChange`, matching how native
 * controls behave on form reset and back/forward cache restoration.
 */
export type ControllableStateControls<T> = {
  controlled: boolean;
  /** Returns uncontrolled state to its initial default, as a form reset does. */
  reset: () => void;
  /** Adopts a value the browser restored into the control. */
  restore: (value: T) => void;
};

/**
 * Manages a value that may be controlled by the caller or initialized internally.
 */
export function useControllableState<T>(
  options: ControllableStateOptions<T>,
): readonly [T, (next: ControllableStateUpdate<T>) => void, ControllableStateControls<T>];
export function useControllableState({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<unknown>): readonly [
  unknown,
  (next: ControllableStateUpdate<unknown>) => void,
  ControllableStateControls<unknown>,
] {
  const initialValueRef = useRef(defaultValue);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : uncontrolledValue;
  const onChangeStable = useEventCallback(onChange);
  const currentValueRef = useRef(currentValue);
  const controlledRef = useRef(controlled);
  useIsoLayoutEffect(() => {
    currentValueRef.current = currentValue;
    controlledRef.current = controlled;
  }, [currentValue, controlled]);

  // Setters cross context boundaries and effect dependencies, so their
  // identity is part of the hook's contract.
  const setValue = useCallback(
    (next: ControllableStateUpdate<unknown>) => {
      const previousValue = currentValueRef.current;
      const resolvedValue =
        typeof next === "function" ? (next as (current: unknown) => unknown)(previousValue) : next;

      if (Object.is(resolvedValue, previousValue)) return;
      currentValueRef.current = resolvedValue;
      if (!controlledRef.current) setUncontrolledValue(resolvedValue);
      onChangeStable(resolvedValue);
    },
    [onChangeStable],
  );
  // Stable for the same reason as setValue: form listeners hold onto it.
  const restore = useCallback((nextValue: unknown) => {
    if (controlledRef.current) return;
    currentValueRef.current = nextValue;
    setUncontrolledValue(nextValue);
  }, []);
  // Stable for the same reason as setValue: form listeners hold onto it.
  const reset = useCallback(() => restore(initialValueRef.current), [restore]);

  return [currentValue, setValue, { controlled, reset, restore }] as const;
}
