import { Button, type ButtonProps } from "../button/Button.js";
import { useSuggestionsContext } from "./suggestions-shared.js";

export type SuggestionProps = Omit<ButtonProps, "value" | "command" | "commandfor" | "pending"> & {
  /** The text sent through the root's `onSend`. Its children are the visible label. */
  value: string;
};

/** One quick reply. */
export function Suggestion({ value, disabled, onClick, ...props }: SuggestionProps) {
  const suggestions = useSuggestionsContext("Suggestion");

  return (
    <Button
      data-slot="suggestion"
      {...props}
      data-value={value}
      disabled={Boolean(disabled) || suggestions.disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) suggestions.send(value);
      }}
    />
  );
}
