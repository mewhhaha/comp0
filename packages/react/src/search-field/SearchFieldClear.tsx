import { type ComponentProps, type MouseEvent } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useSearchFieldContext } from "./search-field-shared.js";

export type SearchFieldClearProps = ComponentProps<"button"> & AsProp;

export function SearchFieldClear({ as, disabled, onClick, ...props }: SearchFieldClearProps) {
  const searchField = useSearchFieldContext();
  const resolvedDisabled = Boolean(disabled ?? searchField?.disabled);
  if (searchField?.value === "") return null;
  const isNativeButton = as === undefined || as === "button";

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      disabled={resolvedDisabled}
      data-disabled={dataAttr(resolvedDisabled)}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || resolvedDisabled) return;
        searchField?.inputRef.current?.focus();
        searchField?.clear();
      }}
    />
  );
}
