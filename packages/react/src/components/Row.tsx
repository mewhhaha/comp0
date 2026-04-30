import { type RefProp } from "../shared.js";
import { type HTMLAttributes } from "react";
import { dataAttr } from "@comp0/core";

export type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  selected?: boolean | undefined;
  disabled?: boolean | undefined;
};

export function Row({
  selected,
  disabled,
  ref,
  ...props
}: RowProps & RefProp<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      ref={ref}
      aria-disabled={disabled || undefined}
      aria-selected={selected ?? props["aria-selected"]}
      data-disabled={dataAttr(disabled)}
      data-selected={dataAttr(selected)}
    />
  );
}
