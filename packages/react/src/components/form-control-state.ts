import { useCallback, useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { useEventCallback, useIsoLayoutEffect } from "@comp0/core";

type FormControlElement = HTMLElement & { form: HTMLFormElement | null };

type FormControlStateOptions<TValue> = {
  value?: TValue | undefined;
  defaultValue: TValue;
  onChange?: ((value: TValue) => void) | undefined;
};

type FormControlStateUpdate<TValue> = TValue | ((currentValue: TValue) => TValue);

export function useFormControlState<TValue>({
  value,
  defaultValue,
  onChange,
}: FormControlStateOptions<TValue>) {
  const initialValueRef = useRef(defaultValue);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : uncontrolledValue;
  const currentValueRef = useRef(currentValue);
  const controlledRef = useRef(controlled);
  const onChangeStable = useEventCallback(onChange);
  useIsoLayoutEffect(() => {
    currentValueRef.current = currentValue;
    controlledRef.current = controlled;
  }, [controlled, currentValue]);

  // These callbacks cross context boundaries, so their identity is part of the component contract.
  const setValue = useCallback(
    (next: FormControlStateUpdate<TValue>) => {
      const previousValue = currentValueRef.current;
      let nextValue = next as TValue;
      if (typeof next === "function") {
        nextValue = (next as (currentValue: TValue) => TValue)(previousValue);
      }
      if (Object.is(nextValue, previousValue)) return;
      currentValueRef.current = nextValue;
      if (!controlledRef.current) setUncontrolledValue(nextValue);
      onChangeStable(nextValue);
    },
    [onChangeStable],
  );
  const resetValue = useCallback(() => {
    if (controlledRef.current) return;
    currentValueRef.current = initialValueRef.current;
    setUncontrolledValue(initialValueRef.current);
  }, []);
  const restoreValue = useCallback((nextValue: TValue) => {
    if (controlledRef.current) return;
    currentValueRef.current = nextValue;
    setUncontrolledValue(nextValue);
  }, []);

  return { controlled, value: currentValue, setValue, resetValue, restoreValue };
}

export function useFormReset<TElement extends FormControlElement, TValue>({
  controlRef,
  controlled,
  form,
  resetValue,
  restoreValue,
  readValue,
}: {
  controlRef: RefObject<TElement | null>;
  controlled: boolean;
  form?: string | undefined;
  resetValue: () => void;
  restoreValue: (value: TValue) => void;
  readValue: (element: TElement) => TValue;
}) {
  const resetUncontrolledValue = useEffectEvent((event: Event) => {
    queueMicrotask(() => {
      if (!event.defaultPrevented && !controlled) resetValue();
    });
  });
  const restoreUncontrolledValue = useEffectEvent((event: PageTransitionEvent) => {
    const element = controlRef.current;
    if (!event.persisted || controlled || !element) return;
    restoreValue(readValue(element));
  });

  useEffect(() => {
    if (controlled) return;
    const element = controlRef.current;
    if (!element) return;
    const owningForm = element.form;
    const ownerWindow = element.ownerDocument.defaultView;
    owningForm?.addEventListener("reset", resetUncontrolledValue);
    ownerWindow?.addEventListener("pageshow", restoreUncontrolledValue);
    return () => {
      owningForm?.removeEventListener("reset", resetUncontrolledValue);
      ownerWindow?.removeEventListener("pageshow", restoreUncontrolledValue);
    };
  }, [controlRef, controlled, form]);
}

type RegisteredRadio = {
  inputRef: RefObject<HTMLInputElement | null>;
  synchronize: () => void;
};

const radiosByDocument = new WeakMap<Document, Set<RegisteredRadio>>();

export function useStandaloneRadioSynchronization({
  inputRef,
  controlled,
  restoreValue,
  enabled = true,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  controlled: boolean;
  restoreValue: (checked: boolean) => void;
  enabled?: boolean | undefined;
}) {
  const synchronize = useEffectEvent(() => {
    const input = inputRef.current;
    if (!controlled && input) restoreValue(input.checked);
  });

  useEffect(() => {
    if (!enabled) return;
    const input = inputRef.current;
    if (!input) return;
    let radios = radiosByDocument.get(input.ownerDocument);
    if (!radios) {
      radios = new Set();
      radiosByDocument.set(input.ownerDocument, radios);
    }
    const registeredRadio = { inputRef, synchronize };
    radios.add(registeredRadio);
    return () => {
      radios.delete(registeredRadio);
      if (radios.size === 0) radiosByDocument.delete(input.ownerDocument);
    };
  }, [enabled, inputRef]);
}

export function synchronizeStandaloneRadioGroup(source: HTMLInputElement) {
  if (!source.name) return;
  const radios = radiosByDocument.get(source.ownerDocument);
  if (!radios) return;
  for (const registeredRadio of radios) {
    const candidate = registeredRadio.inputRef.current;
    if (!candidate || candidate === source) continue;
    if (candidate.name !== source.name || candidate.form !== source.form) continue;
    if (candidate.getRootNode() !== source.getRootNode()) continue;
    registeredRadio.synchronize();
  }
}
