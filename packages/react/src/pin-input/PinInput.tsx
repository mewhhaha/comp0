import { useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import { dataAttr, useCollection, useControllableState } from "@comp0/core";
import { useFormReset } from "../internal/form-control-state.js";
import { FormValue } from "../internal/form-value.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { PinInputContext, type PinInputType } from "./pin-input-shared.js";
export type { PinInputType } from "./pin-input-shared.js";

export type PinInputProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    value?: string | undefined;
    defaultValue?: string | undefined;
    /** Receives the joined code; shadows the DOM onChange. */
    onChange?: ((value: string) => void) | undefined;
    /** Fires once each time typing or pasting fills every field. */
    onComplete?: ((value: string) => void) | undefined;
    /** Accepted characters; numeric filters to digits and is the default. */
    type?: PinInputType | undefined;
    /** Renders the fields as password inputs so entered characters stay hidden. */
    mask?: boolean | undefined;
    /** Submits one hidden input carrying the joined code. */
    name?: string | undefined;
    form?: string | undefined;
    disabled?: boolean | undefined;
  };

/**
 * A one-time-code entry group. The root is a group and needs an accessible
 * name: pass aria-label (or aria-labelledby), and give each PinInputField its
 * own aria-label such as "Digit 1". Field order follows registration order,
 * kept in document position. With a name, one hidden input submits the
 * joined code.
 */
export function PinInput({
  as,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  type = "numeric",
  mask,
  name,
  form,
  disabled,
  children,
  ...props
}: PinInputProps) {
  const [pinValue, setPin, pinState] = useControllableState({ value, defaultValue, onChange });
  const collection = useCollection();
  const [order, setOrder] = useState<string[]>([]);
  const resolvedDisabled = Boolean(disabled);
  // Form resets are anchored on the first field, so an unnamed code still resets.
  const controlRef = useRef<HTMLInputElement | null>(null);
  useFormReset({
    controlRef,
    form,
    state: pinState,
    readValue: () =>
      collection
        .items()
        .map((item) => (item.element as HTMLInputElement).value)
        .join(""),
  });

  // Fields register in their own layout effects, which run before this one, so the order is
  // read once here and then kept current by the collection's change notifications.
  useLayoutEffect(() => {
    const syncOrder = () => {
      const first = collection.items()[0]?.element;
      controlRef.current = first instanceof HTMLInputElement ? first : null;
      setOrder((previous) => {
        const next = collection.items().map((item) => item.key);
        if (
          next.length === previous.length &&
          next.every((entry, index) => entry === previous[index])
        ) {
          return previous;
        }
        return next;
      });
    };
    syncOrder();
    return collection.subscribe(syncOrder);
  }, [collection]);

  const focusField = (index: number) => {
    const fields = collection.items();
    if (fields.length === 0) return;
    const clamped = Math.max(0, Math.min(index, fields.length - 1));
    fields[clamped]?.element?.focus();
  };

  const commit = (next: string) => {
    setPin(next);
    const count = collection.items().length;
    if (onComplete && count > 0 && next.length >= count && pinValue.length < count) {
      onComplete(next);
    }
  };

  const setCharacter = (index: number, character: string) => {
    const count = collection.items().length;
    const targetIndex = Math.min(index, pinValue.length);
    let next = pinValue.slice(0, targetIndex) + character + pinValue.slice(targetIndex + 1);
    if (count > 0) next = next.slice(0, count);
    commit(next);
    focusField(targetIndex + 1);
  };

  const clearCharacter = (index: number) => {
    commit(pinValue.slice(0, index) + pinValue.slice(index + 1));
  };

  const pasteCode = (index: number, text: string) => {
    const count = collection.items().length;
    const targetIndex = Math.min(index, pinValue.length);
    let next = pinValue.slice(0, targetIndex) + text;
    if (count > 0) next = next.slice(0, count);
    commit(next);
    focusField(targetIndex + text.length);
  };

  const Part = partElement(as, "div");
  return (
    <PinInputContext
      value={{
        value: pinValue,
        type,
        mask: Boolean(mask),
        disabled: resolvedDisabled,
        collection,
        order,
        setCharacter,
        clearCharacter,
        pasteCode,
        focusField,
      }}
    >
      <Part {...props} role="group" data-disabled={dataAttr(resolvedDisabled)}>
        <>
          {children}
          <FormValue name={name} form={form} value={pinValue} disabled={resolvedDisabled} />
        </>
      </Part>
    </PinInputContext>
  );
}
