import { type ComponentProps, type MouseEvent } from "react";
import { useComposedRefs, dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useEditableContext } from "./editable-shared.js";

export type EditableViewProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function EditableView({
  as,
  children,
  disabled: disabledProp,
  onClick,
  ref,
  ...props
}: EditableViewProps) {
  const editable = useEditableContext("EditableView");
  const disabled = Boolean(disabledProp ?? editable.disabled);
  const isNativeButton = as === undefined || as === "button";

  const composedRef = useComposedRefs(ref, editable.viewRef);
  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      ref={composedRef}
      type={isNativeButton ? "button" : undefined}
      hidden={editable.open}
      disabled={disabled}
      data-slot={dataSlot(props, "editable-view")}
      data-open={dataAttr(editable.open)}
      data-empty={dataAttr(editable.value === "")}
      data-disabled={dataAttr(disabled)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        editable.startEditing();
      }}
    >
      {children ?? editable.value}
    </Part>
  );
}
