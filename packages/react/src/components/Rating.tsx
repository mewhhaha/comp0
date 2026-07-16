import { useId, useState, type HTMLAttributes } from "react";
import { dataAttr, useControllableState } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { RatingContext } from "./rating-shared.js";

export type RatingProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  /** Shared submission name for the item radios; generated when absent. */
  name?: string | undefined;
  value?: number | undefined;
  defaultValue?: number | undefined;
  /** Receives the next rating rather than a native ChangeEvent. */
  onChange?: ((value: number) => void) | undefined;
  disabled?: boolean | undefined;
  /** Requires one item in the group to be selected. */
  required?: boolean | undefined;
  /** Keeps the item radios focusable while preventing changes. */
  readOnly?: boolean | undefined;
};

export function Rating({
  children,
  name,
  value,
  defaultValue = 0,
  onChange,
  disabled,
  required,
  readOnly,
  onPointerLeave,
  ref,
  ...props
}: RatingProps & RefProp<HTMLDivElement>) {
  const generatedName = useId();
  const [selected, setSelected] = useControllableState({ value, defaultValue, onChange });
  const [highlight, setHighlight] = useState<number | null>(null);
  const resolvedDisabled = Boolean(disabled);
  const resolvedReadOnly = Boolean(readOnly);

  return (
    <RatingContext
      value={{
        name: name ?? generatedName,
        value: selected,
        highlight,
        disabled: resolvedDisabled,
        required: Boolean(required),
        readOnly: resolvedReadOnly,
        setValue: setSelected,
        setHighlight(next) {
          // A rating that cannot change must not preview one on hover.
          if (resolvedDisabled || resolvedReadOnly) return;
          setHighlight(next);
        },
      }}
    >
      <div
        {...props}
        ref={ref}
        data-slot={dataSlot(props, "rating")}
        data-disabled={dataAttr(resolvedDisabled)}
        data-readonly={dataAttr(resolvedReadOnly)}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (event.defaultPrevented) return;
          setHighlight(null);
        }}
      >
        {children}
      </div>
    </RatingContext>
  );
}
