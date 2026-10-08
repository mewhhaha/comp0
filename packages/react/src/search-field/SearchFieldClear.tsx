import { type ComponentProps, type MouseEvent } from "react";
import { disabledProps } from "../internal/disabled.js";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useSearchFieldContext } from "./search-field-shared.js";

export type SearchFieldClearProps = ComponentProps<"button"> & AsProp;

export function SearchFieldClear({
  as,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: SearchFieldClearProps) {
  const searchField = useSearchFieldContext();
  const resolvedDisabled = Boolean(disabled ?? searchField?.disabled);
  if (searchField?.value === "") return null;
  const isNativeButton = as === undefined || as === "button";
  const disabledAttributes = disabledProps<HTMLButtonElement>(resolvedDisabled, {
    native: isNativeButton,
    onKeyDown,
    onClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented) return;
      searchField?.inputRef.current?.focus();
      searchField?.clear();
    },
  });

  const Part = partElement(as, "button");
  return (
    <Part
      {...props}
      type={isNativeButton ? (props.type ?? "button") : undefined}
      {...disabledAttributes}
    />
  );
}
