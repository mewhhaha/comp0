import { type ComponentProps, type MouseEvent } from "react";
import { useComposedRefs, dataAttr } from "@comp0/core";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useEditableContext } from "./editable-shared.js";

export type EditableViewProps = Omit<ComponentProps<"button">, "type"> & AsProp;

export function EditableView({
  as,
  children,
  disabled: disabledProp,
  onClick,
  onKeyDown,
  ref,
  ...props
}: EditableViewProps) {
  const editable = useEditableContext("EditableView");
  const disabled = Boolean(disabledProp ?? editable.disabled);
  const isNativeButton = as === undefined || as === "button";
  const disabledAttributes = disabledProps<HTMLButtonElement>(disabled, {
    native: isNativeButton,
    onKeyDown,
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      editable.startEditing();
    },
  });

  const composedRef = useComposedRefs(ref, editable.viewRef);
  const Part = partElement(as, "button");
  return (
    <Part
      data-slot="editable-view"
      {...props}
      ref={composedRef}
      type={isNativeButton ? "button" : undefined}
      hidden={editable.open}
      data-open={dataAttr(editable.open)}
      data-empty={dataAttr(editable.value === "")}
      {...disabledAttributes}
    >
      {children ?? editable.value}
    </Part>
  );
}
