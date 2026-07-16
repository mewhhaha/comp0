import { type ButtonHTMLAttributes } from "react";
import { composeRefs, dataAttr } from "@comp0/core";
import {
  dataSlot,
  resolveChildren,
  resolveClassName,
  type RefProp,
  type StateChildren,
  type StateClassName,
} from "../shared.js";
import { useEditableContext } from "./editable-shared.js";

export type EditableViewState = {
  value: string;
  editing: boolean;
};

export type EditableViewProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "type"
> & {
  children?: StateChildren<EditableViewState>;
  className?: StateClassName<EditableViewState>;
};

export function EditableView({
  children,
  className,
  disabled: disabledProp,
  onClick,
  ref,
  ...props
}: EditableViewProps & RefProp<HTMLButtonElement>) {
  const editable = useEditableContext("EditableView");
  const disabled = Boolean(disabledProp ?? editable.disabled);
  const state = { value: editable.value, editing: editable.editing };
  return (
    <button
      {...props}
      ref={composeRefs(ref, editable.viewRef)}
      type="button"
      hidden={editable.editing}
      disabled={disabled}
      className={resolveClassName(className, state)}
      data-slot={dataSlot(props, "editable-view")}
      data-editing={dataAttr(editable.editing)}
      data-empty={dataAttr(editable.value === "")}
      data-disabled={dataAttr(disabled)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        editable.startEditing();
      }}
    >
      {resolveChildren(children, state) ?? editable.value}
    </button>
  );
}
