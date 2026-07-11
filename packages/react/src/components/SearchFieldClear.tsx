import { dataAttr } from "@comp0/core";
import { useSearchFieldContext, type RefProp } from "../shared.js";
import { type SearchFieldClearProps } from "./text-field-shared.js";
export type { SearchFieldClearProps } from "./text-field-shared.js";

export function SearchFieldClear({
  disabled,
  onClick,
  ref,
  ...props
}: SearchFieldClearProps & RefProp<HTMLButtonElement>) {
  const searchField = useSearchFieldContext();
  const resolvedDisabled = Boolean(disabled ?? searchField?.disabled);

  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !resolvedDisabled) searchField?.clear();
      }}
    />
  );
}
