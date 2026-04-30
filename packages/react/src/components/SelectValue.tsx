import { dataAttr } from "@comp0/core";
import { useSelectRootContext, type RefProp } from "../shared.js";
import { type SelectValueProps } from "./pickers-shared.js";
export type { SelectValueProps } from "./pickers-shared.js";
export function SelectValue({
  value,
  placeholder,
  ref,
  ...props
}: SelectValueProps & RefProp<HTMLSpanElement>) {
  const select = useSelectRootContext();
  const resolvedValue = value ?? select?.selectedText;
  const isPlaceholder = resolvedValue === undefined || resolvedValue === "";

  return (
    <span {...props} ref={ref} data-placeholder={dataAttr(isPlaceholder)}>
      {isPlaceholder ? placeholder : resolvedValue}
    </span>
  );
}
