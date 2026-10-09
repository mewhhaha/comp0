import { type ComponentProps } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { SuggestionsContext } from "./suggestions-shared.js";

export type SuggestionsProps = ComponentProps<"div"> &
  AsProp & {
    /** Called with the `value` of the suggestion the user chose. */
    onSend?: ((value: string) => void) | undefined;
    /** Disables every suggestion, for example while a response is generating. */
    disabled?: boolean | undefined;
  };

/**
 * A labelled group of quick replies. Name it with `aria-label` or
 * `aria-labelledby`. Each suggestion is an ordinary button in the tab order,
 * so there are no hidden arrow-key conventions to discover.
 */
export function Suggestions({ as, onSend, disabled = false, ...props }: SuggestionsProps) {
  const Part = partElement(as, "div");
  return (
    <SuggestionsContext value={{ disabled, send: (value) => onSend?.(value) }}>
      <Part
        data-slot="suggestions"
        {...props}
        role={props.role ?? "group"}
        data-disabled={dataAttr(disabled)}
      />
    </SuggestionsContext>
  );
}
