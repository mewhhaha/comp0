import { type InputHTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { useEditableContext } from "./editable-shared.js";

export type EditableInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue"
>;

export function EditableInput({
  disabled: disabledProp,
  onBlur,
  onChange,
  onKeyDown,
  ref,
  ...props
}: EditableInputProps & RefProp<HTMLInputElement>) {
  const editable = useEditableContext("EditableInput");
  const disabled = Boolean(disabledProp ?? editable.disabled);
  return (
    <input
      {...props}
      ref={composeRefs(ref, editable.inputRef)}
      // Stays in the DOM while hidden so its native name always submits the
      // committed value, editing or not.
      hidden={!editable.editing}
      disabled={disabled}
      value={editable.editing ? editable.draft : editable.value}
      data-slot={dataSlot(props, "editable-input")}
      data-editing={dataAttr(editable.editing)}
      data-disabled={dataAttr(disabled)}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) return;
        editable.setDraft(event.currentTarget.value);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || !editable.editing) return;
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
      onBlur={(event) => {
        onBlur?.(event);
        if (event.defaultPrevented || !editable.editing) return;
        editable.commit(event.currentTarget.value);
      }}
    />
  );
}
