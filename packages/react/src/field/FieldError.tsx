import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { fieldFeedbackPart, useFieldContext } from "./field-shared.js";

export type FieldErrorProps = ComponentProps<"div"> &
  AsProp & {
    forceMount?: boolean | undefined;
  };

export function FieldError({ as, id, forceMount, ...props }: FieldErrorProps) {
  const field = useFieldContext();
  const mounted = Boolean(forceMount || field?.invalid);
  if (!mounted) return null;
  const Part = partElement(as, "div");
  return <Part {...props} id={id ?? field?.errorId} role="alert" />;
}

Object.assign(FieldError, { [fieldFeedbackPart]: "error" as const });
