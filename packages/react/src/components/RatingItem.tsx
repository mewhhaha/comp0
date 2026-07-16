import { useId, type InputHTMLAttributes, type LabelHTMLAttributes } from "react";
import { dataAttr, useFocusRing } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { visuallyHiddenInputStyle } from "./choices-shared.js";
import { useRatingContext } from "./rating-shared.js";

export type RatingItemProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "value"> & {
  /** The rating this item stands for; fractional steps such as 0.5 are allowed. */
  value: number;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked" | "defaultChecked" | "disabled" | "name" | "value" | "required"
  >;
};

export function RatingItem({
  children,
  value,
  inputProps,
  onPointerEnter,
  ref,
  ...props
}: RatingItemProps & RefProp<HTMLLabelElement>) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`RatingItem value must be a positive finite number; received ${value}.`);
  }
  const id = useId();
  const rating = useRatingContext("RatingItem");
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({
    disabled: rating.disabled,
  });
  const selected = rating.value === value;
  const active = value <= (rating.highlight ?? rating.value);

  return (
    <label
      {...props}
      ref={ref}
      data-slot={dataSlot(props, "rating-item")}
      data-active={dataAttr(active)}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(rating.disabled)}
      data-readonly={dataAttr(rating.readOnly)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.defaultPrevented) return;
        rating.setHighlight(value);
      }}
    >
      <input
        {...inputProps}
        id={inputProps?.id ?? id}
        style={{ ...visuallyHiddenInputStyle, ...inputProps?.style }}
        type="radio"
        name={rating.name}
        value={String(value)}
        checked={selected}
        disabled={rating.disabled}
        required={rating.required}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
          focusProps.onBlur?.(event);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (event.defaultPrevented) return;
          // React restores the controlled checked state, so a read-only
          // rating stays focusable while every change is discarded.
          if (rating.readOnly) return;
          if (event.currentTarget.checked) rating.setValue(value);
        }}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          focusProps.onFocus?.(event);
        }}
      />
      {children}
    </label>
  );
}
