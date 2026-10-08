import { type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent } from "react";
import { useComposedRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useEditableContext } from "./editable-shared.js";

export type EditableInputProps = Omit<ComponentProps<"input">, "value" | "defaultValue"> & AsProp;

export function EditableInput({
  as,
  disabled: disabledProp,
  onBlur,
  onChange,
  onKeyDown,
  ref,
  ...props
}: EditableInputProps) {
  const editable = useEditableContext("EditableInput");
  const disabled = Boolean(disabledProp ?? editable.disabled);
  const composedRef = useComposedRefs(ref, editable.inputRef);
  const Part = partElement(as, "input");
  return (
    <Part
      {...props}
      ref={composedRef}
      // Stays in the DOM while hidden so its native name always submits the
      // committed value, editing or not.
      hidden={!editable.open}
      disabled={disabled}
      value={editable.open ? editable.draft : editable.value}
      data-slot={dataSlot(props, "editable-input")}
      data-open={dataAttr(editable.open)}
      data-disabled={dataAttr(disabled)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        editable.setDraft(event.currentTarget.value);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !editable.open) return;
        if (event.key === "Enter") {
          // Consumed so committing does not also submit an enclosing form.
          event.preventDefault();
          editable.commit(event.currentTarget.value);
        }
        if (event.key === "Escape") {
          // Consumed so the same press does not also dismiss an enclosing layer.
          event.preventDefault();
          editable.cancel();
        }
      }}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
        if (event.defaultPrevented || !editable.open) return;
        editable.commit(event.currentTarget.value);
      }}
    />
  );
}
