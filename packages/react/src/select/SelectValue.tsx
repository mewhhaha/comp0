import { type ComponentProps, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useOptionalSelectContext } from "./select-shared.js";

export type SelectValueProps = ComponentProps<"span"> &
  AsProp & {
    value?: ReactNode;
    placeholder?: ReactNode;
  };

export function SelectValue({ as, value, placeholder, ...props }: SelectValueProps) {
  const select = useOptionalSelectContext();
  const resolvedValue = value ?? select?.selectedText;
  const isPlaceholder = resolvedValue === undefined || resolvedValue === "";

  const Part = partElement(as, "span");
  return (
    <Part {...props} data-placeholder={dataAttr(isPlaceholder)}>
      {isPlaceholder ? placeholder : resolvedValue}
    </Part>
  );
}
