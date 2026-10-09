import { useId, type ComponentProps, type PointerEvent } from "react";
import { dataAttr, useFocusRing } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useWarnOnce } from "../internal/dev.js";
import { visuallyHiddenInputStyle } from "../internal/visually-hidden-input.js";
import { useRatingContext } from "./rating-shared.js";

export type RatingItemProps = Omit<ComponentProps<"label">, "value"> &
  AsProp & {
    /** The rating this item stands for; fractional steps such as 0.5 are allowed. */
    value: number;
    inputProps?:
      | Omit<
          ComponentProps<"input">,
          "type" | "checked" | "defaultChecked" | "disabled" | "name" | "value" | "required"
        >
      | undefined;
  };

export function RatingItem({
  as,
  children,
  value,
  inputProps,
  onPointerEnter,
  ...props
}: RatingItemProps) {
  const warn = useWarnOnce();
  const id = useId();
  const rating = useRatingContext("RatingItem");
  const { focusProps, isFocused, isFocusVisible } = useFocusRing<HTMLInputElement>({
    disabled: rating.disabled,
  });
  const selected = rating.value === value;
  const active = value <= (rating.highlight ?? rating.value);

  if (!Number.isFinite(value) || value <= 0) {
    warn(
      `RatingItem:value:${value}`,
      `RatingItem value must be a positive finite number; received ${value}. It was skipped.`,
    );
    return null;
  }

  const Part = partElement(as, "label");
  return (
    <Part
      data-slot="rating-item"
      {...props}
      data-active={dataAttr(active)}
      data-selected={dataAttr(selected)}
      data-disabled={dataAttr(rating.disabled)}
      data-readonly={dataAttr(rating.readOnly)}
      data-focused={dataAttr(isFocused)}
      data-focus-visible={dataAttr(isFocusVisible)}
      onPointerEnter={(event: PointerEvent<HTMLLabelElement>) => {
        onPointerEnter?.(event);
        if (event.defaultPrevented) return;
        rating.setHighlight(value);
      }}
    >
      <>
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
      </>
    </Part>
  );
}
