import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { ToggleButtonGroup } from "../toggle-button/ToggleButtonGroup.js";

export type FeedbackValue = "good" | "bad";

export type FeedbackProps = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> &
  AsProp & {
    /** The current rating; the empty string means unrated. */
    value?: FeedbackValue | "" | undefined;
    defaultValue?: FeedbackValue | "" | undefined;
    /** Receives the next rating ("" when the user withdraws it) rather than a DOM ChangeEvent. */
    onChange?: ((value: FeedbackValue | "") => void) | undefined;
  };

/**
 * Rates a response with an exclusive pair of toggle buttons. Name the group
 * with `aria-label`, such as "Rate this response".
 */
export function Feedback({ value, defaultValue, onChange, ...props }: FeedbackProps) {
  return (
    <ToggleButtonGroup
      data-slot="feedback"
      {...props}
      type="single"
      value={value}
      defaultValue={defaultValue}
      onChange={(next) => onChange?.(next as FeedbackValue | "")}
    />
  );
}
