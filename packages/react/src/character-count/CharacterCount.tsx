import { type ComponentProps, type ReactNode } from "react";
import { dataAttr } from "@comp0/core";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { useWarnOnce } from "../internal/dev.js";
import { fieldFeedbackPart, useFieldContext } from "../field/field-shared.js";

export type CharacterCountState = {
  count: number;
  maxLength: number;
  remaining: number;
  limitReached: boolean;
};

export type CharacterCountProps = Omit<ComponentProps<"output">, "children"> &
  AsProp & {
    maxLength: number;
    /** A function maps the derived count state to content; the default reads the remaining count. */
    children?: ReactNode | ((state: CharacterCountState) => ReactNode);
  };

export function CharacterCount({ as, children, maxLength, ...props }: CharacterCountProps) {
  const warn = useWarnOnce();
  const field = useFieldContext();
  if (!Number.isFinite(maxLength)) {
    warn(
      `CharacterCount:maxLength:${maxLength}`,
      `CharacterCount maxLength must be a non-negative integer; received ${maxLength}. It was not rendered.`,
    );
    return null;
  }
  if (!field?.textControl) {
    warn(
      "CharacterCount:outside-text-field",
      "CharacterCount must be rendered inside TextField. It was not rendered.",
    );
    return null;
  }
  if (field.value === undefined) {
    warn(
      "CharacterCount:unobserved-text",
      "CharacterCount requires TextField value, defaultValue, or onChange so it can observe the text. It was not rendered.",
    );
    return null;
  }
  let limit = maxLength;
  if (!Number.isInteger(maxLength) || maxLength < 0) {
    limit = Math.max(0, Math.trunc(maxLength));
    warn(
      `CharacterCount:maxLength:${maxLength}`,
      `CharacterCount maxLength must be a non-negative integer; received ${maxLength}. It was rounded to ${limit}.`,
    );
  }
  const characterCountId = field.characterCountId ?? `${field.controlId}-character-count`;
  const count = field.value.length;
  const remaining = limit - count;
  const state = { count, maxLength: limit, remaining, limitReached: remaining <= 0 };
  let content: ReactNode = `${remaining} characters remaining`;
  if (typeof children === "function") content = children(state);
  else if (children !== undefined) content = children;

  const Part = partElement(as, "output");
  return (
    <Part
      data-slot="character-count"
      {...props}
      id={props.id ?? characterCountId}
      htmlFor={props.htmlFor ?? field.controlId}
      aria-live={props["aria-live"] ?? "polite"}
      aria-atomic={props["aria-atomic"] ?? true}
      data-empty={dataAttr(count === 0)}
      data-limit-reached={dataAttr(state.limitReached)}
      data-count={count}
      data-remaining={remaining}
    >
      {content}
    </Part>
  );
}

Object.assign(CharacterCount, { [fieldFeedbackPart]: "character-count" as const });
