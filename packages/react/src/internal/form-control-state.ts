import { useEffect, useEffectEvent, type RefObject } from "react";
import { type ControllableStateControls } from "@comp0/core";

type FormControlElement = HTMLElement & { form: HTMLFormElement | null };

/**
 * Keeps uncontrolled state in step with its native form control: a form reset
 * returns it to the default, and a back/forward cache restore adopts the value
 * the browser kept. `state` is the third element of `useControllableState`;
 * omit it when the value is owned elsewhere.
 */
export function useFormReset<TElement extends FormControlElement, TValue>({
  controlRef,
  state,
  form,
  readValue,
}: {
  controlRef: RefObject<TElement | null>;
  state?: ControllableStateControls<TValue> | undefined;
  form?: string | undefined;
  readValue: (element: TElement) => TValue;
}) {
  const controlled = state?.controlled ?? true;
  const resetUncontrolledValue = useEffectEvent((event: Event) => {
    queueMicrotask(() => {
      if (!event.defaultPrevented) state?.reset();
    });
  });
  const restoreUncontrolledValue = useEffectEvent((event: PageTransitionEvent) => {
    const element = controlRef.current;
    if (!event.persisted || !element) return;
    state?.restore(readValue(element));
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
  state,
  enabled = true,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  state: ControllableStateControls<boolean>;
  enabled?: boolean | undefined;
}) {
  const synchronize = useEffectEvent(() => {
    const input = inputRef.current;
    if (input) state.restore(input.checked);
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
