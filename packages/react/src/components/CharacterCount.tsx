import { type OutputHTMLAttributes, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { dataSlot, type RefProp } from "../shared.js";
import { fieldFeedbackPart, useFieldContext } from "./field-shared.js";

export type CharacterCountState = {
  count: number;
  maxLength: number;
  remaining: number;
  limitReached: boolean;
};

export type CharacterCountProps = Omit<OutputHTMLAttributes<HTMLOutputElement>, "children"> & {
  maxLength: number;
  children?: ReactNode | ((state: CharacterCountState) => ReactNode);
};

export function CharacterCount({
  children,
  maxLength,
  ref,
  ...props
}: CharacterCountProps & RefProp<HTMLOutputElement>) {
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    throw new Error(
      `CharacterCount maxLength must be a non-negative integer; received ${maxLength}.`,
    );
  }
  const field = useFieldContext();
  if (!field?.textControl) throw new Error("CharacterCount must be rendered inside TextField.");
  if (field.value === undefined) {
    throw new Error(
      "CharacterCount requires TextField value, defaultValue, or onChange so it can observe the text.",
    );
  }
  const characterCountId = field.characterCountId ?? `${field.controlId}-character-count`;
  const count = field.value.length;
  const remaining = maxLength - count;
  const state = { count, maxLength, remaining, limitReached: remaining <= 0 };
  let content: ReactNode = `${remaining} characters remaining`;
  if (typeof children === "function") content = children(state);
  else if (children !== undefined) content = children;

  return (
    <output
      {...props}
      ref={ref}
      id={props.id ?? characterCountId}
      htmlFor={props.htmlFor ?? field.controlId}
      aria-live={props["aria-live"] ?? "polite"}
      aria-atomic={props["aria-atomic"] ?? true}
      data-empty={dataAttr(count === 0)}
      data-limit-reached={dataAttr(state.limitReached)}
      data-count={count}
      data-remaining={remaining}
      data-slot={dataSlot(props, "character-count")}
    >
      {content}
    </output>
  );
}

Object.assign(CharacterCount, { [fieldFeedbackPart]: "character-count" as const });
